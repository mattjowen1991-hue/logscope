// === FILE LOADING ===
function loadFiles(files) {
  $('loadingBar').classList.add('active');
  $('statusLeft').textContent = 'Reading files...';

  const fileArray = Array.from(files);
  const results = [];
  let read = 0;

  fileArray.forEach((file, idx) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      results.push({ name: file.name, index: idx, text });
      read++;
      if (read === fileArray.length) processFiles(results);
    };
    reader.onerror = () => { read++; if (read === fileArray.length) processFiles(results); };
    reader.readAsText(file);
  });
}

function loadPastedText(text) {
  processFiles([{ name: 'pasted-log', index: 0, text: text.replace(/\r\n/g, '\n').replace(/\r/g, '\n') }]);
}

function processFiles(files) {
  // Sort files by first timestamp found
  files.forEach(f => {
    const lines = f.text.split('\n');
    for (const line of lines) {
      const ts = parseTs(line);
      if (ts) { f.firstTs = ts; break; }
    }
    if (!f.firstTs) f.firstTs = Infinity;
  });
  files.sort((a, b) => a.firstTs - b.firstTs);

  // Assign colors
  fileColors = files.map((f, i) => ({ name: f.name, color: FILE_COLORS[i % FILE_COLORS.length] }));

  // Parse all lines with file origin
  let rawLines = [];
  files.forEach((f, fileIdx) => {
    const lines = f.text.split('\n');
    let lastTs = null;
    lines.forEach((line, lineInFile) => {
      if (!line.trim()) return; // skip empty
      const ts = parseTs(line);
      if (ts) lastTs = ts;
      const level = parseLevel(line);
      // Extract content after the level tag
      let content = line;
      rawLines.push({
        ts: ts || lastTs,
        level,
        content,
        fileIndex: fileIdx,
        fileName: f.name,
        raw: line
      });
    });
  });

  // Sort all lines chronologically (stable sort preserves order within same timestamp)
  rawLines.sort((a, b) => {
    if (!a.ts && !b.ts) return 0;
    if (!a.ts) return 1;
    if (!b.ts) return -1;
    return a.ts - b.ts;
  });

  // Assign line numbers
  rawLines.forEach((l, i) => l.lineNum = i + 1);

  allLines = rawLines;
  activeFiles = new Set(files.map((_, i) => i));
  activeLevels = new Set(['error','warn','info','debug','audit','trace','other']);

  // Build UI
  buildFileChips();
  applyFilters();
  showFeed();
  updateStats();

  $('loadingBar').classList.remove('active');
  $('statusLeft').textContent = `${allLines.length.toLocaleString()} lines loaded from ${files.length} file${files.length > 1 ? 's' : ''}`;
}

