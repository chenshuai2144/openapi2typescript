const assert = require('assert');
const path = require('path');
const fs = require('fs');

const openAPI = require('../dist/index');

const gen = async () => {
  await openAPI.generateService({
    schemaPath: `${__dirname}/example-files/swagger-empty.json`,
    serversPath: './servers/empty',
  });

  await openAPI.generateService({
    schemaPath: `${__dirname}/test-allof-api.json`,
    serversPath: './servers-allof',
  });

  await openAPI.generateService({
    schemaPath: `${__dirname}/example-files/swagger-get-method-params-convert-obj.json`,
    serversPath: './servers',
  });

  await openAPI.generateService({
    schemaPath: `${__dirname}/example-files/swagger-schema-contain-blank-symbol.json`,
    serversPath: './servers/blank-symbol-servers',
  });

  await openAPI.generateService({
    requestLibPath: "import request  from '@/request';",
    schemaPath: `${__dirname}/example-files/swagger-custom-hook.json`,
    serversPath: './servers/custom',
    declareType: 'interface',
    hook: {
      // 自定义类名
      customClassName: (tagName) => {
        return /[A-Z].+/.exec(tagName);
      },
      // 自定义函数名
      customFunctionName: (data) => {
        let funName = data.operationId ? data.operationId : '';
        const suffix = 'Using';
        if (funName.indexOf(suffix) != -1) {
          funName = funName.substring(0, funName.lastIndexOf(suffix));
        }
        return funName;
      },
      // 自定义类型名
      customTypeName: (data) => {
        const { operationId } = data;
        const funName = operationId ? operationId[0].toUpperCase() + operationId.substring(1) : '';
        const tag = data?.tags?.[0];

        return `${tag ? tag : ''}${funName}`;
      },
    },
  });

  // 支持null类型作为默认值
  await openAPI.generateService({
    schemaPath: `${__dirname}/example-files/swagger-get-method-params-convert-obj.json`,
    serversPath: './servers/support-null',
    nullable: true,
  });

  // 正常命名文件和请求函数
  await openAPI.generateService({
    schemaPath: `${__dirname}/example-files/swagger-get-method-params-convert-obj.json`,
    serversPath: './servers/name/normal',
    isCamelCase: false,
  });

  // 小驼峰命名文件和请求函数
  await openAPI.generateService({
    schemaPath: `${__dirname}/example-files/swagger-get-method-params-convert-obj.json`,
    serversPath: './servers/name/camel-case',
    isCamelCase: true,
  });

  await openAPI.generateService({
    schemaPath: `${__dirname}/example-files/swagger-file-convert.json`,
    serversPath: './file-servers',
  });

  // check 文件生成
  const fileControllerStr = fs.readFileSync(
    path.join(__dirname, 'file-servers/api/fileController.ts'),
    'utf8',
  );
  assert(fileControllerStr.indexOf('!(item instanceof File)') > 0);
  assert(fileControllerStr.indexOf(`requestType: 'form',`) > 0);
  assert(fileControllerStr.indexOf('Content-Type') < 0);
  // await openAPI.generateService({
  //   // requestLibPath: "import request  from '@/request';",
  //   schemaPath: `http://82.157.33.9/swagger/swagger.json`,
  //   serversPath: './servers',
  // });
  // await openAPI.generateService({
  //   schemaPath: 'https://gw.alipayobjects.com/os/antfincdn/CA1dOm%2631B/openapi.json',
  //   serversPath: './servers',
  //   mockFolder: './mocks',
  // });
  // await openAPI.generateService({
  //   schemaPath: 'http://petstore.swagger.io/v2/swagger.json',
  //   serversPath: './servers',
  //   mockFolder: './mocks',
  // });
  // await openAPI.generateService({
  //   schemaPath: 'https://gw.alipayobjects.com/os/antfincdn/LyDMjDyIhK/1611471979478-opa.json',
  //   serversPath: './servers',
  //   mockFolder: './mocks',
  // });
  // await openAPI.generateService({
  //   schemaPath: 'https://gw.alipayobjects.com/os/antfincdn/Zd7dLTHUjE/ant-design-pro.json',
  //   serversPath: './servers',
  //   mockFolder: './mocks',
  // });
  // await openAPI.generateService({
  //   schemaPath: `${__dirname}/morse-api.json`,
  //   serversPath: './servers',
  //   mockFolder: './mocks',
  // });
  // await openAPI.generateService({
  //   schemaPath: `${__dirname}/oc-swagger.json`,
  //   serversPath: './servers',
  //   mockFolder: './mocks',
  // });
  // await openAPI.generateService({
  //   schemaPath: `${__dirname}/java-api.json`,
  //   serversPath: './servers',
  //   mockFolder: './mocks',
  // });

  await openAPI.generateService({
    schemaPath: `${__dirname}/example-files/apispec_1.json`,
    serversPath: './apispe',
    mockFolder: './mocks',
    mockConfig: {
      // msw: true,
    },
  });

  // await openAPI.generateService({
  //   schemaPath: `${__dirname}/example-files/swagger-splitdeclare.json`,
  //   serversPath: './splitDeclare',
  //   splitDeclare:true
  // });

  // Test dedupeApiPrefix 配置的两种场景
  // 使用同一个 swagger 文件，通过不同的 dedupeApiPrefix 配置演示不同的行为
  
  // 场景1：dedupeApiPrefix: true - 去重模式
  // 当 apiPrefix 为 '/api'，路径已经包含 '/api' 前缀时（如 /api/apiInfo/xxx），
  // 设置 dedupeApiPrefix: true 会去重，生成的路径仍为 /api/apiInfo/xxx（不重复添加）
  await openAPI.generateService({
    schemaPath: `${__dirname}/example-files/swagger-dedupe-api-prefix.json`,
    serversPath: './servers/dedupe-api-prefix/true',
    apiPrefix: `'/api'`,
    dedupeApiPrefix: true,
  });

  const dedupeApiPrefixTrueApiControllerStr = fs.readFileSync(
    path.join(__dirname, 'servers/dedupe-api-prefix/true/api/api.ts'),
    'utf8',
  );
  const dedupeApiPrefixTrueUserControllerStr = fs.readFileSync(
    path.join(__dirname, 'servers/dedupe-api-prefix/true/api/user.ts'),
    'utf8',
  );
  
  // /api/apiInfo/get 已经有 /api 前缀，dedupeApiPrefix: true 会去重，保持 /api/apiInfo/get
  assert(dedupeApiPrefixTrueApiControllerStr.indexOf(`'/api/apiInfo/get'`) > 0 || 
         dedupeApiPrefixTrueApiControllerStr.indexOf('`/api/apiInfo/get`') > 0,
         'dedupeApiPrefix=true: /api/apiInfo/get should remain as /api/apiInfo/get (not /api/api/apiInfo/get)');
  
  assert(dedupeApiPrefixTrueApiControllerStr.indexOf(`'/api/apiInfo/update'`) > 0 || 
         dedupeApiPrefixTrueApiControllerStr.indexOf('`/api/apiInfo/update`') > 0,
         'dedupeApiPrefix=true: /api/apiInfo/update should remain as /api/apiInfo/update');
  
  assert(dedupeApiPrefixTrueUserControllerStr.indexOf(`'/api/user/profile'`) > 0 || 
         dedupeApiPrefixTrueUserControllerStr.indexOf('`/api/user/profile`') > 0,
         'dedupeApiPrefix=true: /api/user/profile should remain as /api/user/profile');

  
  // 场景2：dedupeApiPrefix: false - 非去重模式
  // 同一个 swagger 文件，设置 dedupeApiPrefix: false 时，不检查前缀，直接作为变量引用
  // 导致前缀被重复添加
  await openAPI.generateService({
    schemaPath: `${__dirname}/example-files/swagger-dedupe-api-prefix.json`,
    serversPath: './servers/dedupe-api-prefix/false',
    apiPrefix: `'/api'`,
    dedupeApiPrefix: false,
  });

  const dedupeApiPrefixFalseApiControllerStr = fs.readFileSync(
    path.join(__dirname, 'servers/dedupe-api-prefix/false/api/api.ts'),
    'utf8',
  );
  const dedupeApiPrefixFalseUserControllerStr = fs.readFileSync(
    path.join(__dirname, 'servers/dedupe-api-prefix/false/api/user.ts'),
    'utf8',
  );
  
  // 当 dedupeApiPrefix: false 时，同样的路径会被作为变量引用，导致前缀被拼接
  // /api/apiInfo/get 会变成 ${'/api'}/api/apiInfo/get
  assert(dedupeApiPrefixFalseApiControllerStr.indexOf("${'/api'}/api/apiInfo/get") > 0,
         'dedupeApiPrefix=false: /api/apiInfo/get should become ${' + "'" + '/api' + "'" + '}/api/apiInfo/get (duplication)');
  
  assert(dedupeApiPrefixFalseApiControllerStr.indexOf("${'/api'}/api/apiInfo/update") > 0,
         'dedupeApiPrefix=false: /api/apiInfo/update should become ${' + "'" + '/api' + "'" + '}/api/apiInfo/update (duplication)');
  
  assert(dedupeApiPrefixFalseUserControllerStr.indexOf("${'/api'}/api/user/profile") > 0,
         'dedupeApiPrefix=false: /api/user/profile should become ${' + "'" + '/api' + "'" + '}/api/user/profile (duplication)');
};
gen();
