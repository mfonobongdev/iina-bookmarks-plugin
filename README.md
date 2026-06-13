# IINA Bookmarks Plugin

Bookmark moments in a video and jump back to them instantly — via keyboard shortcuts or a click in the sidebar.

## Features

- Press **`b`** to drop a bookmark at the current playback position
- Press **`1`–`9`** to jump to the 1st–9th bookmark for the current file
- Sidebar panel lists all bookmarks with timestamps and labels
- Click any bookmark in the sidebar to seek to it
- Double-click a label (or click the pencil icon) to rename it inline
- Delete bookmarks with the trash icon
- Bookmarks persist across sessions, scoped per video file

## Installation

1. Download or clone this repo
2. Copy `Bookmarks.iinaplugin` into your IINA plugins directory:
   ```
   ~/Library/Application Support/com.colliderli.iina/plugins/
   ```
3. Restart IINA
4. Open a video — the **Bookmarks** panel appears in the sidebar

## Usage

| Action | How |
|---|---|
| Add bookmark | Press `b` while playing |
| Add with custom label | Click **Add** in the sidebar, type a label, press Enter |
| Jump to bookmark | Press `1`–`9`, or click the bookmark in the sidebar |
| Rename | Double-click the label in the sidebar |
| Delete | Hover the bookmark and click the trash icon |

## Plugin Structure

```
Bookmarks.iinaplugin/
├── Info.json       # Plugin metadata and preference defaults
├── main.js         # Entry point: shortcuts, events, storage logic
└── sidebar.html    # Bookmark list UI (communicates via postMessage)
```

## Requirements

- [IINA](https://iina.io) 1.3.0 or later (plugin API support required)
