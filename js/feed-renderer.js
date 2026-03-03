// === FILTERING ===
function applyFilters() {
  filteredLines = allLines.filter(l => {
    if (!activeFiles.has(l.fileIndex)) return false;
    if (!activeLevels.has(l.level)) return false;
    if (searchTerm && !l.raw.toLowerCase().includes(searchTerm)) return false;
    return true;
  });

  // Track search matches
  if (searchTerm) {
    searchMatches = filteredLines.filter(l => l.raw.toLowerCase().includes(searchTerm));
    $('searchCount').textContent = searchMatches.length + ' matches';
  } else {
    searchMatches = [];
    $('searchCount').textContent = filteredLines.length.toLocaleString() + ' lines';
  }

  renderFeed();
}

// === VIRTUAL SCROLL FEED ===
const ROW_H = 20;
const BUFFER = 30;

function renderFeed() {
  const container = $('feedContainer');
  const feed = $('logFeed');
  const total = filteredLines.length;
  const totalHeight = total * ROW_H;

  feed.style.height = totalHeight + 'px';
  feed.style.position = 'relative';

  // Clear existing
  feed.innerHTML = '';

  // Render visible rows
  const scrollTop = container.scrollTop;
  const viewH = container.clientHeight;
  const startIdx = Math.max(0, Math.floor(scrollTop / ROW_H) - BUFFER);
  const endIdx = Math.min(total, Math.ceil((scrollTop + viewH) / ROW_H) + BUFFER);

  const fragment = document.createDocumentFragment();
  for (let i = startIdx; i < endIdx; i++) {
    const l = filteredLines[i];
    const row = document.createElement('div');
    row.className = 'log-line';
    if (searchTerm && l.raw.toLowerCase().includes(searchTerm)) {
      row.classList.add('search-match');
    }
    row.style.position = 'absolute';
    row.style.top = (i * ROW_H) + 'px';
    row.style.left = '0';
    row.style.right = '0';
    row.style.height = ROW_H + 'px';

    const fileColor = fileColors[l.fileIndex]?.color || 'var(--text-dim)';

    // Highlight search matches in content
    let displayContent = escapeHtml(l.content);
    if (searchTerm) {
      const re = new RegExp('(' + escapeRegex(searchTerm) + ')', 'gi');
      displayContent = displayContent.replace(re, '<span class="hl">$1</span>');
    }

    row.innerHTML =
      '<div class="file-indicator" style="background:' + fileColor + '"></div>' +
      '<div class="line-num">' + l.lineNum + '</div>' +
      '<div class="line-ts">' + fmtTime(l.ts) + '</div>' +
      '<div class="line-level ' + l.level + '">' + (l.level === 'other' ? '' : l.level) + '</div>' +
      '<div class="line-content">' + displayContent + '</div>';

    fragment.appendChild(row);
  }
  feed.appendChild(fragment);
}

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

