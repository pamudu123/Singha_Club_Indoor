const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../constants/locales/en.json');
const siPath = path.join(__dirname, '../constants/locales/si.json');
const outPath = path.join(__dirname, '../docs/translations_v1.md');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const si = JSON.parse(fs.readFileSync(siPath, 'utf8'));

let content = '# English - Sinhala Translation Dictionary\n\n';
content += 'This file contains the English to Sinhala translation mappings for the Singha Club Indoor app.\n\n';
content += '## Dictionary Mappings\n\n';

for (const key in en) {
  if (en.hasOwnProperty(key)) {
    const englishWord = en[key];
    const sinhalaWord = si[key] || '';
    content += `${englishWord} = ${sinhalaWord}\n`;
  }
}

fs.writeFileSync(outPath, content, 'utf8');
console.log('Translations successfully written to docs/translations_v1.md');
