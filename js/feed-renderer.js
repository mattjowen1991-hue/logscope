// === FILTERING ===
function applyFilters() {
  $('statusLeft').textContent = 'Filtering...';
  const t0 = performance.now();
  filteredIndices = [];

  const searchLower = searchTerm;
  const hasSearch = searchLower.length > 0;

  for (let i = 0; i < lineCount; i++) {
    if (!activeFiles.has(lineFileIdx[i])) continue;
    if (!activeLevels.has(lineLevel[i])) continue;
    if (hasSearch && !lineContent[i].toLowerCase().includes(searchLower)) continue;
    filteredIndices.push(i);
  }

  const elapsed = (performance.now() - t0).toFixed(0);

  if (hasSearch) {
    $('searchCount').textContent = filteredIndices.length.toLocaleString() + ' matches (' + elapsed + 'ms)';
  } else {
    $('searchCount').textContent = filteredIndices.length.toLocaleString() + ' lines';
  }

  renderFeed();
}

// === VIRTUAL SCROLL FEED ===
const ROW_H = 20;
const BUFFER = 40;
let lastRenderStart = -1;
let lastRenderEnd = -1;

function renderFeed() {
  const container = $('feedContainer');
  const feed = $('logFeed');
  const total = filteredIndices.length;
  const totalHeight = total * ROW_H;

  feed.style.height = totalHeight + 'px';
  feed.style.position = 'relative';

  const scrollTop = container.scrollTop;
  const viewH = container.clientHeight;
  const startIdx = Math.max(0, Math.floor(scrollTop / ROW_H) - BUFFER);
  const endIdx = Math.min(total, Math.ceil((scrollTop + viewH) / ROW_H) + BUFFER);

  // Skip if visible range unchanged
  if (startIdx === lastRenderStart && endIdx === lastRenderEnd) return;
  lastRenderStart = startIdx;
  lastRenderEnd = endIdx;

  // Build HTML string (faster than DOM for large batches)
  const hasSearch = searchTerm.length > 0;
  const searchRe = hasSearch ? new RegExp('(' + escapeRegex(searchTerm) + ')', 'gi') : null;
  const parts = [];

  for (let i = startIdx; i < endIdx; i++) {
    const li = filteredIndices[i];
    const color = fileColors[lineFileIdx[li]]?.color || '#555';
    const levelName = LEVEL_NAMES[lineLevel[li]] || '';
    const isMatch = hasSearch;
    const isHighlighted = (i === highlightedLine);

    let content = escapeHtml(lineContent[li]);
    if (searchRe) content = content.replace(searchRe, '<span class="hl">$1</span>');

    parts.push(
      '<div class="log-line' + (isHighlighted ? ' highlighted' : '') + (isMatch ? ' search-match' : '') +
      '" style="position:absolute;top:' + (i * ROW_H) + 'px;left:0;right:0;height:' + ROW_H + 'px">' +
      '<div class="file-indicator" style="background:' + color + '"></div>' +
      '<div class="line-num">' + (i + 1) + '</div>' +
      '<div class="line-ts">' + lineTsStr[li] + '</div>' +
      '<div class="line-level ' + levelName + '">' + levelName + '</div>' +
      '<div class="line-content">' + content + '</div>' +
      '</div>'
    );
  }
  feed.innerHTML = parts.join('');
}

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
