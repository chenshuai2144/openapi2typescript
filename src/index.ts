/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import http from 'http';
import https from 'https';
import fetch from 'node-fetch';
import type { OpenAPIObject, OperationObject, SchemaObject } from 'openapi3-ts';
import converter from 'swagger2openapi';
import Log from './log';
import { mockGenerator } from './mockGenerator';
import { ServiceGenerator } from './serviceGenerator';

const getImportStatement = (requestLibPath: string) => {
  if (requestLibPath && requestLibPath.startsWith('import')) {
    return requestLibPath;
  }
  if (requestLibPath) {
    return `import request from '${requestLibPath}'`;
  }
  return `import { request } from "umi"`;
};

export type GenerateServiceProps = {
  requestLibPath?: string;
  requestImportStatement?: string;
  /**
   * api 的前缀
   */
  apiPrefix?:
    | string
    | ((params: {
        path: string;
        method: string;
        namespace: string;
        functionName: string;
        autoExclude?: boolean;
      }) => string);
  /**
   * 生成的文件夹的路径
   */
  serversPath?: string;
  /**
   * Swagger 2.0 或 OpenAPI 3.0 的地址
   */
  schemaPath?: string;
  /**
   * 项目名称
   */
  projectName?: string;

  hook?: {
    /** change open api data after constructor */
    afterOpenApiDataInited?: (openAPIData: OpenAPIObject) => OpenAPIObject;

    /** 自定义函数名称 */
    customFunctionName?: (data: OperationObject) => string;
    /** 自定义类型名称 */
    customTypeName?: (data: OperationObject) => string;
    /** 自定义类名 */
    customClassName?: (tagName: string) => string;

    /**
     * 自定义获取type hook
     * 返回非字符串将使用默认方法获取type
     * @example set number to string
     * function customType(schemaObject,namespace){
     *  if(schemaObject.type==='number' && !schemaObject.format){
     *    return 'BigDecimalString';
     *  }
     * }
     */
    customType?: (
      schemaObject: SchemaObject | undefined,
      namespace: string,
      originGetType: (schemaObject: SchemaObject | undefined, namespace: string) => string,
    ) => string;

    /**
     * 自定义生成文件名，可返回多个，表示生成多个文件
     * 返回为空，则使用默认的获取方法获取
     * @example  使用operationId生成文件名
     * function customFileNames(operationObject,apiPath){
     *   const operationId=operationObject.operationId;
     *   if (!operationId) {
     *      console.warn('[Warning] no operationId', apiPath);
     *      return;
     *    }
     *    const res = operationId.split('_');
     *    if (res.length > 1) {
     *      res.shift();
     *      if (res.length > 2) {
     *        console.warn('[Warning]  operationId has more than 2 part', apiPath);
     *      }
     *      return [res.join('_')];
     *    } else {
     *      const controllerName = (res || [])[0];
     *      if (controllerName) {
     *        return [controllerName];
     *      }
     *      return;
     *    }
     * }
     */
    customFileNames?: (
      operationObject: OperationObject,
      apiPath: string,
      _apiMethod: string,
    ) => string[];
  };
  namespace?: string;

  /**
   * 默认为false，true时使用null代替可选
   */
  nullable?: boolean;

  mockFolder?: string;
  /**
   * 模板文件的文件路径
   */
  templatesFolder?: string;

  /**
   * 枚举样式
   */
  enumStyle?: 'string-literal' | 'enum';

  /**
   * response中数据字段
   * example: ['result', 'res']
   */
  dataFields?: string[];

  /**
   * 模板文件、请求函数采用小驼峰命名
   */
  isCamelCase?: boolean;

  /**
   * 字符串使用单引号 或 双引号
   */
  isSingleQuote?: boolean;
};

export type ISingleQuote = Pick<GenerateServiceProps, "isSingleQuote">;

const converterSwaggerToOpenApi = (swagger: any) => {
  if (!swagger.swagger) {
    return swagger;
  }
  return new Promise((resolve, reject) => {
    converter.convertObj(swagger, {}, (err, options) => {
      Log(['💺 将 Swagger 转化为 openAPI']);
      if (err) {
        reject(err);
        return;
      }
      resolve(options.openapi);
    });
  });
};

export const getSchema = async (schemaPath: string) => {
  if (schemaPath.startsWith('http')) {
    const protocol = schemaPath.startsWith('https:') ? https : http;
    try {
      const agent = new protocol.Agent({
        rejectUnauthorized: false,
      });
      const json = await fetch(schemaPath, { agent }).then((rest) => rest.json());
      return json;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('fetch openapi error:', error);
    }
    return null;
  }
  const schema = require(schemaPath);
  return schema;
};

const getOpenAPIConfig = async (schemaPath: string) => {
  const schema = await getSchema(schemaPath);
  if (!schema) {
    return null;
  }
  const openAPI = await converterSwaggerToOpenApi(schema);
  return openAPI;
};

// 从 appName 生成 service 数据
export const generateService = async ({
  requestLibPath,
  schemaPath,
  mockFolder,
  nullable = false,
  isSingleQuote = true,
  ...rest
}: GenerateServiceProps) => {
  const openAPI = await getOpenAPIConfig(schemaPath);
  const requestImportStatement = getImportStatement(requestLibPath);
  const serviceGenerator = new ServiceGenerator(
    {
      namespace: 'API',
      requestImportStatement,
      enumStyle: 'string-literal',
      nullable,
      isCamelCase: true,
      isSingleQuote,
      ...rest,
    },
    openAPI,
  );
  serviceGenerator.genFile();

  if (mockFolder) {
    await mockGenerator({
      openAPI,
      mockFolder: mockFolder || './mocks/',
      isSingleQuote,
    });
  }
};
