import Mock from 'mockjs';
import fs from 'fs';
import { prettierFile } from './util';
import { join } from 'path';
import OpenAPIParserMock from './openAPIParserMock/index';
import Log from './log';

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

const genMockData = (example: string) => {
  if (!example) {
    return {};
  }

  if (typeof example === 'string') {
    return Mock.mock(example);
  }

  if (Array.isArray(example)) {
    return Mock.mock(example);
  }

  return Object.keys(example)
    .map((name) => {
      return {
        [name]: Mock.mock(example[name]),
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
  const openAPParse = new OpenAPIParserMock(openAPI);
  const docs = openAPParse.parser();
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
  Log('✅ 生成 mock 文件成功');
};

export { mockGenerator };
