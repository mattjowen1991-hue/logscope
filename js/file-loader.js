// === FILE LOADING ===
async function loadFiles(files) {
  $('loadingBar').classList.add('active');
  parseStartTime = performance.now();

  const fileArray = Array.from(files);
  const results = [];
  let processed = 0;

  for (const file of fileArray) {
    $('statusLeft').textContent = 'Reading ' + file.name + '...';

    if (file.name.endsWith('.zip')) {
      // Extract zip contents
      try {
        const zip = await JSZip.loadAsync(file);
        const entries = Object.entries(zip.files).filter(([n, f]) => !f.dir && !n.endsWith('.zip'));
        for (const [name, entry] of entries) {
          const text = await entry.async('string');
          const shortName = name.includes('/') ? name.split('/').pop() : name;
          results.push({ name: shortName, text: text.replace(/\r\n/g, '\n').replace(/\r/g, '\n') });
        }
      } catch(e) {
        console.warn('Failed to read zip:', file.name, e);
      }
    } else {
      const text = await file.text();
      results.push({ name: file.name, text: text.replace(/\r\n/g, '\n').replace(/\r/g, '\n') });
    }
    processed++;
    $('statusLeft').textContent = 'Reading files... ' + processed + '/' + fileArray.length;
  }

  processFiles(results);
}

function loadPastedText(text) {
  $('loadingBar').classList.add('active');
  parseStartTime = performance.now();
  processFiles([{ name: 'pasted-log', text: text.replace(/\r\n/g, '\n').replace(/\r/g, '\n') }]);
}

function processFiles(files) {
  $('statusLeft').textContent = 'Parsing ' + files.length + ' files...';

  // Sort files by first timestamp found
  files.forEach(f => {
    const lines = f.text.split('\n');
    for (const line of lines) {
      const ts = parseTsMs(line);
      if (ts) { f.firstTs = ts; break; }
    }
    if (!f.firstTs) f.firstTs = Infinity;
  });
  files.sort((a, b) => a.firstTs - b.firstTs);

  // Assign colors and groups
  fileColors = files.map((f, i) => ({
    name: f.name,
    color: FILE_COLORS[i % FILE_COLORS.length],
    group: getFileGroup(f.name)
  }));

  fileGroups = {};
  fileColors.forEach((f, i) => {
    if (!fileGroups[f.group]) fileGroups[f.group] = [];
    fileGroups[f.group].push(i);
  });

  // Parse all lines with file origin
  $('statusLeft').textContent = 'Parsing lines...';
  let rawLines = [];
  files.forEach((f, fileIdx) => {
    const lines = f.text.split('\n');
    let lastTs = null;
    for (let j = 0; j < lines.length; j++) {
      const line = lines[j];
      if (!line.trim()) continue;
      const ts = parseTsMs(line);
      if (ts) lastTs = ts;
      rawLines.push({
        ts: ts || lastTs,
        level: parseLevelNum(line),
        content: line,
        fileIndex: fileIdx,
        fileName: f.name
      });
    }
  });

  // Sort all lines chronologically
  $('statusLeft').textContent = 'Sorting ' + rawLines.length.toLocaleString() + ' lines...';
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
  activeLevels = new Set([0,1,2,3,4,5,6]);

  // Build UI
  buildFileChips();
  applyFilters();
  showFeed();
  updateStats();

  const elapsed = ((performance.now() - parseStartTime) / 1000).toFixed(1);
  $('loadingBar').classList.remove('active');
  $('statusLeft').textContent = allLines.length.toLocaleString() + ' lines loaded from ' + files.length + ' files in ' + elapsed + 's';
}
