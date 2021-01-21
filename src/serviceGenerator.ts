import { readFileSync, existsSync } from 'fs';
import * as nunjucks from 'nunjucks';
import chalk from 'chalk';
import glob from 'glob';
import rimraf from 'rimraf';
import type {
  OpenAPIObject,
  SchemaObject,
  ReferenceObject,
  ParameterObject,
  RequestBodyObject,
  ContentObject,
  ResponseObject,
  ResponsesObject,
  OperationObject,
  PathItemObject,
} from 'openapi3-ts';
import { flatten, uniqBy } from 'lodash';
import ReservedDict from 'reserved-words';
import { join } from 'path';
import Log from './log';

import { writeFile, stripDot } from './util';
import type { GenerateServiceProps } from './index';

const BASE_DIRS = ['service', 'services'];
const debug = require('debug')('openapi-generator');

const ONLY_USE_NAME_AS_ENUM_APP_LIST = ['alphad', 'zmyschecker'];

export type TypescriptFileType = 'interface' | 'serviceController' | 'serviceIndex';

export interface APIDataType extends OperationObject {
  path: string;
  method: string;
}

export type TagAPIDataType = Record<string, APIDataType[]>;

export interface MappingItemType {
  antTechApi: string;
  popAction: string;
  popProduct: string;
  antTechVersion: string;
}

export interface ControllerType {
  fileName: string;
  controllerName: string;
}

export const getPath = () => {
  const cwd = process.cwd();
  return existsSync(join(cwd, 'src')) ? join(cwd, 'src') : cwd;
};

// 类型声明过滤关键字
const resolveTypeName = (typeName: string) => {
  if (ReservedDict.check(typeName)) {
    return `__oneapi__${typeName}`;
  }
  return typeName;
};

function getRefName(refObject: any): string {
  if (typeof refObject !== 'object' || !refObject.$ref) {
    return refObject;
  }
  const refPaths = refObject.$ref.split('/');
  return resolveTypeName(refPaths[refPaths.length - 1]) as string;
}

const getType = (schemaObject: SchemaObject | undefined, namespace: string = ''): string => {
  if (schemaObject === undefined || schemaObject === null) {
    return 'any';
  }
  if (typeof schemaObject !== 'object') {
    return schemaObject;
  }
  if (schemaObject.$ref) {
    return [namespace, getRefName(schemaObject)].filter((s) => s).join('.');
  }

  let { type } = schemaObject as any;

  const numberEnum = [
    'int64',
    'integer',
    'long',
    'float',
    'double',
    'number',
    'int',
    'float',
    'double',
    'int32',
    'int64',
  ];

  const dateEnum = ['Date', 'date', 'dateTime', 'date-time', 'datetime'];

  const stringEnum = ['string', 'email', 'password', 'url', 'byte', 'binary'];

  if (numberEnum.includes(schemaObject.format)) {
    type = 'number';
  }

  if (schemaObject.enum) {
    type = 'enum';
  }

  if (numberEnum.includes(type)) {
    return 'number';
  }

  if (dateEnum.includes(type)) {
    return 'Date';
  }

  if (stringEnum.includes(type)) {
    return 'string';
  }

  if (type === 'boolean') {
    return 'boolean';
  }

  if (type === 'array') {
    let { items } = schemaObject;
    if (schemaObject.schema) {
      items = schemaObject.schema.items;
    }

    if (Array.isArray(items)) {
      const arrayItemType = (items as any)
        .map((subType) => getType(subType.schema || subType, namespace))
        .toString();
      return `[${arrayItemType}]`;
    }
    return `${getType(items, namespace)}[]`;
  }

  if (type === 'enum') {
    return Array.isArray(schemaObject.enum)
      ? Array.from(
          new Set(
            schemaObject.enum.map((v) =>
              typeof v === 'string' ? `"${v.replace(/"/g, '"')}"` : getType(v),
            ),
          ),
        ).join(' | ')
      : 'string';
  }

  if (schemaObject.oneOf && schemaObject.oneOf.length) {
    return schemaObject.oneOf.map((item) => getType(item, namespace)).join(' | ');
  }
  if (schemaObject.type === 'object' || schemaObject.properties) {
    if (!Object.keys(schemaObject.properties || {}).length) {
      return 'Record<string, any>';
    }
    return `{ ${Object.keys(schemaObject.properties)
      .map((key) => {
        const required =
          'required' in (schemaObject.properties[key] || {})
            ? ((schemaObject.properties[key] || {}) as any).required
            : false;
        return `${key}${required ? '' : '?'}: ${getType(
          schemaObject.properties && schemaObject.properties[key],
          namespace,
        )}; `;
      })
      .join('')}}`;
  }
  return 'any';
};

