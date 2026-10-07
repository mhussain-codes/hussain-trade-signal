const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('c:/QUORTEX/HussainTradeSignals/src', function(filePath) {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    const target = String.fromCharCode(92) + String.fromCharCode(96); // \`
    const replacement = String.fromCharCode(96); // `
    if (content.includes(target)) {
      content = content.split(target).join(replacement);
      fs.writeFileSync(filePath, content);
      console.log('Fixed ' + filePath);
    }
  }
});
