const { core, mpv, input, preferences, sidebar, event } = iina;

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

// ─── Sidebar sync ─────────────────────────────────────────────────────────────

function pushToSidebar() {
  sidebar.postMessage("update", { bookmarks: getBookmarksForCurrent() });
}

// ─── Actions ──────────────────────────────────────────────────────────────────

function addBookmark(label) {
  const time = mpv.get("time-pos");
  if (time == null) return;

  const key = getCurrentKey();
  if (!key) return;

  const all = getAllBookmarks();
  if (!all[key]) all[key] = [];

  const bm = {
    id: Date.now(),
    time: Number(time),
    label: label || formatTime(Number(time)),
  };

  all[key].push(bm);
  all[key].sort((a, b) => a.time - b.time);
  saveAllBookmarks(all);

  core.osd(`Bookmark added: ${bm.label}`);
  pushToSidebar();
}

function deleteBookmark(id) {
  const key = getCurrentKey();
  const all = getAllBookmarks();
  if (!all[key]) return;
  all[key] = all[key].filter((b) => b.id !== id);
  saveAllBookmarks(all);
  pushToSidebar();
}

function renameBookmark(id, label) {
  const key = getCurrentKey();
  const all = getAllBookmarks();
  const bm = (all[key] || []).find((b) => b.id === id);
  if (!bm) return;
  bm.label = label;
  saveAllBookmarks(all);
  pushToSidebar();
}

function jumpTo(time) {
  mpv.set("time-pos", time);
}

// ─── Keyboard shortcuts ───────────────────────────────────────────────────────

// b — add a bookmark at the current playback position
input.onKeyDown("b", () => addBookmark());

// 1–9 — jump to the nth bookmark for the current file
for (let i = 1; i <= 9; i++) {
  input.onKeyDown(String(i), () => {
    const bm = getBookmarksForCurrent()[i - 1];
    if (bm) {
      jumpTo(bm.time);
      core.osd(`Jumped to bookmark ${i}: ${bm.label}`);
    }
  });
}

// ─── Events ───────────────────────────────────────────────────────────────────

// Refresh sidebar whenever a new file starts playing
event.on("mpv.file-loaded", () => pushToSidebar());

// ─── Sidebar messages ─────────────────────────────────────────────────────────

sidebar.onMessage("ready", () => pushToSidebar());
sidebar.onMessage("add", ({ label }) => addBookmark(label || undefined));
sidebar.onMessage("delete", ({ id }) => deleteBookmark(id));
sidebar.onMessage("jump", ({ time }) => jumpTo(time));
sidebar.onMessage("rename", ({ id, label }) => renameBookmark(id, label));

// ─── Boot ─────────────────────────────────────────────────────────────────────

sidebar.loadHTML("sidebar.html");