export const getGenInfo = (isDirExist: boolean, appName: string, absSrcPath: string) => {
  // dir 不存在，则没有占用，且为第一次
  if (!isDirExist) {
    return [false, true];
  }
  const indexList = glob.sync(`@(${BASE_DIRS.join('|')})/${appName}/index.@(js|ts)`, {
    cwd: absSrcPath,
  });
  // dir 存在，且 index 存在
  if (indexList && indexList.length) {
    const indexFile = join(absSrcPath, indexList[0]);
    try {
      const line = (readFileSync(indexFile, 'utf-8') || '').split(/\r?\n/).slice(0, 3).join('');
      // dir 存在，index 存在， 且 index 是我们生成的。则未占用，且不是第一次
      if (line.includes('// API 更新时间：')) {
        return [false, false];
      }
      // dir 存在，index 存在，且 index 内容不是我们生成的。此时如果 oneapi 子文件存在，就不是第一次，否则是第一次
      return [true, !existsSync(join(indexFile, 'oneapi'))];
    } catch (e) {
      // 因为 glob 已经拿到了这个文件，但没权限读，所以当作 dirUsed, 在子目录重新新建，所以当作 firstTime
      return [true, true];
    }
  }
  // dir 存在，index 不存在, 冲突，第一次要看 dir 下有没有 oneapi 文件夹
  return [
    true,
    !(
      existsSync(join(absSrcPath, BASE_DIRS[0], appName, 'oneapi')) ||
      existsSync(join(absSrcPath, BASE_DIRS[1], appName, 'oneapi'))
    ),
  ];
};

const DEFAULT_SCHEMA: SchemaObject = {
  type: 'object',
  properties: { id: { type: 'number' } },
};

class ServiceGenerator {
  protected apiData: TagAPIDataType = {};

  protected classNameList: ControllerType[] = [];

  protected version: string;

  protected mappings: MappingItemType[] = [];

  protected finalPath: string;

  protected config: GenerateServiceProps;
  protected openAPIData: OpenAPIObject;

  constructor(config: GenerateServiceProps, openAPIData: OpenAPIObject) {
    this.finalPath = '';
    this.config = {
      projectName: 'api',
      ...config,
    };
    this.openAPIData = openAPIData;
    const { info } = openAPIData;
    const basePath = '';
    this.version = info.version;
    Object.keys(openAPIData.paths || {}).forEach((p) => {
      const pathItem: PathItemObject = openAPIData.paths[p];
      ['get', 'put', 'post', 'delete', 'patch'].forEach((method) => {
        const operationObject: OperationObject = pathItem[method];
        if (!operationObject) {
          return;
        }

        (operationObject.tags || []).forEach((tag) => {
          if (!this.apiData[tag]) {
            this.apiData[tag] = [];
          }
          this.apiData[tag].push({
            path: `${basePath}${p}`,
            method,
            ...operationObject,
          });
        });
      });
    });
  }

