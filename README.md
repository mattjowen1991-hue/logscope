# LogScope - Hubstaff Log Explorer

Dev/engineering tool for exploring Hubstaff client logs. Merges multiple log files into a single chronological feed with file-origin color coding, search, filtering, and virtual scrolling.

## Project Structure

- index.html - HTML shell
- css/styles.css - Matrix/terminal theme
- js/state.js - State vars, constants, parsers
- js/file-loader.js - File reading, zip extraction, chronological sort
- js/feed-renderer.js - Filtering, virtual scroll rendering
- js/ui.js - File dropdown, stats, show/hide
- js/events.js - Event handlers
