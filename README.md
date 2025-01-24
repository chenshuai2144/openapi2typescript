## 介绍

[![GitHub Repo stars](https://img.shields.io/github/stars/KobeCYL/openapi2typescript?style=social)](https://github.com/KobeCYL/openapi2typescript) [![npm (scoped)](https://img.shields.io/npm/v/@umijs/openapi)](https://www.npmjs.com/package/@umijs/openapi) ![GitHub tag (latest SemVer pre-release)](https://img.shields.io/github/v/tag/KobeCYL/openapi2typescript?include_prereleases)

根据 [OpenApi3](https://swagger.io/blog/news/whats-new-in-openapi-3-0/) 文档生成 request 请求代码。

如果你使用 [umi](https://umijs.org) ,你可以使用[@umijs/plugin-openapi](https://www.npmjs.com/package/@umijs/plugin-openapi) 插件。

## 使用

```node
npm i --save-dev @umijs/openapi
```

在项目根目录新建 `openapi.config.ts`

```ts
const { generateService } = require('@umijs/openapi');

generateService({
  schemaPath: 'http://petstore.swagger.io/v2/swagger.json',
  serversPath: './servers',
});
```

在 `package.json` 的 `script` 中添加 api: `"openapi": "ts-node openapi.config.ts",`

生成 api

```node
npm run openapi
=======
```bash
npm i --save-dev @umijs/openapi
```
在项目根目录新建 ```openapi2ts.config.ts``` 或者 ```.openapi2tsrc.ts```
> 配置文件还支持 ***openapi2ts.config.ts***, ***.openapi2tsrc.json*** 等格式，参考 [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig?tab=readme-ov-file#cosmiconfig)
```ts
export default {
  schemaPath: 'http://petstore.swagger.io/v2/swagger.json',
  serversPath: './servers',
}
```
如果单个项目有多个生成需求，支持传入数组配置
```ts
export default [
  {
    schemaPath: 'http://app.swagger.io/v2/swagger.json',
    serversPath: './servers/app',
  },
  {
    schemaPath: 'http://auth.swagger.io/v2/swagger.json',
    serversPath: './servers/auth',
  }
]
```

在 ```package.json``` 的 ```script``` 中添加 api: ```"openapi2ts": "openapi2ts",```

生成api
```bash
npm run openapi2ts
```

## 参数

| 属性 | 必填 | 备注 | 类型 | 默认值 |
| --- | --- | --- | --- | --- |
| requestLibPath | 否 | 自定义请求方法路径 | string | - |
| requestOptionsType | 否 | 自定义请求方法 options 参数类型 | string | {[key: string]: any} |
| requestImportStatement | 否 | 自定义请求方法表达式 | string | - |
| apiPrefix | 否 | api 的前缀 | string | - |
| serversPath | 否 | 生成的文件夹的路径 | string | - |
| schemaPath | 否 | Swagger 2.0 或 OpenAPI 3.0 的地址 | string | - |
| projectName | 否 | 项目名称 | string | - |
| namespace | 否 | 命名空间名称 | string | API |
| mockFolder | 否 | mock 目录 | string | - |
| enumStyle | 否 | 枚举样式 | string-literal \| enum | string-literal |
| nullable | 否 | 使用 null 代替可选 | boolean | false |
| dataFields | 否 | response 中数据字段 | string[] | - |
=======
|  属性   | 必填  | 备注 | 类型 | 默认值 |
|  ----  | ----  |  ----  |  ----  | - |
| requestLibPath  | 否 | 自定义请求方法路径 | string | - |
| requestOptionsType  | 否 | 自定义请求方法 options 参数类型 | string | {[key: string]: any} |
| requestImportStatement  | 否 | 自定义请求方法表达式 | string | - |
| apiPrefix  | 否 | api 的前缀 | string | - |
| serversPath  | 否 | 生成的文件夹的路径 | string | - |
| schemaPath  | 否 | Swagger 2.0 或 OpenAPI 3.0 的地址 | string | - |
| projectName  | 否 | 项目名称 | string | - |
| authorization | 否 | 文档登录凭证 | string | - |
| namespace  | 否 | 命名空间名称 | string | API |
| mockFolder  | 否 | mock目录 | string | - |
| enumStyle  | 否 | 枚举样式 | string-literal \| enum | string-literal |
| nullable | 否 | 使用null代替可选 | boolean | false |
| dataFields | 否 | response中数据字段 | string[] | - |
| isCamelCase | 否 | 小驼峰命名文件和请求函数 | boolean | true |
| declareType | 否 | interface 声明类型(适配不同的规范) | type/interface | type |
| mockConfig | 否 | mock配置 |  [Mock Config](#Mock-Config) | - |
| hook | 否 | 自定义 hook | [Custom Hook](#Custom-Hook) | - |

## Custom Hook

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| afterOpenApiDataInited | (openAPIData: OpenAPIObject) => OpenAPIObject | - |
| customFunctionName | (data: APIDataType) => string | 自定义请求方法函数名称 |
| customTypeName | (data: APIDataType) => string | 自定义类型名称 |
| customClassName | (tagName: string) => string | 自定义类名 |
| customType | (<br>schemaObject: SchemaObject \| undefined,<br>namespace: string,<br>originGetType:(schemaObject: SchemaObject \| undefined, namespace: string) => string,<br>) => string | 自定义获取类型 <br> _返回非字符串将使用默认方法获取 type_ |
| customFileNames | (<br>operationObject: OperationObject,<br>apiPath: string,<br>\_apiMethod: string,<br>) => string[] | 自定义生成文件名，可返回多个，表示生成多个文件. <br> _返回为空，则使用默认的获取方法获取_ |


## Mock Config

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| msw | boolean | msw类型mock文件格式.  直接返回对象<br>举例:<br>// @ts-ignore<br><br>export default {<br>'DELETE /mydata/delete': { message: { message: 'Mydata successfully deleted' } }<br>};<br><br><br>原文件:<br>// @ts-ignore<br>import { Request, Response } from 'express';<br><br>export default {<br>'DELETE /mydata/delete': (req: Request, res: Response) => {<br>res.status(200).send({ message: { message: 'Mydata successfully deleted' } });<br>},<br>};|