  public genFile() {
    const basePath = this.config.serversPath || './src/service';
    try {
      const finalPath = join(basePath, this.config.projectName);

      this.finalPath = finalPath;
      glob
        .sync(`${finalPath}/**/*`)
        .filter((ele) => !ele.includes('_deperated'))
        .forEach((ele) => {
          rimraf.sync(ele);
        });
    } catch (error) {
      Log(`[OneAPI] generating service failed: ${error}`);
    }

    // 生成 ts 类型声明
    debug('[GenSDK] gen interface.');
    this.genFileFromTemplate('typings.d.ts', 'interface', {
      namespace: this.config.namespace,
      // namespace: 'API',
      list: this.getInterfaceTP(),
      disableTypeCheck: false,
    });
    // 生成 controller 文件
    const prettierError = [];
    // 生成 service 统计
    this.getServiceTP().forEach((tp) => {
      debug('[GenSDK] generate service:', tp.className);
      // 根据当前数据源类型选择恰当的 controller 模版
      const template = 'serviceController';
      const hasError = this.genFileFromTemplate(
        this.getFinalFileName(`${tp.className}.ts`),
        template,
        {
          namespace: this.config.namespace,
          requestImportStatement: this.config.requestImportStatement,
          disableTypeCheck: false,
          ...tp,
        },
      );
      prettierError.push(hasError);
    });

    if (prettierError.includes(true)) {
      Log(`${chalk.red('[OneAPI]')} 格式化失败，请检查 service 文件内可能存在的语法错误`);
    }
    // 生成 index 文件
    this.genFileFromTemplate(`index.ts`, 'serviceIndex', {
      list: this.classNameList,
      disableTypeCheck: false,
    });

    // 打印日志
    Log(`[OneAPI]: 成功生成 service 文件`);
  }

