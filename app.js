// Honij 홈페이지 — 언어 전환, 벌집 그림, 최신 릴리스의 설치 파일 연결
"use strict";

/** 설치 파일이 올라가는 공개 저장소 */
const REPO = "qkrwlsdh/honij-app";
const RELEASES_URL = `https://github.com/${REPO}/releases`;
const LIST_API = `https://api.github.com/repos/${REPO}/releases?per_page=30`;
/** 업데이트 이력에서 처음부터 펼쳐 보여 주는 버전 수 */
const HISTORY_SHOWN = 5;

/** 화면에 있는 한국어가 기본값이고, 여기에는 영어만 둡니다(한국어는 처음 HTML 에서 읽어 둠) */
const EN = {
  "doc.title": "Honij — Keep your PC in order (file search · disk cleanup · Explorer decoration)",
  "nav.features": "Features",
  "nav.download": "Download",
  "nav.install": "Install help",
  "nav.history": "Release history",
  "hero.eyebrow": "macOS · Windows · Free",
  "hero.title": "Find it. Clear it.<br>Tell it apart.",
  "hero.sub": "One app to keep your PC in order.",
  "hero.lede": "Find files from a few letters of their name, see what is taking up space before you clear it, and tell File Explorer windows apart by a color for each folder.",
  "hero.download": "Download",
  "hero.other": "See other installers",
  "hero.hive": "cells for your disk. Each cell is 1/19 of the whole.",
  "features.title": "What it does",
  "f1.title": "File search",
  "f1.body": "Honij indexes your drives ahead of time and shows results as you type. A shortcut opens the quick search window from anywhere.",
  "f2.title": "Decorate Explorer",
  "f2.body": "Give a folder a color and a label, and every File Explorer window showing that folder gets a colored border. No more mixing up windows.",
  "f2.tagA": "Production",
  "f2.tagB": "Backup",
  "f7.title": "Explorer index tabs",
  "f7.body": "Fold the File Explorer windows you are not using into tabs on the edge of the screen. Click a tab and the window comes back where it was. Tabs take the color you set for the folder.",
  "f7.tabA": "PROD",
  "f7.tabB": "PICS",
  "f7.tabC": "LOGS",
  "f7.fly": "Server logs",
  "f3.title": "Disk analysis",
  "f3.body": "Drill into folders sorted by size to see where the space went.",
  "f4.title": "Large files · Junk cleanup",
  "f4.body": "Finds big files, caches and temporary files, lists them, and removes only what you pick.",
  "f5.title": "App removal",
  "f5.body": "Finds the settings and cache files an app leaves behind when you remove it.",
  "f6.title": "Notes on files and folders",
  "f6.body": "Attach a note to a file or folder and find it again later by what you wrote.",
  "dl.title": "Download",
  "dl.loading": "Checking the latest version…",
  "dl.win": "Windows installer",
  "dl.recommended": "Recommended",
  "dl.winNote": "Windows 10 · 11 (64-bit). This is the one most people need.",
  "dl.offline": "Windows offline installer",
  "dl.offlineNote": "For PCs without internet access. Larger because it includes WebView2.",
  "dl.msi": "Windows MSI",
  "dl.msiNote": "The format used for company-wide deployment.",
  "dl.mac": "macOS",
  "dl.macNote": "macOS 11 or later. Runs on both Apple Silicon and Intel.",
  "dl.get": "Get",
  "dl.all": "Earlier versions and release notes",
  "dl.version": "Version {v} · {d}",
  "dl.count": "{n} downloads",
  "dl.failed": "Couldn't check the latest version. The buttons open the release page.",
  "hi.title": "Release history",
  "hi.loading": "Loading…",
  "hi.older": "Show earlier versions",
  "hi.latest": "Latest",
  "hi.empty": "No version has been published yet.",
  "hi.failed": "Couldn't load the release history.",
  "hi.noNotes": "No notes were written for this version.",
  "hi.f.win": "Windows",
  "hi.f.offline": "Windows offline",
  "hi.f.msi": "MSI",
  "hi.f.mac": "macOS",
  "dl.for.win": "for Windows",
  "dl.for.mac": "for macOS",
  "in.title": "If a warning appears during install",
  "in.lede": "Honij is not code-signed yet, so the operating system blocks it once on first launch. Here is how to get past that.",
  "in.w1": "In the “Windows protected your PC” window, click <b>More info</b>.",
  "in.w2": "Click <b>Run anyway</b>.",
  "in.w3": "If the installer window is slow to appear, your antivirus is scanning the new file. Give it a moment.",
  "in.m1": "Open the <code>.dmg</code> and drag Honij into Applications.",
  "in.m2": "If it is blocked, go to System Settings → Privacy &amp; Security.",
  "in.m3": "Click <b>Open Anyway</b> near the bottom.",
  "foot.issues": "Contact · Report a bug",
};
const KO = {
  "doc.title": document.title,
  "dl.version": "버전 {v} · {d}",
  "dl.count": "누적 {n}회 다운로드",
  "dl.failed": "최신 버전을 확인하지 못했습니다. 버튼을 누르면 릴리스 페이지로 갑니다.",
  "dl.for.win": "Windows 용",
  "dl.for.mac": "macOS 용",
  "hi.latest": "최신",
  "hi.empty": "아직 공개된 버전이 없습니다.",
  "hi.failed": "업데이트 이력을 불러오지 못했습니다.",
  "hi.noNotes": "변경 내용이 적혀 있지 않습니다.",
  "hi.f.win": "Windows",
  "hi.f.offline": "Windows 오프라인",
  "hi.f.msi": "MSI",
  "hi.f.mac": "macOS",
};
for (const el of document.querySelectorAll("[data-i18n]")) KO[el.dataset.i18n] = el.innerHTML;

