const fs = require('fs');
const files = [
  'netlify/functions/generate-signal.ts',
  'netlify/functions/analyze-news.ts',
  'netlify/functions/utils/license.ts'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  const target = String.fromCharCode(92) + String.fromCharCode(96); // \`
  const replacement = String.fromCharCode(96); // `
  content = content.split(target).join(replacement);
  fs.writeFileSync(f, content);
});