  public getServiceTP() {
    return Object.keys(this.apiData)
      .map((tag) => {
        // functionName tag 级别防重
        const tmpFunctionRD: Record<string, number> = {};

        const genParams = this.apiData[tag]
          .filter(
            (api) =>
              // 暂不支持变量
              !api.path.includes('${'),
          )
          .map((api) => {
            const newApi = api;
            try {
              const allParams = this.getParamsTP(newApi.parameters);
              const { file, ...params } = allParams || {};
              const body = this.getBodyTP(newApi.requestBody);
              const response = this.getResponseTP(newApi.responses);
              let formData = false;
              if ((body && (body.mediaType || '').includes('form')) || file) {
                formData = true;
              }

              let functionName =
                this.config.hook && this.config.hook.customFunctionName
                  ? this.config.hook.customFunctionName(newApi)
                  : this.resolveFunctionName(stripDot(newApi.operationId), newApi.method);

              if (functionName && tmpFunctionRD[functionName]) {
                functionName = `${functionName}_${(tmpFunctionRD[functionName] += 1)}`;
              } else if (functionName) {
                tmpFunctionRD[functionName] = 1;
              }

              let formattedPath = newApi.path.replace(
                /:([^/]*)|{([^}]*)}/gi,
                (_, str, str2) => `$\{${str || str2}}`,
              );
              if (newApi.extensions && newApi.extensions['x-antTech-description']) {
                const { extensions } = newApi;
                const { apiName, antTechVersion, productCode, antTechApiName } = extensions[
                  'x-antTech-description'
                ];
                formattedPath = antTechApiName || formattedPath;
                this.mappings.push({
                  antTechApi: formattedPath,
                  popAction: apiName,
                  popProduct: productCode,
                  antTechVersion,
                });
                newApi.antTechVersion = antTechVersion;
              }

              // 为 path 中的 params 添加 alias
              const escapedPathParams = ((params || {}).path || []).map((ele, index) => ({
                ...ele,
                alias: `param${index}`,
              }));
              if (escapedPathParams.length) {
                escapedPathParams.forEach((param) => {
                  formattedPath = formattedPath.replace(`$\{${param.name}}`, `$\{${param.alias}}`);
                });
              }

              const finalParams =
                escapedPathParams && escapedPathParams.length
                  ? { ...params, path: escapedPathParams }
                  : params;

              // 处理 query 中的复杂对象
              if (finalParams && finalParams.query) {
                finalParams.query = finalParams.query.map((ele) => ({
                  ...ele,
                  isComplexType: ele.isObject,
                }));
              }

              const getPrefixPath = () => {
                if (!this.config.apiPrefix) {
                  return formattedPath;
                }
                // 静态 apiPrefix
                const prefix =
                  typeof this.config.apiPrefix === 'function'
                    ? `${this.config.apiPrefix({
                        path: formattedPath,
                        method: newApi.method,
                        namespace: tag,
                        functionName,
                      })}`.trim()
                    : this.config.apiPrefix.trim();

                if (!prefix) {
                  return formattedPath;
                }

                if (prefix.startsWith("'") || prefix.startsWith('"') || prefix.startsWith('`')) {
                  const finalPrefix = prefix.slice(1, prefix.length - 1);
                  if (
                    formattedPath.startsWith(finalPrefix) ||
                    formattedPath.startsWith(`/${finalPrefix}`)
                  ) {
                    return formattedPath;
                  }
                  return `${finalPrefix}${formattedPath}`;
                }
                // prefix 变量
                return `$\{${prefix}}${formattedPath}`;
              };

              return {
                ...newApi,
                functionName,
                path: getPrefixPath(),
                pathInComment: formattedPath.replace(/\*/g, '&#42;'),
                hasPathVariables: formattedPath.includes('{'),
                hasApiPrefix: !!this.config.apiPrefix,
                method: newApi.method,
                // 如果 functionName 和 summary 相同，则不显示 summary
                desc:
                  functionName === newApi.summary
                    ? newApi.description
                    : [newApi.summary, newApi.description].filter((s) => s).join(' '),
                hasHeader: !!(params && params.header) || !!(body && body.mediaType),
                params: finalParams,
                hasParams: Boolean(Object.keys(finalParams || {}).length),
                body,
                file,
                hasFormData: formData,
                response,
              };
            } catch (error) {
              console.warn('[GenSDK] gen service param error:', error);
              throw error;
            }
          });

        const fileName = this.replaceDot(tag);

        if (genParams.length) {
          this.classNameList.push({
            fileName,
            controllerName: fileName,
          });
        }

        return {
          genType: 'ts',
          className: fileName,
          instanceName: `${fileName[0].toLowerCase()}${fileName.substr(1)}`,
          list: genParams,
        };
      })
      .filter((ele) => !!ele.list.length);
  }

  public getBodyTP(requestBody: any = {}) {
    const reqBody: RequestBodyObject = this.resolveRefObject(requestBody);
    if (!reqBody) {
      return null;
    }
    const reqContent: ContentObject = reqBody.content;
    if (typeof reqContent !== 'object') {
      return null;
    }
    let mediaType = Object.keys(reqContent)[0];

    const schema: SchemaObject = reqContent[mediaType].schema || DEFAULT_SCHEMA;

    if (mediaType === '*/*') {
      mediaType = '';
    }
    // 如果 requestBody 有 required 属性，则正常展示；如果没有，默认非必填
    const required = typeof requestBody.required === 'boolean' ? requestBody.required : false;
    if (schema.type === 'object' && schema.properties) {
      const propertiesList = Object.keys(schema.properties).map((p) => {
        if (schema.properties && schema.properties[p]) {
          return {
            key: p,
            schema: {
              ...schema.properties[p],
              type: getType(schema.properties[p], this.config.namespace),
            },
          };
        }
        return undefined;
      });
      return {
        mediaType,
        ...schema,
        required,
        propertiesList,
      };
    }
    return {
      mediaType,
      required,
      type: getType(schema, this.config.namespace),
    };
  }

  public getResponseTP(responses: ResponsesObject = {}) {
    const response: ResponseObject | undefined =
      responses && this.resolveRefObject(responses.default || responses['200']);
    const defaultResponse = {
      mediaType: '*/*',
      type: 'any',
    };
    if (!response) {
      return defaultResponse;
    }
    const resContent: ContentObject | undefined = response.content;
    const mediaType = Object.keys(resContent || {})[0];
    if (typeof resContent !== 'object' || !mediaType) {
      return defaultResponse;
    }
    const schema = resContent[mediaType].schema || DEFAULT_SCHEMA;

    let responseType = mediaType;
    if (mediaType === 'application/json') {
      responseType = '';
    } else if (mediaType === 'text/plain') {
      responseType = 'text';
    }

    return {
      mediaType,
      responseType,
      type: getType(schema, this.config.namespace),
    };
  }

  public getParamsTP(
    parameters: (ParameterObject | ReferenceObject)[] = [],
  ): Record<string, ParameterObject[]> {
    if (!parameters || !parameters.length) {
      return {};
    }

    const templateParams: Record<string, ParameterObject[]> = {};
    ['query', 'header', 'path', 'cookie', 'file'].forEach((source) => {
      const params = parameters
        .map((p) => this.resolveRefObject(p))
        .filter((p: ParameterObject) => p.in === source)
        .map((p) => {
          const isDirectObject = ((p.schema || {}).type || p.type) === 'object';
          const refList = ((p.schema || {}).$ref || p.$ref || '').split('/');
          const ref = refList[refList.length - 1];
          const deRefObj = (Object.entries(this.openAPIData.components.schemas || {}).find(
            ([k]) => k === ref,
          ) || []) as any;
          const isRefObject = (deRefObj[1] || {}).type === 'object';
          return {
            ...p,
            isObject: isDirectObject || isRefObject,
            type: getType(p.schema || DEFAULT_SCHEMA, this.config.namespace),
          };
        });

      if (params.length) {
        templateParams[source] = params;
      }
    });

    return templateParams;
  }

  public getInterfaceTP() {
    const { components } = this.openAPIData;
    const data =
      components &&
      [components.schemas].map((defines) => {
        if (!defines) {
          return null;
        }

        return Object.keys(defines).map((typeName) => {
          const result = this.resolveObject(defines[typeName]);
          const getDefinesType = () => {
            if (result.type) {
              return (defines[typeName] as SchemaObject).type === 'object';
            }
            return 'Record<string, any>';
          };
          return {
            typeName: resolveTypeName(typeName),
            type: getDefinesType(),
            parent: result.parent,
            props: result.props || [],
          };
        });
      });

    return data && data.reduce((p, c) => p && c && p.concat(c), []);
  }

  private genFileFromTemplate(
    fileName: string,
    type: TypescriptFileType,
    params: Record<string, any>,
  ): boolean {
    try {
      const template = this.getTemplate(type);
      // 设置输出不转义
      nunjucks.configure({
        autoescape: false,
      });

      return writeFile(this.finalPath, fileName, nunjucks.renderString(template, params));
    } catch (error) {
      console.warn('[GenSDK] file gen fail:', fileName, 'type:', type);
      throw error;
    }
  }

  private getTemplate(type: 'interface' | 'serviceController' | 'serviceIndex'): string {
    return readFileSync(join(__dirname, '../', 'templates', `${type}.njk`), 'utf8');
  }

  // 获取 TS 类型的属性列表
  getProps(schemaObject: SchemaObject) {
    const requiredPropKeys = schemaObject.required;
    return schemaObject.properties
      ? Object.keys(schemaObject.properties).map((propName) => {
          const schema: SchemaObject =
            (schemaObject.properties && schemaObject.properties[propName]) || DEFAULT_SCHEMA;
          return {
            ...schema,
            name: propName,
            type: getType(schema),
            desc: [schema.title, schema.description].filter((s) => s).join(' '),
            // 如果没有 required 信息，默认全部是非必填
            required: requiredPropKeys ? requiredPropKeys.some((key) => key === propName) : false,
          };
        })
      : [];
  }

  resolveObject(schemaObject: SchemaObject) {
    // 引用类型
    if (schemaObject.$ref) {
      return this.resolveRefObject(schemaObject);
    }
    // 枚举类型
    if (schemaObject.enum) {
      return this.resolveEnumObject(schemaObject);
    }
    // 继承类型
    if (schemaObject.allOf && schemaObject.allOf.length) {
      return this.resolveAllOfObject(schemaObject);
    }
    // 对象类型
    if (schemaObject.properties) {
      return this.resolveProperties(schemaObject);
    }
    // 数组类型
    if (schemaObject.items && schemaObject.type === 'array') {
      return this.resolveArray(schemaObject);
    }
    return schemaObject;
  }

  resolveArray(schemaObject: SchemaObject) {
    if (schemaObject.items.$ref) {
      const refObj = schemaObject.items.$ref.split('/');
      return {
        type: `${refObj[refObj.length - 1]}[]`,
      };
    }
    // TODO: 这里需要解析出具体属性，但由于 parser 层还不确定，所以暂时先返回 any
    return 'any[]';
  }

  resolveProperties(schemaObject: SchemaObject) {
    return {
      props: this.getProps(schemaObject),
    };
  }

  resolveEnumObject(schemaObject: SchemaObject) {
    let enumArray;

    if (schemaObject.extensions && schemaObject.extensions['x-enum-fields']) {
      const enumSet = new Set();
      // 如果存在 x-enum-fields，优先读 x-enum-fields 的信息
      Object.entries(schemaObject.extensions['x-enum-fields']).forEach(
        ([enumName, enumDef]: [string, any]) => {
          // 由于 Java Enum 中生效的字段不确定
          // 所以将 enum extensions 里面的有效字段全部塞进 enumArray，交给用户自己选择
          // 只有白名单以外的应用才走这个逻辑
          if (!ONLY_USE_NAME_AS_ENUM_APP_LIST.includes(this.config.projectName)) {
            if (enumDef.value !== undefined && enumDef.value !== null) {
              enumSet.add(enumDef.value);
            }
            if (enumDef.code !== undefined && enumDef.code !== null) {
              enumSet.add(enumDef.code);
            }
          }
          enumSet.add(enumName);
        },
      );
      enumArray = Array.from(enumSet);
    } else {
      // 如果没有 x-enum-fields，降级为 enum 字段
      enumArray = schemaObject.enum;
    }
    const enumStr = Array.from(
      new Set(
        enumArray.map((v) => (typeof v === 'string' ? `"${v.replace(/"/g, '"')}"` : getType(v))),
      ),
    ).join(' | ');

    return {
      type: Array.isArray(enumArray) ? enumStr : 'string',
    };
  }

  resolveAllOfObject(schemaObject: SchemaObject) {
    const allOf = schemaObject.allOf || [];
    // 暂时只支持单继承，且父类必须是第一个元素
    const parent = allOf[0] && allOf[0].$ref ? getType(allOf[0]) : undefined;
    let props: any[] = [];
    if (allOf.length > 1) {
      props = flatten(allOf.slice(1).map((item) => this.getProps(item)));
    }
    return {
      parent,
      // 属性合并: 根据属性名进行去重
      props: uniqBy(props, 'name'),
    };
  }

  private resolveRefObject(refObject: any): any {
    if (!refObject || !refObject.$ref) {
      return refObject;
    }
    const refPaths = refObject.$ref.split('/');
    if (refPaths[0] === '#') {
      refPaths.shift();
      let obj: any = this.openAPIData;
      refPaths.forEach((node: any) => {
        obj = obj[node];
      });
      if (!obj) {
        throw new Error(`[GenSDK] Data Error! Notfoud: ${refObject.$ref}`);
      }
      return {
        ...this.resolveRefObject(obj),
        type: obj.$ref ? this.resolveRefObject(obj).type : obj,
      };
    }
    return refObject;
  }

  private getFinalFileName(s: string): string {
    // 支持下划线、中划线和空格分隔符，注意分隔符枚举值的顺序不能改变，否则正则匹配会报错
    return s.replace(/[-_ ](\w)/g, (_all, letter) => letter.toUpperCase());
  }

  private replaceDot(s: string) {
    return s.replace(/\./g, '_').replace(/[-_ ](\w)/g, (_all, letter) => letter.toUpperCase());
  }

  private resolveFunctionName(functionName: string, methodName) {
    // 类型声明过滤关键字
    if (ReservedDict.check(functionName)) {
      return `${functionName}Using${methodName.toUpperCase()}`;
    }
    return functionName;
  }
}

export default ServiceGenerator;