let lang = "ko";
let releases = []; // 공개된 버전 전부(새 것부터): { version, date, notes, assets: { win, offline, msi, mac } }
let release = null; // 그중 최신
let releaseFailed = false;

const t = (key) => (lang === "en" ? EN[key] : KO[key]) ?? KO[key] ?? key;

function setLang(next) {
  lang = next === "en" ? "en" : "ko";
  document.documentElement.lang = lang;
  document.title = t("doc.title");
  // 사전에 있는 문구만 넣습니다(바깥에서 온 글자는 여기로 오지 않음)
  for (const el of document.querySelectorAll("[data-i18n]")) el.innerHTML = t(el.dataset.i18n);
  for (const b of document.querySelectorAll(".lang button")) b.setAttribute("aria-pressed", String(b.dataset.lang === lang));
  try { localStorage.setItem("honij-lang", lang); } catch { /* 저장이 막힌 브라우저는 그냥 넘어감 */ }
  renderRelease();
}

function initialLang() {
  const q = new URLSearchParams(location.search).get("lang");
  if (q) return q;
  try {
    const saved = localStorage.getItem("honij-lang");
    if (saved) return saved;
  } catch { /* 위와 같음 */ }
  return (navigator.language || "ko").toLowerCase().startsWith("ko") ? "ko" : "en";
}

/** 방문자의 운영 체제: "win" | "mac" | null(그 밖) */
function detectOs() {
  const s = `${navigator.userAgentData?.platform ?? ""} ${navigator.platform ?? ""} ${navigator.userAgent}`.toLowerCase();
  if (/iphone|ipad|android/.test(s)) return null;
  if (s.includes("win")) return "win";
  if (s.includes("mac")) return "mac";
  return null;
}

/** 릴리스에 붙은 파일 이름으로 종류를 가립니다 */
function kindOf(name) {
  const n = name.toLowerCase();
  if (n.endsWith(".dmg")) return "mac";
  // 오프라인판은 -setup.exe 만 있습니다. 이름에 offline 이 붙은 .msi 는 잘못 올라간 복사본이라 건너뜁니다
  if (n.endsWith(".msi")) return n.includes("offline") ? null : "msi";
  if (n.endsWith("offline-setup.exe")) return "offline";
  if (n.endsWith("-setup.exe")) return "win";
  return null;
}

function formatSize(bytes) {
  const mb = bytes / 1048576;
  return mb >= 100 ? `${Math.round(mb)} MB` : `${mb.toFixed(1)} MB`;
}

function toRelease(data) {
  const assets = {};
  let downloads = 0; // 설치 파일을 받아 간 횟수 (설치 파일이 아닌 첨부는 세지 않음)
  for (const a of data.assets ?? []) {
    const kind = kindOf(String(a.name));
    if (kind) downloads += Number(a.download_count) || 0;
    const url = String(a.browser_download_url ?? "");
    if (kind && !assets[kind] && url.startsWith(`https://github.com/${REPO}/`)) assets[kind] = { url, size: Number(a.size) || 0 };
  }
  return { version: String(data.tag_name ?? "").replace(/^v/, ""), date: data.published_at, notes: String(data.body ?? ""), assets, downloads };
}

