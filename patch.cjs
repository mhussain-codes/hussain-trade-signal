const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(
  "import { About } from './pages/About';",
  "import { About } from './pages/About';\nimport { DeveloperPanel } from './pages/DeveloperPanel';"
);
content = content.replace(
  '<Route path="/about" element={<About />} />',
  '<Route path="/about" element={<About />} />\n            <Route path="/dev" element={<DeveloperPanel />} />'
);
fs.writeFileSync('src/App.tsx', content);
