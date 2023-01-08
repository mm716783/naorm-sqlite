import fs from 'fs';

const out = { type: 'commonjs' };
fs.writeFileSync('dist/commonjs/package.json', JSON.stringify(out, null, '\t'));