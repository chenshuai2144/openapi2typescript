const openAPI = require('../dist/index');

openAPI.generateService({
  schemaPath: 'https://gw.alipayobjects.com/os/antfincdn/CA1dOm%2631B/openapi.json',
  serversPath: './servers',
  mockFolder: './mocks',
});

openAPI.generateService({
  schemaPath: 'http://petstore.swagger.io/v2/swagger.json',
  serversPath: './servers',
});
