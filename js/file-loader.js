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

  // Sort files by first timestamp
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

  // Count total lines for pre-allocation
  $('statusLeft').textContent = 'Counting lines...';
  let totalLines = 0;
  const fileSplits = files.map(f => {
    const lines = f.text.split('\n').filter(l => l.trim());
    totalLines += lines.length;
    return lines;
  });

  // Pre-allocate typed arrays
  $('statusLeft').textContent = 'Allocating ' + totalLines.toLocaleString() + ' lines...';
  lineTsMs = new Float64Array(totalLines);
  lineLevel = new Uint8Array(totalLines);
  lineFileIdx = new Uint8Array(totalLines);
  lineContent = new Array(totalLines);
  lineTsStr = new Array(totalLines);

  // Parse all lines into arrays
  let idx = 0;
  fileSplits.forEach((lines, fileIdx) => {
    $('statusLeft').textContent = 'Parsing ' + files[fileIdx].name + '...';
    let lastTs = 0;
    for (let j = 0; j < lines.length; j++) {
      const line = lines[j];
      const ts = parseTsMs(line);
      if (ts) lastTs = ts;
      lineTsMs[idx] = ts || lastTs;
      lineLevel[idx] = parseLevelNum(line);
      lineFileIdx[idx] = fileIdx;
      lineContent[idx] = line;
      lineTsStr[idx] = fmtTime(ts || lastTs);
      idx++;
    }
  });
  lineCount = idx;

  // Sort by timestamp using an index array
  $('statusLeft').textContent = 'Sorting ' + lineCount.toLocaleString() + ' lines chronologically...';

  // Build sort indices
  const sortIdx = new Uint32Array(lineCount);
  for (let i = 0; i < lineCount; i++) sortIdx[i] = i;

  // Sort indices by timestamp (stable for same timestamps via index comparison)
  sortIdx.sort((a, b) => {
    const diff = lineTsMs[a] - lineTsMs[b];
    return diff !== 0 ? diff : a - b;
  });

  // Reorder all arrays according to sorted indices
  $('statusLeft').textContent = 'Reordering...';
  const newTs = new Float64Array(lineCount);
  const newLevel = new Uint8Array(lineCount);
  const newFile = new Uint8Array(lineCount);
  const newContent = new Array(lineCount);
  const newTsStr = new Array(lineCount);

  for (let i = 0; i < lineCount; i++) {
    const j = sortIdx[i];
    newTs[i] = lineTsMs[j];
    newLevel[i] = lineLevel[j];
    newFile[i] = lineFileIdx[j];
    newContent[i] = lineContent[j];
    newTsStr[i] = lineTsStr[j];
  }

  lineTsMs = newTs;
  lineLevel = newLevel;
  lineFileIdx = newFile;
  lineContent = newContent;
  lineTsStr = newTsStr;

  activeFiles = new Set(files.map((_, i) => i));
  activeLevels = new Set([0,1,2,3,4,5,6]);
  searchTerm = '';

  buildFileChips();
  applyFilters();
  showFeed();
  updateStats();

  const elapsed = ((performance.now() - parseStartTime) / 1000).toFixed(1);
  $('loadingBar').classList.remove('active');
  $('statusLeft').textContent = lineCount.toLocaleString() + ' lines loaded from ' + files.length + ' files in ' + elapsed + 's';
}
