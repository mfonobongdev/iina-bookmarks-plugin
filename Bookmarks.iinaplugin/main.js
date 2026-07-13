const { core, mpv, input, preferences, sidebar, overlay, event } = iina;

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
  // set() only updates IINA's in-memory store; sync() writes it to disk.
  // Without it, all bookmarks are lost when the app quits.
  preferences.sync();
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
  overlay.postMessage("update", { bookmarks, duration });
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

// Cycle: jump to the first bookmark after the current position, wrapping to
// the first bookmark when past the last one. Position-based (not a stored
// index) so it stays correct after manual seeks. The 0.5s margin keeps a
// just-jumped-to bookmark from matching itself.
input.onKeyDown("n", () => {
  const bookmarks = getBookmarksForCurrent();
  if (bookmarks.length === 0) return true;
  const pos = mpv.getNumber("time-pos") || 0;
  const next = bookmarks.find((b) => b.time > pos + 0.5) || bookmarks[0];
  jumpTo(next.time);
  core.osd(`→ ${next.label}`);
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

// ─── Web views ────────────────────────────────────────────────────────────────

// loadFile throws if the window isn't loaded yet, and it also clears every
// onMessage listener registered on that view — so listeners must be
// (re)registered after each loadFile call, never before.
function bootViews() {
  sidebar.loadFile("sidebar.html");

  sidebar.onMessage("ready", () => pushAll());
  sidebar.onMessage("add", () => addBookmark());
  sidebar.onMessage("delete", ({ id }) => deleteBookmark(id));
  sidebar.onMessage("jump", ({ time }) => jumpTo(time));
  sidebar.onMessage("rename", ({ id, label }) => renameBookmark(id, label));

  overlay.loadFile("overlay.html");
}

event.on("iina.window-loaded", bootViews);

// When the plugin is reloaded during development the window is already loaded,
// so iina.window-loaded will never fire again — boot immediately in that case.
// On a normal launch the window isn't ready yet and loadFile throws; the catch
// swallows it and the event handler above does the real boot.
try {
  bootViews();
} catch (_) {}

// Fires once the overlay webview has finished loading (overlay.show is a
// silent no-op before that point).
event.on("iina.plugin-overlay-loaded", () => {
  // onMessage/setClickable are silent no-ops before the overlay view exists,
  // so both must be wired here rather than at eval time.
  overlay.setClickable(true);
  overlay.onMessage("jump", ({ time }) => jumpTo(time));
  overlay.show();
  pushAll();
});

event.on("iina.file-loaded", () => pushAll());
