import swaggerParserMock from './swaggerParserMock/index';
import Mock from 'mockjs';
import fs from 'fs';
import { prettierFile } from './util';
import { join } from 'path';
import Log from './log';

const { Random } = Mock;

Mock.Random.extend({
  phone() {
    const phonepreFix = ['111', '112', '114']; // 自己写前缀哈
    return this.pick(phonepreFix) + Mock.mock(/\d{8}/); // Number()
  },
  status() {
    const status = ['success', 'error', 'default', 'processing', 'warning'];
    return status[(Math.random() * 4).toFixed(0)];
  },
});

const parseString = (example: string): Record<string, any> => {
  try {
    return JSON.parse(example);
  } catch (error) {
    return {};
  }
};

const getDateByName = (name: string) => {
  if (['username', 'firstName', 'lastName'].includes(name)) {
    return Random.cname();
  }
  if (['email'].includes(name)) {
    return Random.email();
  }
  if (['password'].includes(name)) {
    return Mock.mock('@string(16)');
  }
  if (['phone'].includes(name)) {
    return Mock.mock('@phone');
  }
  if (['province'].includes(name)) {
    return Mock.mock('@province');
  }
  if (['city'].includes(name)) {
    return Mock.mock('@city');
  }
  if (['county'].includes(name)) {
    return Mock.mock('@county');
  }
  if (['addr', 'address'].includes(name)) {
    return Mock.mock('@county(true)');
  }
  if (['url', 'imageUrl'].includes(name) || name.endsWith('url') || name.endsWith('Url')) {
    return Mock.mock('@url');
  }
  if (['type', 'status'].includes(name) || name.endsWith('Status') || name.endsWith('Type')) {
    return Mock.mock('@status');
  }
  return Mock.mock('@csentence');
};

const genMockData = (example: string) => {
  if (!example) {
    return {};
  }
  const obj = parseString(example);
  if (!obj) {
    return {};
  }
  if (typeof obj === 'string') {
    return Mock.mock(obj);
  }

  return Object.keys(obj)
    .map((name) => {
      const valueType = obj[name];
      if (valueType === '@string') {
        return {
          [name]: getDateByName(name),
        };
      }
      return {
        [name]: Mock.mock(obj[name]),
      };
    })
    .reduce((pre, next) => {
      return {
        ...pre,
        ...next,
      };
    }, {});
};

const genByTemp = ({
  method,
  path,
  status,
  data,
}: {
  method: string;
  path: string;
  status: string;
  data: string;
}) => {
  return `'${method.toUpperCase()} ${path}': (req: Request, res: Response) => {
    res.status(${status}).send(${data});
  }`;
};

const genMockFiles = (mockFunction: string[]) => {
  return prettierFile(` 
// @ts-ignore
import { Request, Response } from 'express';

export default {
${mockFunction.join('\n,')}
    }`)[0];
};
export type genMockDataServerConfig = { openAPI: any; mockFolder: string };

const mockGenerator = async ({ openAPI, mockFolder }: genMockDataServerConfig) => {
  Log('开始生成 mock 文件');
  const docs = swaggerParserMock(openAPI);
  const pathList = Object.keys(docs.paths);
  const { paths } = docs;
  const mockActionsObj = {};
  pathList.forEach((path) => {
    const pathConfig = paths[path];
    Object.keys(pathConfig).forEach((method) => {
      const methodConfig = pathConfig[method];
      if (methodConfig) {
        const conte = methodConfig.tags.join('/');
        const data = genMockData(methodConfig.responses['200']?.example);
        if (!mockActionsObj[conte]) {
          mockActionsObj[conte] = [];
        }
        mockActionsObj[conte].push(
          genByTemp({
            method,
            path,
            status: '200',
            data: JSON.stringify(data),
          }),
        );
      }
    });
  });
  Object.keys(mockActionsObj).forEach((file) => {
    fs.writeFileSync(join(mockFolder, `${file}.mock.ts`), genMockFiles(mockActionsObj[file]), {
      encoding: 'utf8',
    });
  });
  Log('✅ 生成 mock 文件');
};

export { mockGenerator };
