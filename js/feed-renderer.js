// === FILTERING ===
let lastRenderStart = -1;
let lastRenderEnd = -1;

function applyFilters() {
  filteredLines = allLines.filter(l => {
    if (!activeFiles.has(l.fileIndex)) return false;
    if (!activeLevels.has(l.level)) return false;
    if (searchTerm && !l.content.toLowerCase().includes(searchTerm)) return false;
    return true;
  });

  if (searchTerm) {
    $('searchCount').textContent = filteredLines.length.toLocaleString() + ' matches';
  } else {
    $('searchCount').textContent = filteredLines.length.toLocaleString() + ' lines';
  }

  lastRenderStart = -1;
  renderFeed();
}

// === VIRTUAL SCROLL FEED ===
const ROW_H = 20;
const BUFFER = 40;

function renderFeed() {
  const container = $('feedContainer');
  const feed = $('logFeed');
  const total = filteredLines.length;
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

  const hasSearch = searchTerm.length > 0;
  const searchRe = hasSearch ? new RegExp('(' + escapeRegex(searchTerm) + ')', 'gi') : null;
  const parts = [];

  for (let i = startIdx; i < endIdx; i++) {
    const l = filteredLines[i];
    const color = fileColors[l.fileIndex]?.color || '#555';
    const levelName = LEVEL_NAMES[l.level] || '';
    const isHighlighted = (i === highlightedLine);

    let content = escapeHtml(l.content);
    if (searchRe) content = content.replace(searchRe, '<span class="hl">$1</span>');

    parts.push(
      '<div class="log-line' + (isHighlighted ? ' highlighted' : '') + (hasSearch ? ' search-match' : '') +
      '" style="position:absolute;top:' + (i * ROW_H) + 'px;left:0;right:0;height:' + ROW_H + 'px">' +
      '<div class="file-indicator" style="background:' + color + '"></div>' +
      '<div class="line-num">' + (i + 1) + '</div>' +
      '<div class="line-ts">' + fmtTime(l.ts) + '</div>' +
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
}
