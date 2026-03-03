// === STATE ===
let allLines = [];         // { lineNum, ts, level, content, fileIndex, fileName, raw }
let filteredLines = [];
let fileColors = [];       // { name, color }
let activeFiles = new Set();
let activeLevels = new Set(['error','warn','info','debug','audit','trace','other']);
let searchTerm = '';
let searchMatches = [];

const $ = id => document.getElementById(id);
const TS_RE = /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\.?\d*/;
const LEVEL_RE = /\[(ERROR|WARN|WARNING|INFO|DEBUG|TRACE|AUDIT)\]/i;

const FILE_COLORS = [
  'var(--file-1)','var(--file-2)','var(--file-3)','var(--file-4)','var(--file-5)',
  'var(--file-6)','var(--file-7)','var(--file-8)','var(--file-9)','var(--file-10)'
];

// === TIMESTAMP PARSER ===
function parseTs(line) {
  const m = line.match(TS_RE);
  if (!m) return null;
  return new Date(m[1] + 'T' + m[2] + 'Z').getTime();
}

function parseLevel(line) {
  const m = line.match(LEVEL_RE);
  if (!m) return 'other';
  const l = m[1].toUpperCase();
  if (l === 'WARNING') return 'warn';
  return l.toLowerCase();
}

function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return String(d.getUTCHours()).padStart(2,'0') + ':' +
         String(d.getUTCMinutes()).padStart(2,'0') + ':' +
         String(d.getUTCSeconds()).padStart(2,'0');
}

