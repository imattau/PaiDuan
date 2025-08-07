const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'apps', 'web', 'data', 'modqueue.json');
const week = new Date().toISOString().slice(0, 10);
let reports = [];
try {
  reports = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
} catch {}
const summary = { week, totalReports: reports.length, hides: 0, restores: 0 };
const event = { kind: 9002, created_at: Math.floor(Date.now() / 1000), content: JSON.stringify(summary) };
console.log('9002', JSON.stringify(event));
