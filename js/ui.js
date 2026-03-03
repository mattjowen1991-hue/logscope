// === UI BUILDERS ===
function buildFileChips() {
  const list = $('fileDropdownList');
  list.innerHTML = '';
  updateFileDropdownCount();

  const groups = Object.keys(fileGroups).sort();

  groups.forEach(groupName => {
    const indices = fileGroups[groupName];

    if (indices.length > 1) {
      const groupRow = document.createElement('label');
      groupRow.className = 'file-dd-item group-header';
      const firstColor = fileColors[indices[0]].color;
      groupRow.innerHTML =
        '<input type="checkbox" checked data-group="' + groupName + '" />' +
        '<span class="file-dd-dot" style="background:' + firstColor + ';box-shadow:0 0 4px ' + firstColor + '"></span>' +
        '<span class="file-dd-name">' + groupName + '.* <span style="color:var(--text-dim);font-size:9px;">(' + indices.length + ')</span></span>';
      const groupCb = groupRow.querySelector('input');
      groupCb.addEventListener('change', () => {
        const checked = groupCb.checked;
        indices.forEach(i => { if (checked) activeFiles.add(i); else activeFiles.delete(i); });
        list.querySelectorAll('input[data-file-index]').forEach(cb => {
          const fi = parseInt(cb.dataset.fileIndex);
          if (indices.includes(fi)) cb.checked = checked;
        });
        updateFileDropdownCount();
        lastRenderStart = -1;
        applyFilters();
      });
      list.appendChild(groupRow);
    }

    indices.forEach(i => {
      const f = fileColors[i];
      const row = document.createElement('label');
      row.className = 'file-dd-item' + (indices.length > 1 ? ' indent' : '');
      row.innerHTML =
        '<input type="checkbox" checked data-file-index="' + i + '" />' +
        '<span class="file-dd-dot" style="background:' + f.color + '"></span>' +
        '<span class="file-dd-name">' + f.name + '</span>';
      const cb = row.querySelector('input');
      cb.addEventListener('change', () => {
        if (cb.checked) activeFiles.add(i); else activeFiles.delete(i);
        if (indices.length > 1) {
          const groupCb = list.querySelector('input[data-group="' + groupName + '"]');
          if (groupCb) {
            const allChecked = indices.every(j => activeFiles.has(j));
            const someChecked = indices.some(j => activeFiles.has(j));
            groupCb.checked = allChecked;
            groupCb.indeterminate = someChecked && !allChecked;
          }
        }
        updateFileDropdownCount();
        lastRenderStart = -1;
        applyFilters();
      });
      list.appendChild(row);
    });
  });

  $('fileSelectAll').onclick = () => {
    fileColors.forEach((_, i) => activeFiles.add(i));
    list.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = true; cb.indeterminate = false; });
    updateFileDropdownCount(); lastRenderStart = -1; applyFilters();
  };
  $('fileSelectNone').onclick = () => {
    activeFiles.clear();
    list.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = false; cb.indeterminate = false; });
    updateFileDropdownCount(); lastRenderStart = -1; applyFilters();
  };
}

function updateFileDropdownCount() {
  $('fileDropdownCount').textContent = '(' + activeFiles.size + '/' + fileColors.length + ')';
}

// Dropdown toggle
$('fileDropdownBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  $('fileDropdown').classList.toggle('open');
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.file-dropdown-wrap')) $('fileDropdown').classList.remove('open');
});

// Line click to highlight
let highlightedLine = -1;
$('feedContainer').addEventListener('click', (e) => {
  const row = e.target.closest('.log-line');
  if (!row) return;
  const numEl = row.querySelector('.line-num');
  if (!numEl) return;
  const visIdx = parseInt(numEl.textContent) - 1;
  highlightedLine = (highlightedLine === visIdx) ? -1 : visIdx;
  lastRenderStart = -1;
  renderFeed();
});

    function showFeed() {
  $('uploadOverlay').style.display = 'none';
  $('logFeed').style.display = 'block';
  $('toolbar').style.display = 'flex';
  $('headerStats').style.display = 'flex';
  $('clearBtn').style.display = 'inline-block';
}

function showUpload() {
  $('uploadOverlay').style.display = 'flex';
  $('logFeed').style.display = 'none';
  $('toolbar').style.display = 'none';
  $('headerStats').style.display = 'none';
  $('clearBtn').style.display = 'none';
  lineCount = 0;
  lineTsMs = null;
  lineLevel = null;
  lineFileIdx = null;
  lineContent = [];
  lineTsStr = [];
  filteredIndices = [];
  fileColors = [];
  fileGroups = {};
  lastRenderStart = -1;
  lastRenderEnd = -1;
  $('statusLeft').textContent = 'Ready';
  $('searchInput').value = '';
  searchTerm = '';
}

function updateStats() {
  $('statLines').textContent = lineCount.toLocaleString();
  $('statFiles').textContent = fileColors.length;

  if (lineCount > 0) {
    let minTs = Infinity, maxTs = 0;
    for (let i = 0; i < lineCount; i++) {
      if (lineTsMs[i] > 0) {
        if (lineTsMs[i] < minTs) minTs = lineTsMs[i];
        if (lineTsMs[i] > maxTs) maxTs = lineTsMs[i];
      }
    }
    if (minTs < Infinity && maxTs > 0) {
      const diffH = ((maxTs - minTs) / 3600000).toFixed(1);
      const startDate = new Date(minTs).toISOString().split('T')[0];
      const endDate = new Date(maxTs).toISOString().split('T')[0];
      const diffDays = Math.round((maxTs - minTs) / 86400000);
      if (diffDays <= 1) {
        $('statSpan').textContent = startDate + ' (' + diffH + 'h)';
      } else {
        $('statSpan').textContent = startDate + ' \u2192 ' + endDate + ' (' + diffDays + 'd)';
      }
    } else {
      $('statSpan').textContent = '\u2014';
    }
  }
