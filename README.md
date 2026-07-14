# IINA Bookmarks Plugin

Bookmark moments in a video and jump back to them instantly — via keyboard shortcuts or a click in the sidebar.

## Features

- Press **`b`** to drop a bookmark at the current playback position (auto-labelled with the timestamp)
- Press **`1`–`9`** to jump to the 1st–9th bookmark for the current file
- Press **`n`** / **`Shift+n`** to cycle forward / backward through bookmarks (position-based, wrapping around at either end)
- Sidebar panel lists all bookmarks with timestamps and labels
- Click any bookmark in the sidebar to seek to it
- Double-click a label (or click the pencil icon) to rename it inline
- Delete bookmarks with the trash icon
- Blue tick marks appear on the video frame at each bookmark's position relative to the total duration
- Bookmarks persist across sessions, scoped per video file

## Installation

1. Open IINA → Preferences → Plugins
2. Click **Install from GitHub**
3. Enter `mfonobongdev/iina-bookmarks-plugin`
4. Restart IINA and open a video — the **Bookmarks** panel appears in the sidebar

## Usage

| Action | How |
|---|---|
| Add bookmark | Press `b` while playing, or click **Add** in the sidebar |
| Jump to bookmark | Press `1`–`9`, or click the bookmark in the sidebar |
| Cycle bookmarks | Press `n` (forward) or `Shift+n` (backward) — relative to the current position, wrapping around |
| Rename | Double-click the label in the sidebar |
| Delete | Hover the bookmark and click the trash icon |

## Plugin Structure

```
Bookmarks.iinaplugin/
├── Info.json       # Plugin metadata and preference defaults
├── main.js         # Entry point: shortcuts, events, storage logic
├── sidebar.html    # Bookmark list UI
└── overlay.html    # Timeline tick marks rendered on the video frame
```

## Requirements

- [IINA](https://iina.io) 1.3.0 or later (plugin API support required)
