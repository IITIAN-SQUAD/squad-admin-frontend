// Simple script to convert markdown to PDF
// Run: node convert-to-pdf.js

const fs = require('fs');
const path = require('path');

console.log('📄 KaTeX Guide created successfully!');
console.log('📍 Location: /docs/KATEX_GUIDE.md');
console.log('');
console.log('🔄 To convert to PDF, you can use:');
console.log('');
console.log('Option 1 - Online Converter:');
console.log('• Visit: https://www.markdowntopdf.com/');
console.log('• Upload: KATEX_GUIDE.md');
console.log('• Download PDF');
console.log('');
console.log('Option 2 - VS Code Extension:');
console.log('• Install "Markdown PDF" extension');
console.log('• Right-click KATEX_GUIDE.md → "Markdown PDF: Export (pdf)"');
console.log('');
console.log('Option 3 - Command Line (if you have pandoc):');
console.log('• pandoc KATEX_GUIDE.md -o KATEX_GUIDE.pdf');
console.log('');
console.log('✨ The guide includes:');
console.log('• Basic KaTeX syntax');
console.log('• Mathematics examples');
console.log('• Physics formulas');
console.log('• Chemistry equations');
console.log('• Common mistakes');
console.log('• External resources');
console.log('• Quick reference');
