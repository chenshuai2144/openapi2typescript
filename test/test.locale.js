const oneapi = require('../dist/index');

oneapi.generateService({
  schemaPath: '../swagger.json',
  serversPath: './servers',
});
