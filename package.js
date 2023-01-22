import fs from 'fs';

const packageJSON = { type: 'commonjs' };
fs.writeFileSync('dist/commonjs/package.json', JSON.stringify(packageJSON, null, '\t'));

const jestConfig = { "coveragePathIgnorePatterns": [ "sqlite3-wasm-db.js" ] };
fs.writeFileSync('dist/jest.config.json', JSON.stringify(jestConfig, null, '\t'));