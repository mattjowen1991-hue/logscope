// === UI BUILDERS ===
function buildFileChips() {
  const container = $('fileChips');
  container.innerHTML = '';
  fileColors.forEach((f, i) => {
    const chip = document.createElement('button');
    chip.className = 'file-chip active';
    chip.dataset.fileIndex = i;
    chip.innerHTML = '<span class="dot" style="background:' + f.color + '"></span>' + f.name;
    chip.addEventListener('click', () => {
      if (activeFiles.has(i)) {
        activeFiles.delete(i);
        chip.classList.remove('active');
      } else {
        activeFiles.add(i);
        chip.classList.add('active');
      }
      applyFilters();
    });
    container.appendChild(chip);
  });
}

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
  allLines = [];
  filteredLines = [];
  fileColors = [];
  $('statusLeft').textContent = 'Ready';
  $('searchInput').value = '';
  searchTerm = '';
}

function updateStats() {
  $('statLines').textContent = allLines.length.toLocaleString();
  $('statFiles').textContent = fileColors.length;

  const timestamps = allLines.filter(l => l.ts).map(l => l.ts);
  if (timestamps.length > 1) {
    const min = Math.min(...timestamps);
    const max = Math.max(...timestamps);
    const diffH = ((max - min) / 3600000).toFixed(1);
    const startDate = new Date(min).toISOString().split('T')[0];
    const endDate = new Date(max).toISOString().split('T')[0];
    if (startDate === endDate) {
      $('statSpan').textContent = startDate + ' (' + diffH + 'h)';
    } else {
      $('statSpan').textContent = startDate + ' → ' + endDate + ' (' + diffH + 'h)';
    }
  } else {
    $('statSpan').textContent = '—';
  }
}

