import { generateService } from '../src/index';
// @ts-ignore
const gen = async () => {
  await generateService({
    schemaPath: `${__dirname}/example-files/swgger3.0.1.json`,
    serversPath: './servers',
  });
};
gen();
