# LogScope - Hubstaff Log Explorer

A dev/engineering tool for exploring Hubstaff client logs. Merges multiple log files into a single chronological feed with file-origin color coding, search, filtering, and virtual scrolling for 500k+ line datasets.

## Features

- Chronological merge - drop multiple files, all lines sorted by timestamp into one feed
- File color coding - colored left border per source file
- Virtual scrolling - handles 500k+ lines smoothly
- Search - real-time text search with match highlighting (Ctrl+F)
- Level filtering - toggle ERROR/WARN/INFO/DEBUG/AUDIT/TRACE
- File dropdown - grouped checkboxes to toggle file visibility
- Zip support - drop a .zip and all log files are extracted automatically
- Line highlighting - click any line to highlight it

## Project Structure

- index.html (HTML shell)
- css/styles.css (Matrix/terminal theme)
- js/state.js (state vars, constants, parsers)
- js/file-loader.js (file reading, zip extraction, merge/sort)
- js/feed-renderer.js (filtering, virtual scroll rendering)
- js/ui.js (file dropdown, stats, show/hide)
- js/events.js (all event handlers)
