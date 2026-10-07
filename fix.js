const fs = require('fs');
const files = [
  'src/components/Header.tsx',
  'src/components/Layout.tsx',
  'src/components/SignalGenerator.tsx',
  'src/components/Chart.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/History.tsx',
  'src/pages/News.tsx'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/\\\`/g, '\`');
  fs.writeFileSync(f, content);
});
