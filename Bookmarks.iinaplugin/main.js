const { core, mpv, input, preferences, sidebar, event } = iina;

// Sidebar must load first — overlay is optional and isolated so any error there
// cannot block the sidebar from running.
sidebar.loadFile("sidebar.html");

let overlay = null;
try {
  overlay = iina.overlay;
} catch (_) {}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(seconds) {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${m}:${String(sec).padStart(2, "0")}`;
}

// ─── Storage ─────────────────────────────────────────────────────────────────

function getAllBookmarks() {
  try {
    return JSON.parse(preferences.get("bookmarks") || "{}");
  } catch {
    return {};
  }
}

function saveAllBookmarks(all) {
  preferences.set("bookmarks", JSON.stringify(all));
}

function getCurrentKey() {
  return core.status.url || "";
}

function getBookmarksForCurrent() {
  const all = getAllBookmarks();
  return all[getCurrentKey()] || [];
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

function pushAll() {
  const bookmarks = getBookmarksForCurrent();
  const duration = core.status.duration;
  sidebar.postMessage("update", { bookmarks });
  if (overlay) overlay.postMessage("update", { bookmarks, duration });
}

// ─── Actions ──────────────────────────────────────────────────────────────────

function addBookmark(label) {
  const time = mpv.getNumber("time-pos");
  const key = getCurrentKey();
  if (!key) return;

  const all = getAllBookmarks();
  if (!all[key]) all[key] = [];

  const bm = {
    id: Date.now(),
    time: time,
    label: label || formatTime(time),
  };

  all[key].push(bm);
  all[key].sort((a, b) => a.time - b.time);
  saveAllBookmarks(all);

  core.osd(`Bookmark: ${bm.label}`);
  pushAll();
}

function deleteBookmark(id) {
  const key = getCurrentKey();
  const all = getAllBookmarks();
  if (!all[key]) return;
  all[key] = all[key].filter((b) => b.id !== id);
  saveAllBookmarks(all);
  pushAll();
}

function renameBookmark(id, label) {
  const key = getCurrentKey();
  const all = getAllBookmarks();
  const bm = (all[key] || []).find((b) => b.id === id);
  if (!bm) return;
  bm.label = label;
  saveAllBookmarks(all);
  pushAll();
}

function jumpTo(time) {
  core.seekTo(time);
}

// ─── Keyboard shortcuts ───────────────────────────────────────────────────────

input.onKeyDown("b", () => {
  addBookmark();
  return true;
});

for (let i = 1; i <= 9; i++) {
  input.onKeyDown(String(i), () => {
    const bm = getBookmarksForCurrent()[i - 1];
    if (bm) {
      jumpTo(bm.time);
      core.osd(`→ ${bm.label}`);
    }
    return true;
  });
}

// ─── Events ───────────────────────────────────────────────────────────────────

// On restart the window isn't ready when main.js first runs, so loadFile at
// the top of the file is a no-op. Re-call it here once the window is ready.
event.on("iina.window-loaded", () => {
  sidebar.loadFile("sidebar.html");
  pushAll();
});

event.on("iina.file-loaded", () => pushAll());

// ─── Sidebar messages ─────────────────────────────────────────────────────────

sidebar.onMessage("ready", () => pushAll());
sidebar.onMessage("add", () => addBookmark());
sidebar.onMessage("delete", ({ id }) => deleteBookmark(id));
sidebar.onMessage("jump", ({ time }) => jumpTo(time));
sidebar.onMessage("rename", ({ id, label }) => renameBookmark(id, label));

// ─── Overlay boot (optional) ──────────────────────────────────────────────────

try {
  if (overlay) {
    overlay.onMessage("ready", () => pushAll());
    overlay.loadFile("overlay.html");
    overlay.show();
  }
} catch (_) {}
