// Honij 홈페이지 — 언어 전환, 벌집 그림, 최신 릴리스의 설치 파일 연결
"use strict";

/** 설치 파일이 올라가는 공개 저장소 */
const REPO = "qkrwlsdh/honij-app";
const RELEASES_URL = `https://github.com/${REPO}/releases`;
const LATEST_API = `https://api.github.com/repos/${REPO}/releases/latest`;

/** 화면에 있는 한국어가 기본값이고, 여기에는 영어만 둡니다(한국어는 처음 HTML 에서 읽어 둠) */
const EN = {
  "doc.title": "Honij — Keep your PC in order (file search · disk cleanup · Explorer decoration)",
  "nav.features": "Features",
  "nav.download": "Download",
  "nav.install": "Install help",
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
  "dl.failed": "Couldn't check the latest version. The buttons open the release page.",
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
  "dl.failed": "최신 버전을 확인하지 못했습니다. 버튼을 누르면 릴리스 페이지로 갑니다.",
  "dl.for.win": "Windows 용",
  "dl.for.mac": "macOS 용",
};
for (const el of document.querySelectorAll("[data-i18n]")) KO[el.dataset.i18n] = el.innerHTML;

let lang = "ko";
let release = null; // { version, date, assets: { win, offline, msi, mac } }
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
  if (n.endsWith(".msi")) return "msi";
  if (n.endsWith("offline-setup.exe")) return "offline";
  if (n.endsWith("-setup.exe")) return "win";
  return null;
}

function formatSize(bytes) {
  const mb = bytes / 1048576;
  return mb >= 100 ? `${Math.round(mb)} MB` : `${mb.toFixed(1)} MB`;
}

async function loadRelease() {
  try {
    const res = await fetch(LATEST_API, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const assets = {};
    for (const a of data.assets ?? []) {
      const kind = kindOf(String(a.name));
      const url = String(a.browser_download_url ?? "");
      if (kind && !assets[kind] && url.startsWith(`https://github.com/${REPO}/`)) assets[kind] = { url, size: Number(a.size) || 0 };
    }
    release = { version: String(data.tag_name ?? "").replace(/^v/, ""), date: data.published_at, assets };
  } catch {
    releaseFailed = true;
  }
  renderRelease();
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
    const date = release.date ? new Date(release.date).toLocaleDateString(lang === "en" ? "en-US" : "ko-KR", { year: "numeric", month: "long", day: "numeric" }) : "";
    const text = t("dl.version").replace("{v}", release.version).replace("{d}", date);
    versionLine.textContent = text;
    heroLine.textContent = text;
    heroLine.hidden = false;
  } else if (releaseFailed) {
    versionLine.textContent = t("dl.failed");
  }

  // 첫 화면 버튼: 방문자 OS 에 맞는 파일이 있으면 바로 받게 하고, 없으면 목록으로 보냅니다
  const mine = os && release?.assets[os];
  main.href = mine ? mine.url : "#download";
  mainMeta.textContent = os ? t(`dl.for.${os}`) : "";
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
document.getElementById("all-releases").href = RELEASES_URL;
document.getElementById("issues").href = `https://github.com/${REPO}/issues`;
drawHive();
setLang(initialLang());
loadRelease();
