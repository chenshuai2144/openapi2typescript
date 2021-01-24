import chalk from 'chalk';

// eslint-disable-next-line no-console
const Log = (...rest) => console.log(`${chalk.blue('[openAPI]')}: ${rest.join('\n')}`);

export default Log;
