// === EVENT HANDLERS ===

// Virtual scroll
$('feedContainer').addEventListener('scroll', () => {
  if (filteredLines.length > 0) renderFeed();
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

// Search
let searchTimer;
$('searchInput').addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchTerm = e.target.value.trim().toLowerCase();
    applyFilters();
  }, 150);
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
    // Toggle all
    const allActive = document.querySelectorAll('.filter-btn.active').length === document.querySelectorAll('.filter-btn').length;
    document.querySelectorAll('.filter-btn').forEach(b => {
      if (allActive) {
        b.classList.remove('active');
      } else {
        b.classList.add('active');
      }
    });
    if (allActive) {
      activeLevels.clear();
    } else {
      activeLevels = new Set(['error','warn','info','debug','audit','trace','other']);
    }
  } else {
    btn.classList.toggle('active');
    if (activeLevels.has(level)) {
      activeLevels.delete(level);
    } else {
      activeLevels.add(level);
    }
    // Update "All" button state
    const allBtn = document.querySelector('.filter-btn[data-level="all"]');
    const nonAllBtns = document.querySelectorAll('.filter-btn:not([data-level="all"])');
    const allActive = Array.from(nonAllBtns).every(b => b.classList.contains('active'));
    if (allActive) allBtn.classList.add('active'); else allBtn.classList.remove('active');
  }

  applyFilters();
});

// Hover line number in status bar
$('feedContainer').addEventListener('mouseover', (e) => {
  const line = e.target.closest('.log-line');
  if (line) {
    const num = line.querySelector('.line-num')?.textContent;
    const fileInd = line.querySelector('.file-indicator');
    if (num) {
      const idx = parseInt(num) - 1;
      const l = allLines[idx];
      if (l) {
        $('cursorPos').textContent = 'Ln ' + num + ' · ' + l.fileName;
      }
    }
  }
});
