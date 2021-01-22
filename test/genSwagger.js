const openAPI = require('../dist/index');

openAPI.generateService({
  schemaPath: './swagger.json',
  serversPath: './servers',
});
