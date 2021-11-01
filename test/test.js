const openAPI = require('../dist/index');

const gen = async () => {
  await openAPI.generateService({
    schemaPath: `${__dirname}/example-files/swagger-get-method-params-convert-obj.json`,
    serversPath: './servers',
  });
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
};
gen();
