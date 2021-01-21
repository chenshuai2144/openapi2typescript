/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-lonely-if */
/* eslint-disable no-param-reassign */
import path from 'path';
import fs from 'fs';
import * as prettier from 'prettier';
import { camelCase, upperFirst } from 'lodash';

const { prettier: defaultPrettierOptions } = require('@umijs/fabric');

export const getAbsolutePath = (filePath: string) => {
  if (filePath && !path.isAbsolute(filePath)) {
    return path.join(process.cwd(), filePath);
  }
  return filePath;
};

export const mkdir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    mkdir(path.dirname(dir));
    fs.mkdirSync(dir);
  }
};

export const prettierFile = (content: string, fileType: 'ts' | 'js'): [string, boolean] => {
  let result = content;
  let hasError = false;
  try {
    result = prettier.format(content, {
      singleQuote: true,
      trailingComma: 'all',
      printWidth: 100,
      parser: fileType === 'js' ? 'babel' : 'typescript',
      ...defaultPrettierOptions,
    });
  } catch (error) {
    hasError = true;
  }
  return [result, hasError];
};

export const writeFile = (folderPath: string, fileName: string, content: string) => {
  // const filePath = path.join(process.cwd(), folderPath, fileName);
  const filePath = path.join(folderPath, fileName);
  mkdir(path.dirname(filePath));
  const [prettierContent, hasError] = prettierFile(content, 'ts');
  fs.writeFileSync(filePath, prettierContent, {
    encoding: 'utf8',
  });
  return hasError;
};

export const getTagName = (name: string) => {
  const result = name.split('.');
  // 数据源中的 tag 等同于全量的 op API 名，确定为 4-5 段，如上格式
  // 取中间的 1-2 字段作为 tag，作为 serviceController 创建目录的依据
  if (result.length === 4) {
    return result[2];
  }
  if (result.length === 5) {
    return result[2] + upperFirst(result[3]);
  }
  return name;
};

/**
 * 根据当前的数据源类型，对请求回来的 apiInfo 进行格式化
 * 如果是 op 数据源，对 tags 以及 path 中的 tags 进行处理
 * - before: 前缀（产品集.产品码） + 操作对象（必填）+ 子操作对象（可选）+ 动作（必填）
 * - after: 操作对象（必填）+ 子操作对象（可选） ==> 驼峰
 */
export const formatApiInfo = (apiInfo: Record<string, any>): any => {
  if (
    !(
      apiInfo &&
      apiInfo.schema.info &&
      apiInfo.schema.info.extensions &&
      apiInfo.schema.info.extensions['x-antTech-description']
    )
  ) {
    // 非 op 数据源，直接返回
    return apiInfo;
  }

  apiInfo.schema.tags = apiInfo.schema.tags.map((item: Record<string, string>) => {
    return {
      ...item,
      name: getTagName(item.name),
    };
  });

  for (const child_path in apiInfo.schema.paths) {
    apiInfo.schema.paths[child_path].post.tags = apiInfo.schema.paths[
      child_path
    ].post.tags.map((tag: string) => getTagName(tag));
  }

  return apiInfo;
};

type serviceParam = {
  title: string;
  type: string;
  description: string;
  default: string;
  [key: string]: any;
};

type serviceParams = Record<string, serviceParam>;
/**
 * 一方化场景下，由于 onex 会对请求的响应做处理
 *  1. 将 Response & Request 中的参数字段会变更为小驼峰写法
 *  onex 相关代码 ： http://gitlab.alipay-inc.com/one-console/sdk/blob/master/src/request.ts#L110
 *  2. 另外要注意：
 *  op 返回的数据，请求参数的类型格式 需要做额外的处理
 *  - (name) key.n, (type) string  ==> key: string []
 *  - (name) key.m,  (type) string ===>  key: string []
 *  - (name) key.key1 , (type) string ==> key: {key1:string}
 *  - (name) key.n.key1 ,(type) string => key:{ key1 :string}[]
 *  - (name) key.n.key1.m,(type) string ==> key:{key1: string[]}[]
 */
export function formatParamsForYFH(
  params: serviceParams,
  paramsObject: serviceParams = {}
): serviceParams {
  Object.keys(params).forEach((name) => {
    const prop = params[name];
    let key = name;
    const nameList = name.split('.');
    const nameListLength = nameList.length;

    if (nameListLength === 1) {
      // 正常的 key
      paramsObject[key] = { ...prop };
    } else if (nameListLength === 2 && nameList[1] !== 'n' && nameList[1] !== 'm') {
      const [childKey] = nameList;
      // key.child_key
      const key_child_key = camelCase(nameList[1]);
      paramsObject[childKey] = combineParams(childKey, key_child_key, prop, paramsObject);
    } else {
      // key.n.child_key
      if (nameList[nameListLength - 2] === 'n' || nameList[nameListLength - 2] === 'm') {
        const child_key = camelCase(nameList.pop());
        nameList.pop();
        key = nameList.join('.');
        paramsObject[key] = combineParams(key, child_key, prop, paramsObject, '.n.key');
      } else {
        const child_key = camelCase(nameList.pop());
        key = nameList.join('.');

        // .key.n
        if (child_key === 'n' || child_key === 'm') {
          // .n.key.m
          if (nameList[nameList.length - 2] === 'n' || nameList[nameList.length - 2] === 'm') {
            const child_child_key = camelCase(nameList.pop());
            nameList.pop();
            key = nameList.join('.');
            paramsObject[key] = combineParams(key, child_child_key, prop, paramsObject, '.n.key.m');
          } else {
            prop.type = `${prop.type}[]`;
            paramsObject[key] = { ...prop };
          }
        } else {
          paramsObject[key] = combineParams(key, child_key, prop, paramsObject);
        }
      }
    }

    paramsObject[key].name = camelCase(key);
  });

  const hasInvoke = Object.keys(paramsObject).filter((param) => param.includes('.')).length > 0;

  if (hasInvoke) {
    // 递归
    return formatParamsForYFH(paramsObject);
  }
  return paramsObject;
}

function combineParams(
  key: string,
  child_key: string,
  prop: serviceParam,
  paramsObject: serviceParams,
  type?: string
): serviceParam {
  const typeSuffix = type === '.n.key.m' ? '[]' : '';
  const keySuffix = type === '.n.key' || type === '.n.key.m' ? '[]' : '';
  if (paramsObject[key]) {
    const child_type = `{${child_key}:${prop.type}${typeSuffix}, ${paramsObject[key].type.slice(
      1
    )}`;
    paramsObject[key] = {
      ...paramsObject[key],
      type: child_type,
    };
  } else {
    paramsObject[key] = {
      ...prop,
      type: `{${child_key}:${prop.type}
      }${keySuffix}`,
    };
  }

  return paramsObject[key];
}

export const stripDot = (str: string) => {
  return str.replace(/[-_ .](\w)/g, (_all, letter) => letter.toUpperCase());
};
