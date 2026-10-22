const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const assetsDir = path.join(root, 'assets');
const outputPath = path.join(root, 'packages/core/src/manifest.json');

function decodeXml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

const icons = Object.fromEntries(
  fs.readdirSync(assetsDir)
    .filter((file) => file.endsWith('.svg'))
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    .map((file) => {
      const symbol = path.basename(file, '.svg');
      const svg = fs.readFileSync(path.join(assetsDir, file), 'utf8');
      const titleMatch = svg.match(/<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/i);
      const name = titleMatch
        ? decodeXml(titleMatch[1].replace(/<[^>]+>/g, '').trim())
        : symbol;

      return [symbol.toLowerCase(), { symbol, name, file }];
    }),
);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(icons, null, 2)}\n`);
