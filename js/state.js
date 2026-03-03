// === STATE ===
// For 500k+ lines we store data in parallel arrays for memory efficiency
let lineCount = 0;
let lineTsMs = null;      // Float64Array — timestamp in ms
let lineLevel = null;     // Uint8Array — level enum (0=other,1=error,2=warn,3=info,4=debug,5=audit,6=trace)
let lineFileIdx = null;   // Uint8Array — file index
let lineContent = [];     // string[] — raw text
let lineTsStr = [];       // string[] — formatted time (pre-computed)

let filteredIndices = [];  // indices into the main arrays
let fileColors = [];       // { name, color, group }
let fileGroups = {};       // { groupName: [fileIdx, ...] }
let activeFiles = new Set();
let activeLevels = new Set([0,1,2,3,4,5,6]);
let searchTerm = '';
let parseStartTime = 0;

const $ = id => document.getElementById(id);
const TS_RE = /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\.?\d*/;
const LEVEL_RE = /\[(ERROR|WARN|WARNING|INFO|DEBUG|TRACE|AUDIT)\]/i;
const LEVEL_MAP = { error:1, warn:2, warning:2, info:3, debug:4, audit:5, trace:6 };
const LEVEL_NAMES = ['','error','warn','info','debug','audit','trace'];
const LEVEL_FILTERS = { error:1, warn:2, info:3, debug:4, audit:5, trace:6 };

const FILE_COLORS = [
  '#00ff41','#00e5ff','#ffb300','#ff00ff','#ff3333',
  '#4488ff','#88ff88','#ff8844','#44ffdd','#ddff44',
  '#ff6688','#66ffcc','#cc88ff','#ffcc44','#44ccff'
];

// === TIMESTAMP PARSER ===
function parseTsMs(line) {
  const m = line.match(TS_RE);
  if (!m) return 0;
  // Fast parse without Date constructor
  const d = m[1], t = m[2];
  return Date.UTC(+d.slice(0,4), +d.slice(5,7)-1, +d.slice(8,10), +t.slice(0,2), +t.slice(3,5), +t.slice(6,8));
}

function parseLevelNum(line) {
  const m = line.match(LEVEL_RE);
  if (!m) return 0;
  return LEVEL_MAP[m[1].toLowerCase()] || 0;
}

function fmtTime(ms) {
  if (!ms) return '';
  const d = new Date(ms);
  return String(d.getUTCHours()).padStart(2,'0') + ':' +
         String(d.getUTCMinutes()).padStart(2,'0') + ':' +
         String(d.getUTCSeconds()).padStart(2,'0');
}

// File group detection (hubstaff.*, crash.*, helper_hubstaff.*, etc.)
function getFileGroup(name) {
  const m = name.match(/^([a-zA-Z_]+)/);
  return m ? m[1] : name;
}