async function loadRelease() {
  try {
    const res = await fetch(LIST_API, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const list = await res.json();
    if (!Array.isArray(list)) throw new Error("unexpected response");
    releases = list.filter((r) => !r.draft && !r.prerelease).map(toRelease);
    release = releases[0] ?? null;
  } catch {
    releaseFailed = true;
  }
  document.getElementById("history-status").dataset.loaded = "1";
  renderRelease();
}

const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString(lang === "en" ? "en-US" : "ko-KR", { year: "numeric", month: "long", day: "numeric" }) : "");

/** 한 줄 안의 **굵게**, `코드`, [글](https://…) 만 꾸밉니다. 나머지는 글자 그대로 넣습니다. */
function appendInline(parent, text) {
  const re = /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    parent.append(text.slice(last, m.index));
    let el;
    if (m[1] !== undefined) { el = document.createElement("b"); el.textContent = m[1]; }
    else if (m[2] !== undefined) { el = document.createElement("code"); el.textContent = m[2]; }
    else { el = document.createElement("a"); el.textContent = m[3]; el.href = m[4]; el.rel = "noopener"; }
    parent.append(el);
    last = m.index + m[0].length;
  }
  parent.append(text.slice(last));
}

/**
 * 릴리스 본문(마크다운)을 제목 · 목록 · 문단으로만 옮깁니다. HTML 로 해석하지 않습니다.
 * 릴리스마다 똑같이 붙는 "설치 방법" 부분은 건너뜁니다(홈페이지에 따로 있음).
 * @returns {boolean} 보여 줄 내용이 있었는지
 */
function renderNotes(container, markdown) {
  let list = null;
  let skipping = false;
  let any = false;
  for (const raw of markdown.replace(/<!--[\s\S]*?-->/g, "").split(/\r?\n/)) {
    const line = raw.trim();
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    if (heading) {
      skipping = /^(설치\s*방법|install)/i.test(heading[1]);
      list = null;
      if (skipping) continue;
      const h = document.createElement("h4");
      appendInline(h, heading[1]);
      container.append(h);
      any = true;
      continue;
    }
    if (skipping || !line) { if (!line) list = null; continue; }
    const item = line.match(/^[-*]\s+(.*)$/);
    if (item) {
      if (!list) { list = document.createElement("ul"); container.append(list); }
      const li = document.createElement("li");
      appendInline(li, item[1]);
      list.append(li);
    } else if (list && /^\s{2,}/.test(raw) && list.lastElementChild) {
      // 목록 항목의 이어지는 줄
      list.lastElementChild.append(" ");
      appendInline(list.lastElementChild, line);
    } else {
      list = null;
      const p = document.createElement("p");
      appendInline(p, line);
      container.append(p);
    }
    any = true;
  }
  return any;
}

function releaseItem(r, isLatest) {
  const li = document.createElement("li");
  const head = document.createElement("div");
  head.className = "rel-head";
  const ver = document.createElement("span");
  ver.className = "rel-ver";
  ver.textContent = r.version;
  const time = document.createElement("time");
  time.textContent = formatDate(r.date);
  if (r.date) time.dateTime = r.date;
  head.append(ver, time);
  if (isLatest) {
    const badge = document.createElement("span");
    badge.className = "rel-latest";
    badge.textContent = t("hi.latest");
    head.append(badge);
  }
  const notes = document.createElement("div");
  notes.className = "rel-notes";
  if (!renderNotes(notes, r.notes)) {
    const none = document.createElement("p");
    none.className = "muted";
    none.textContent = t("hi.noNotes");
    notes.append(none);
  }
  li.append(head, notes);
  const files = document.createElement("p");
  files.className = "rel-files";
  for (const kind of ["win", "offline", "msi", "mac"]) {
    const asset = r.assets[kind];
    if (!asset) continue;
    const a = document.createElement("a");
    a.href = asset.url;
    a.textContent = t(`hi.f.${kind}`);
    files.append(a);
  }
  if (files.childElementCount) li.append(files);
  return li;
}

