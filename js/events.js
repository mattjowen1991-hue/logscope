// === EVENT HANDLERS ===

// Virtual scroll — use requestAnimationFrame for smooth scrolling
let scrollRaf = 0;
$('feedContainer').addEventListener('scroll', () => {
  cancelAnimationFrame(scrollRaf);
  scrollRaf = requestAnimationFrame(() => {
    if (filteredIndices.length > 0) renderFeed();
  });
});

// File upload
$('loadBtn').addEventListener('click', () => $('fileInput').click());
$('uploadZone').addEventListener('click', () => $('fileInput').click());
$('fileInput').addEventListener('change', (e) => {
  if (e.target.files.length > 0) loadFiles(e.target.files);
});

// Drag & drop
const zone = $('feedContainer');
zone.addEventListener('dragover', (e) => { e.preventDefault(); $('uploadZone')?.classList.add('dragover'); });
zone.addEventListener('dragleave', () => { $('uploadZone')?.classList.remove('dragover'); });
zone.addEventListener('drop', (e) => {
  e.preventDefault();
  $('uploadZone')?.classList.remove('dragover');
  if (e.dataTransfer.files.length > 0) loadFiles(e.dataTransfer.files);
});

// Paste modal
$('pasteBtn').addEventListener('click', () => $('pasteModal').classList.add('open'));
$('pasteCancel').addEventListener('click', () => $('pasteModal').classList.remove('open'));
$('pasteLoad').addEventListener('click', () => {
  const text = $('pasteArea').value.trim();
  if (text) {
    $('pasteModal').classList.remove('open');
    loadPastedText(text);
  }
});
$('pasteModal').addEventListener('click', (e) => {
  if (e.target === $('pasteModal')) $('pasteModal').classList.remove('open');
});

// Clear
$('clearBtn').addEventListener('click', showUpload);

// Search — debounced at 300ms for large datasets
let searchTimer;
$('searchInput').addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchTerm = e.target.value.trim().toLowerCase();
    lastRenderStart = -1; // force re-render
    applyFilters();
  }, 300);
});

// Ctrl+F override
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    $('searchInput').focus();
    $('searchInput').select();
  }
  if (e.key === 'Escape') {
    $('pasteModal').classList.remove('open');
    $('searchInput').blur();
  }
});

// Level filters
$('levelFilters').addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  const level = btn.dataset.level;

  if (level === 'all') {
    const allActive = document.querySelectorAll('.filter-btn.active').length === document.querySelectorAll('.filter-btn').length;
    document.querySelectorAll('.filter-btn').forEach(b => {
      if (allActive) b.classList.remove('active'); else b.classList.add('active');
    });
    if (allActive) {
      activeLevels.clear();
    } else {
      activeLevels = new Set([0,1,2,3,4,5,6]);
    }
  } else {
    btn.classList.toggle('active');
    const levelNum = LEVEL_FILTERS[level] || 0;
    if (activeLevels.has(levelNum)) activeLevels.delete(levelNum); else activeLevels.add(levelNum);
    // Update "All" button
    const allBtn = document.querySelector('.filter-btn[data-level="all"]');
    const nonAll = document.querySelectorAll('.filter-btn:not([data-level="all"])');
    if (Array.from(nonAll).every(b => b.classList.contains('active'))) allBtn.classList.add('active');
    else allBtn.classList.remove('active');
  }

  lastRenderStart = -1;
  applyFilters();
});

// Hover line info in status bar
$('feedContainer').addEventListener('mouseover', (e) => {
  const line = e.target.closest('.log-line');
  if (line) {
    const numEl = line.querySelector('.line-num');
    if (numEl) {
      const visIdx = parseInt(numEl.textContent) - 1;
      if (visIdx >= 0 && visIdx < filteredIndices.length) {
        const li = filteredIndices[visIdx];
        $('cursorPos').textContent = 'Ln ' + (visIdx + 1) + ' / ' + filteredIndices.length.toLocaleString() + ' \u00B7 ' + fileColors[lineFileIdx[li]]?.name;
      }
    }
  }
});
