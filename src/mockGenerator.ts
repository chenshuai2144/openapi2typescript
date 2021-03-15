import Mock from 'mockjs';
import fs from 'fs';
import { prettierFile } from './util';
import { join, dirname } from 'path';
import OpenAPIParserMock from './openAPIParserMock/index';
import Log from './log';

Mock.Random.extend({
  country() {
    const data = [
      '阿根廷',
      '澳大利亚',
      '巴西',
      '加拿大',
      '中国',
      '法国',
      '德国',
      '印度',
      '印度尼西亚',
      '意大利',
      '日本',
      '韩国',
      '墨西哥',
      '俄罗斯',
      '沙特阿拉伯',
      '南非',
      '土耳其',
      '英国',
      '美国',
    ];
    const id = (Math.random() * data.length).toFixed();
    return data[id];
  },
  phone() {
    const phonepreFix = ['111', '112', '114']; // 自己写前缀哈
    return this.pick(phonepreFix) + Mock.mock(/\d{8}/); // Number()
  },
  status() {
    const status = ['success', 'error', 'default', 'processing', 'warning'];
    return status[(Math.random() * 4).toFixed(0)];
  },
  authority() {
    const status = ['admin', 'user', 'guest'];
    return status[(Math.random() * status.length).toFixed(0)];
  },
  avatar() {
    const avatar = [
      'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg',
      'https://gw.alipayobjects.com/zos/rmsportal/udxAbMEhpwthVVcjLXik.png',
      'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
      'https://gw.alipayobjects.com/zos/rmsportal/ThXAXghbEsBCCSDihZxY.png',
      'https://gw.alipayobjects.com/zos/rmsportal/OKJXDXrmkNshAMvwtvhu.png',
      'https://avatars0.githubusercontent.com/u/507615?s=40&v=4',
      'https://avatars1.githubusercontent.com/u/8186664?s=40&v=4',
    ];
    const id = (Math.random() * avatar.length).toFixed();
    return avatar[id];
  },
  group() {
    const data = ['体验技术部', '创新科技组', '前端 6 组', '区块链平台部', '服务技术部'];
    const id = (Math.random() * data.length).toFixed();
    return data[id];
  },
  label() {
    const label = [
      '很有想法的',
      '小清新',
      '傻白甜',
      '阳光少年',
      '大咖',
      '健身达人',
      '程序员',
      '算法工程师',
      '川妹子',
      '名望程序员',
      '大长腿',
      '海纳百川',
      '专注设计',
      '爱好广泛',
      'IT 互联网',
    ];
    const id = (Math.random() * label.length).toFixed();
    return label[id];
  },
  href() {
    const href = [
      'https://preview.pro.ant.design/dashboard/analysis',
      'https://ant.design',
      'https://procomponents.ant.design/',
      'https://umijs.org/',
      'https://github.com/umijs/dumi',
    ];
    const id = (Math.random() * href.length).toFixed();
    return href[id];
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
  if (!['get', 'put', 'post', 'delete', 'patch'].includes(method.toLocaleLowerCase())) {
    return '';
  }
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
        const conte =
          methodConfig?.tags?.join('/') ||
          path.replace('/', '').split('/')[1] ||
          methodConfig.operationId;

        const data = genMockData(methodConfig.responses?.['200']?.example);
        if (!mockActionsObj[conte]) {
          mockActionsObj[conte] = [];
        }
        const tempFile = genByTemp({
          method,
          path,
          status: '200',
          data: JSON.stringify(data),
        });
        if (tempFile) {
          mockActionsObj[conte].push(tempFile);
        }
      }
    });
  });
  Object.keys(mockActionsObj).forEach((file) => {
    if (!file || file === 'undefined') {
      return;
    }
    if (file.includes('/')) {
      const dirName = dirname(join(mockFolder, `${file}.mock.ts`));
      if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName);
      }
    }
    fs.writeFileSync(join(mockFolder, `${file}.mock.ts`), genMockFiles(mockActionsObj[file]), {
      encoding: 'utf8',
    });
  });
  Log('✅ 生成 mock 文件成功');
};

export { mockGenerator };