function renderHistory() {
  const status = document.getElementById("history-status");
  const first = document.getElementById("history-list");
  const older = document.getElementById("history-older");
  const olderList = document.getElementById("history-older-list");
  first.replaceChildren(...releases.slice(0, HISTORY_SHOWN).map((r, i) => releaseItem(r, i === 0)));
  olderList.replaceChildren(...releases.slice(HISTORY_SHOWN).map((r) => releaseItem(r, false)));
  older.hidden = releases.length <= HISTORY_SHOWN;
  status.hidden = releases.length > 0;
  if (releaseFailed) {
    status.textContent = `${t("hi.failed")} `;
    const a = document.createElement("a");
    a.href = RELEASES_URL;
    a.textContent = "GitHub";
    status.append(a);
  } else if (!releases.length && release === null && status.dataset.loaded) {
    status.textContent = t("hi.empty");
  }
}

function renderRelease() {
  const os = detectOs();
  const versionLine = document.getElementById("dl-version");
  const main = document.getElementById("main-download");
  const mainMeta = document.getElementById("main-download-meta");
  const heroLine = document.getElementById("release-line");

  for (const li of document.querySelectorAll("#files li")) {
    const kind = li.dataset.kind;
    const asset = release?.assets[kind];
    const link = li.querySelector("a");
    link.href = asset ? asset.url : `${RELEASES_URL}/latest`;
    li.classList.toggle("missing", Boolean(release) && !asset);
    li.classList.toggle("mine", kind === os);
    li.querySelector(".size")?.remove();
    if (asset?.size) {
      const size = document.createElement("span");
      size.className = "size";
      size.textContent = formatSize(asset.size);
      li.querySelector("strong").after(size);
    }
  }

  if (release) {
    const text = t("dl.version").replace("{v}", release.version).replace("{d}", formatDate(release.date));
    // 모든 버전을 합친 횟수. 아직 0 이면 적지 않음
    const total = releases.reduce((sum, r) => sum + r.downloads, 0);
    const count = total > 0 ? ` · ${t("dl.count").replace("{n}", total.toLocaleString(lang === "en" ? "en-US" : "ko-KR"))}` : "";
    versionLine.textContent = text + count;
    heroLine.textContent = text;
    heroLine.hidden = false;
  } else if (releaseFailed) {
    versionLine.textContent = t("dl.failed");
  }

  // 첫 화면 버튼: 방문자 OS 에 맞는 파일이 있으면 바로 받게 하고, 없으면 목록으로 보냅니다
  const mine = os && release?.assets[os];
  main.href = mine ? mine.url : "#download";
  mainMeta.textContent = os ? t(`dl.for.${os}`) : "";
  renderHistory();
}

/** 벌집 디스크 지도: 가운데 1칸 + 둘레 6칸 + 바깥 12칸 = 19칸 */
function drawHive() {
  const svg = document.getElementById("hive");
  const R = 52; // 한 칸의 반지름(꼭짓점까지)
  const GAP = 5;
  const cells = [];
  for (let q = -2; q <= 2; q++) {
    for (let r = Math.max(-2, -q - 2); r <= Math.min(2, -q + 2); r++) {
      cells.push({ x: (R + GAP) * Math.sqrt(3) * (q + r / 2), y: (R + GAP) * 1.5 * r });
    }
  }
  // 위에서 아래로, 왼쪽에서 오른쪽으로 채웁니다(앱의 홈 화면과 같은 순서)
  cells.sort((a, b) => a.y - b.y || a.x - b.x);
  const FULL = 11; // 꽉 찬 칸
  const points = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 90);
    return [R * Math.cos(a), R * Math.sin(a)];
  });
  cells.forEach((c, i) => {
    const p = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    p.setAttribute("points", points.map(([x, y]) => `${(c.x + x).toFixed(1)},${(c.y + y).toFixed(1)}`).join(" "));
    p.setAttribute("class", `cell${i < FULL ? " full" : i === FULL ? " part" : ""}`);
    p.style.setProperty("--i", i);
    svg.append(p);
  });
}

for (const b of document.querySelectorAll(".lang button")) b.addEventListener("click", () => setLang(b.dataset.lang));
document.getElementById("issues").href = `https://github.com/${REPO}/issues`;
drawHive();
setLang(initialLang());
loadRelease();
