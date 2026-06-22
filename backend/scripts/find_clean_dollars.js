const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    if (file === 'node_modules' || file === '.next' || file === 'dist' || file === 'plugins') {
      return;
    }
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.php') || file.endsWith('.html')) {
      results.push(filePath);
    }
  });
  return results;
}

const paths = [
  'c:/Users/palpp/Downloads/Dainna/dainna 2.0/frontend/src',
  'c:/Users/palpp/Downloads/Dainna/dainna 2.0/backend/src',
  'c:/Users/palpp/Downloads/dainna_2.0/dainna/app',
  'c:/Users/palpp/Downloads/dainna_2.0/dainna/includes'
];

paths.forEach(srcDir => {
  const files = walk(srcDir);
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      // Check if line contains '$'
      if (line.includes('$')) {
        // Exclude PHP variables: $ followed by letter/underscore
        // Exclude template literal: ${
        // Exclude jQuery: $(, $.
        // Exclude prisma transaction/methods: .$
        // Exclude regex anchor: $/
        const hasVariable = /\$[a-zA-Z_\x80-\xff]/.test(line);
        const hasTemplate = /\$\{/.test(line);
        const hasJQuery = /\$\(|\$\./.test(line);
        const hasPrismaOrMethod = /\.\$/.test(line);
        const hasRegexAnchor = /\$\//.test(line);

        // If it contains '$' but none of the code constructs, print it!
        if (!hasVariable && !hasTemplate && !hasJQuery && !hasPrismaOrMethod && !hasRegexAnchor) {
          console.log(`${path.relative(path.dirname(srcDir), file)}:L${idx + 1} -> ${line.trim()}`);
        }
      }
    });
  });
});
