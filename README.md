# OpenAPI to TypeScript Generator (OpenAPI TypeScript 生成器)

[![GitHub Repo stars](https://img.shields.io/github/stars/chenshuai2144/openapi2typescript?style=social)](https://github.com/chenshuai2144/openapi2typescript) [![npm (scoped)](https://img.shields.io/npm/v/@umijs/openapi)](https://www.npmjs.com/package/@umijs/openapi) ![GitHub tag (latest SemVer pre-release)](https://img.shields.io/github/v/tag/chenshuai2144/openapi2typescript?include_prereleases)

[English](#english) | [中文](#chinese)

<a name="english"></a>
## English

### Introduction
A powerful tool that generates TypeScript request code from [OpenAPI 3.0](https://swagger.io/blog/news/whats-new-in-openapi-3-0/) documentation. If you're using [umi](https://umijs.org), you might want to check out [@umijs/plugin-openapi](https://www.npmjs.com/package/@umijs/plugin-openapi) plugin instead.

### Installation

```bash
npm i --save-dev @umijs/openapi
# or
pnpm add -D @umijs/openapi
# or
yarn add -D @umijs/openapi
```

### Usage

1. Create a configuration file in your project root directory. You can name it either `openapi2ts.config.ts` or `.openapi2tsrc.ts`:

```typescript
export default {
  schemaPath: 'http://petstore.swagger.io/v2/swagger.json',
  serversPath: './servers',
}
```

For multiple API sources, you can use an array configuration:

```typescript
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

2. Add the generation script to your `package.json`:

```json
{
  "scripts": {
    "openapi2ts": "openapi2ts"
  }
}
```

3. Generate the API code:

```bash
npm run openapi2ts
```

### Configuration Options

| Property | Required | Description | Type | Default |
|----------|----------|-------------|------|---------|
| requestLibPath | No | Custom request method path | string | - |
| requestOptionsType | No | Custom request options type | string | {[key: string]: any} |
| requestImportStatement | No | Custom request import statement | string | - |
| apiPrefix | No | API prefix | string | - |
| serversPath | No | Output directory path | string | - |
| schemaPath | No | Swagger 2.0 or OpenAPI 3.0 URL | string | - |
| projectName | No | Project name | string | - |
| authorization | No | Documentation authentication token | string | - |
| namespace | No | Namespace name | string | API |
| mockFolder | No | Mock directory | string | - |
| enumStyle | No | Enum style | string-literal \| enum | string-literal |
| nullable | No | Use null instead of optional | boolean | false |
| dataFields | No | Data fields in response | string[] | - |
| isCamelCase | No | Use camelCase for files and functions | boolean | true |
| declareType | No | Interface declaration type | type/interface | type |

### Custom Hooks

| Property | Type | Description |
|----------|------|-------------|
| afterOpenApiDataInited | (openAPIData: OpenAPIObject) => OpenAPIObject | Hook after OpenAPI data initialization |
| customFunctionName | (data: APIDataType) => string | Custom request function name |
| customTypeName | (data: APIDataType) => string | Custom type name |
| customClassName | (tagName: string) => string | Custom class name |
| customType | (schemaObject, namespace, originGetType) => string | Custom type getter |
| customFileNames | (operationObject, apiPath, _apiMethod) => string[] | Custom file name generator |

<a name="chinese"></a>
## 中文

### 介绍
一个强大的工具，可以根据 [OpenAPI 3.0](https://swagger.io/blog/news/whats-new-in-openapi-3-0/) 文档生成 TypeScript 请求代码。如果你使用 [umi](https://umijs.org)，可以考虑使用 [@umijs/plugin-openapi](https://www.npmjs.com/package/@umijs/plugin-openapi) 插件。

### 安装

```bash
npm i --save-dev @umijs/openapi
# 或者
pnpm add -D @umijs/openapi
# 或者
yarn add -D @umijs/openapi
```

### 使用方法

1. 在项目根目录创建配置文件，可以命名为 `openapi2ts.config.ts` 或 `.openapi2tsrc.ts`：

```typescript
export default {
  schemaPath: 'http://petstore.swagger.io/v2/swagger.json',
  serversPath: './servers',
}
```

如果需要处理多个 API 源，可以使用数组配置：

```typescript
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

2. 在 `package.json` 中添加生成脚本：

```json
{
  "scripts": {
    "openapi2ts": "openapi2ts"
  }
}
```

3. 生成 API 代码：

```bash
npm run openapi2ts
```

### 配置选项

| 属性 | 必填 | 说明 | 类型 | 默认值 |
|------|------|------|------|--------|
| requestLibPath | 否 | 自定义请求方法路径 | string | - |
| requestOptionsType | 否 | 自定义请求方法 options 参数类型 | string | {[key: string]: any} |
| requestImportStatement | 否 | 自定义请求方法表达式 | string | - |
| apiPrefix | 否 | API 前缀 | string | - |
| serversPath | 否 | 生成文件夹的路径 | string | - |
| schemaPath | 否 | Swagger 2.0 或 OpenAPI 3.0 的地址 | string | - |
| projectName | 否 | 项目名称 | string | - |
| authorization | 否 | 文档登录凭证 | string | - |
| namespace | 否 | 命名空间名称 | string | API |
| mockFolder | 否 | mock 目录 | string | - |
| enumStyle | 否 | 枚举样式 | string-literal \| enum | string-literal |
| nullable | 否 | 使用 null 代替可选 | boolean | false |
| dataFields | 否 | response 中数据字段 | string[] | - |
| isCamelCase | 否 | 小驼峰命名文件和请求函数 | boolean | true |
| declareType | 否 | interface 声明类型 | type/interface | type |

### 自定义钩子

| 属性 | 类型 | 说明 |
|------|------|------|
| afterOpenApiDataInited | (openAPIData: OpenAPIObject) => OpenAPIObject | OpenAPI 数据初始化后的钩子 |
| customFunctionName | (data: APIDataType) => string | 自定义请求方法函数名称 |
| customTypeName | (data: APIDataType) => string | 自定义类型名称 |
| customClassName | (tagName: string) => string | 自定义类名 |
| customType | (schemaObject, namespace, originGetType) => string | 自定义获取类型 |
| customFileNames | (operationObject, apiPath, _apiMethod) => string[] | 自定义生成文件名 |