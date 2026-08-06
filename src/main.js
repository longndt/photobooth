import mascotUrl from './assets/mascot.png';
import './styles.css';
import { POSTER_THEMES } from './concepts.js';
import { POSTER_HEIGHT, POSTER_LAYOUTS, POSTER_WIDTH } from './poster/config.js';
import { buildPoster } from './poster/render.js';
import { loadState, saveState } from './state.js';

// ── State ─────────────────────────────────────────────────────────────────────
const isMobile = () => window.innerWidth <= 768;
let showPosterPreview = !isMobile();

const S = loadState({
  mode: 'ready',
  interval: 3,
  photos: [],
  stream: null,
  posterUrl: null,
  posterObjectUrl: null,
  photoObjectUrls: [],
  themeIndex: 0,
  photoCount: 3,
  layoutIndex: 0,
});

const THEME_OPTIONS = POSTER_THEMES.map(theme => ({ label: theme.name }));
const INTERVAL_OPTIONS = [3, 5];
const PHOTO_COUNT_OPTIONS = [3, 4];
const LAYOUT_OPTIONS = [
  { label: 'khung A' },
  { label: 'khung B' },
];
const q  = s => document.querySelector(s);
const qa = s => [...document.querySelectorAll(s)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const nextFrame = () => new Promise(r => requestAnimationFrame(r));
const raf = () => new Promise(r => requestAnimationFrame(r));
const formatToday = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};
const fadeOutProcessing = async () => {
  const cov = q('#cov');
  cov.classList.add('is-hiding');
  await sleep(260);
  cov.classList.remove('is-processing', 'is-hiding');
  cov.classList.add('hidden');
};
const getLayouts = () => POSTER_LAYOUTS[S.photoCount] || POSTER_LAYOUTS[3];
const getLayout = () => getLayouts()[S.layoutIndex] || getLayouts()[0];
const renderPoster = () => buildPoster({
  canvas: q('#cvs'),
  photos: S.photos,
  theme: POSTER_THEMES[S.themeIndex] || POSTER_THEMES[0],
  layout: getLayout(),
  eventName: S.eventName.trim() || 'Khoảnh khắc của tôi',
  studentName: S.studentName,
  footerText: S.studentName.trim() || formatToday(),
  mascotUrl,
  width: POSTER_WIDTH,
  height: POSTER_HEIGHT,
});
if (!PHOTO_COUNT_OPTIONS.includes(S.photoCount)) S.photoCount = 3;
S.layoutIndex = Math.max(0, Math.min(getLayouts().length - 1, S.layoutIndex));
function getPreviewSlots() {
  const layout = getLayout();
  const viewport = layout.reduce((box, slot) => ({
    left: Math.min(box.left, slot.x),
    top: Math.min(box.top, slot.y),
    right: Math.max(box.right, slot.x + slot.w),
    bottom: Math.max(box.bottom, slot.y + slot.h),
  }), { left: Infinity, top: Infinity, right: 0, bottom: 0 });
  const vw = viewport.right - viewport.left;
  const vh = viewport.bottom - viewport.top;

  return layout.map(slot => ({
    x: ((slot.x - viewport.left) / vw) * 100,
    y: ((slot.y - viewport.top) / vh) * 100,
    w: (slot.w / vw) * 100,
    h: (slot.h / vh) * 100,
    hero: !!slot.hero,
  }));
}

function syncThemePicker() {
  qa('.theme-chip[data-theme-index]').forEach(btn => {
    const index = Number(btn.dataset.themeIndex || 0);
    const active = index === S.themeIndex;
    const theme = POSTER_THEMES[index] || POSTER_THEMES[0];
    btn.style.setProperty('--chip-a', theme.photos.borderColor);
    btn.style.setProperty('--chip-b', theme.photos.cornerAccent.color);
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', String(active));
    btn.disabled = S.mode !== 'ready';
  });
}

function syncLayoutPicker() {
  const layoutId = String(S.layoutIndex + 1);
  const grid = q('#photo-grid');
  if (grid) {
    grid.dataset.layout = layoutId;
    grid.dataset.photoCount = String(S.photoCount);
    const layout = getLayout();
    const left = Math.min(...layout.map(slot => slot.x));
    const top = Math.min(...layout.map(slot => slot.y));
    const right = Math.max(...layout.map(slot => slot.x + slot.w));
    const bottom = Math.max(...layout.map(slot => slot.y + slot.h));
    grid.style.aspectRatio = `${right - left} / ${bottom - top}`;
    const slots = getPreviewSlots();
    const html = Array.from({ length: S.photoCount }, (_, i) => `<div class="pv-slot" id="pvs${i}"><img class="pv" id="pv${i}" alt="Ảnh ${i + 1} được chụp"/><span class="pv-badge">${i + 1}</span></div>`).join('');
    if (grid.innerHTML !== html) grid.innerHTML = html;
    slots.forEach((slot, i) => {
      const el = q(`#pvs${i}`);
      if (!el) return;
      el.style.left = `${slot.x}%`;
      el.style.top = `${slot.y}%`;
      el.style.width = `${slot.w}%`;
      el.style.height = `${slot.h}%`;
    });
  }
  const picker = q('.layout-picker');
  if (picker) picker.classList.remove('is-locked');
  qa('.layout-chip[data-layout-index]').forEach(btn => {
    const index = Number(btn.dataset.layoutIndex || 0);
    const active = index === S.layoutIndex;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', String(active));
    btn.disabled = S.mode !== 'ready';
  });
}

function syncPhotoCountPicker() {
  qa('.count-chip').forEach(btn => {
    const count = Number(btn.dataset.photoCount || 4);
    const active = count === S.photoCount;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', String(active));
    btn.disabled = S.mode !== 'ready';
  });
}

function syncIntervalPicker() {
  qa('.time-chip').forEach(btn => {
    const seconds = Number(btn.dataset.interval || 3);
    const active = seconds === S.interval;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', String(active));
    btn.disabled = S.mode !== 'ready';
  });
}

function syncReadyCountdown() {
  if (S.mode !== 'ready') return;
  q('#cov')?.classList.remove('hidden');
  q('#cnt-mascot')?.classList.remove('is-visible');
  const n = q('#cnt-n');
  if (n) n.textContent = String(S.interval);
}

function syncPosterPreview() {
  const preview = q('#poster-preview');
  if (!preview) return;

  const theme = POSTER_THEMES[S.themeIndex] || POSTER_THEMES[0];
  const today = formatToday();

  preview.dataset.themeIndex = String(theme.id);
  preview.style.setProperty('--preview-shell-bg', theme.bg.color);
  preview.style.setProperty('--preview-header-bg', theme.header.bg);
  preview.style.setProperty('--preview-footer-bg', theme.footer.bg);
  preview.style.setProperty('--preview-shell-border', theme.frame.outer);
  preview.style.setProperty('--preview-frame-inner', theme.frame.inner);
  preview.style.setProperty('--preview-shell-glow', theme.photos.slotShadow);
  preview.style.setProperty('--preview-shell-accent', theme.photos.borderColor);
  preview.style.setProperty('--preview-shell-surface', theme.photos.slotBg);
  preview.style.setProperty('--preview-shell-badge', theme.header.topBar.color);
  preview.style.setProperty('--preview-title', theme.title.color);
  preview.style.setProperty('--preview-subtitle', theme.subtitle.color);
  preview.style.setProperty('--preview-event', theme.event?.color || theme.title.color);
  preview.style.setProperty('--preview-meta', theme.meta?.color || theme.date.color);
  preview.style.setProperty('--preview-date', theme.date.color);
  preview.style.setProperty('--preview-footer-text', theme.footer.hashtag.color);
  preview.style.setProperty('--preview-footer-border', theme.footer.borderColor);
  preview.style.setProperty('--preview-slot-bg', theme.photos.slotBg);
  preview.style.setProperty('--preview-slot-border', theme.photos.borderColor);
  preview.style.setProperty('--preview-slot-accent', theme.photos.cornerAccent.color);
  preview.style.setProperty('--preview-badge-ink', theme.bg.color);
  if (q('#preview-event')) q('#preview-event').textContent = S.eventName.trim() || 'Khoảnh khắc của tôi';
  if (q('#preview-date')) q('#preview-date').textContent = today;
  if (q('#preview-place')) q('#preview-place').textContent = S.studentName;
  if (q('#preview-hashtag')) q('#preview-hashtag').textContent = S.studentName.trim() || today;
}

function setThemeIndex(nextIndex) {
  if (S.mode !== 'ready') return;
  const index = Math.max(0, Math.min(POSTER_THEMES.length - 1, Number(nextIndex) || 0));
  S.themeIndex = index;
  saveState('themeIndex', index);
  syncThemePicker();
  syncPosterPreview();
}

function setLayoutIndex(nextIndex) {
  if (S.mode !== 'ready') return;
  const index = Math.max(0, Math.min(getLayouts().length - 1, Number(nextIndex) || 0));
  S.layoutIndex = index;
  saveState('layoutIndex', index);
  syncLayoutPicker();
}

function setPhotoCount(nextCount) {
  if (S.mode !== 'ready') return;
  const count = Number(nextCount) || 3;
  S.photoCount = PHOTO_COUNT_OPTIONS.includes(count) ? count : 3;
  S.layoutIndex = Math.min(S.layoutIndex, getLayouts().length - 1);
  saveState('photoCount', S.photoCount);
  saveState('layoutIndex', S.layoutIndex);
  syncPhotoCountPicker();
  syncLayoutPicker();
}

function setIntervalSeconds(nextInterval) {
  if (S.mode !== 'ready') return;
  const seconds = Number(nextInterval) || 3;
  S.interval = INTERVAL_OPTIONS.includes(seconds) ? seconds : 3;
  saveState('interval', S.interval);
  syncIntervalPicker();
  syncReadyCountdown();
}

function syncStudentNameField() {
  const input = q('#student-name');
  if (!input) return;
  input.value = S.studentName;
  input.disabled = S.mode !== 'ready';
}

function syncEventNameField() {
  const input = q('#event-name');
  if (!input) return;
  input.value = S.eventName;
  input.disabled = S.mode !== 'ready';
}

function setStudentName(nextName) {
  if (S.mode !== 'ready') return;
  const name = String(nextName || '').replace(/\s+/g, ' ').slice(0, 32);
  S.studentName = name;
  saveState('studentName', name);
  syncStudentNameField();
  syncPosterPreview();
}

function setEventName(nextName) {
  if (S.mode !== 'ready') return;
  const name = String(nextName || '').replace(/\s+/g, ' ').slice(0, 44);
  S.eventName = name;
  saveState('eventName', name);
  syncEventNameField();
  syncPosterPreview();
}

// ── Mount HTML ────────────────────────────────────────────────────────────────
q('#app').innerHTML = `
<div class="app">
  <header class="hdr">
    <div class="hdr-brand">
      <img class="hdr-lion" src="${mascotUrl}" alt="" aria-hidden="true">
      <div class="hdr-text">
        <span class="hdr-name">Photobooth</span>
      </div>
    </div>
  </header>

  <div class="main">
    <!-- Camera -->
    <div class="cam-col">
      <div class="cam-box">
        <video id="cam" autoplay muted playsinline></video>
        <div class="frame-ov" id="fov"></div>

        <div class="cnt-ov" id="cov">
          <div class="cnt-num-wrap">
            <div class="cnt-n" id="cnt-n">${S.interval}</div>
            <img class="cnt-mascot" id="cnt-mascot" src="${mascotUrl}" alt="" aria-hidden="true">
          </div>
        </div>

        <div class="cam-err hidden" id="cerr">
          <span class="cam-err-icon">📷</span>
          <p>Không thể dùng camera.<br/>Kiểm tra quyền truy cập.</p>
          <button id="retry-cam" class="btn-outline" aria-label="Thử kết nối camera lại">Thử lại</button>
        </div>

      </div>
    </div>

    <!-- Controls -->
    <div class="ctrl-col">
      <div class="ctrl-grid" aria-label="Tùy chọn chụp">
        <div class="ctrl-col-group">
          <div class="count-picker" aria-label="Chọn số lượng ảnh">
            ${PHOTO_COUNT_OPTIONS.map(count => `
              <button
                class="count-chip"
                type="button"
                data-photo-count="${count}"
                aria-pressed="${count === S.photoCount}"
                aria-label="Chọn ${count} ảnh"
              >
                <span class="theme-chip-label">${count} ảnh</span>
              </button>
            `).join('')}
          </div>

          <div class="layout-picker" aria-label="Chọn bố cục poster">
            ${LAYOUT_OPTIONS.map((layout, index) => `
              <button
                class="layout-chip"
                type="button"
                data-layout-index="${index}"
                aria-pressed="${index === S.layoutIndex}"
                aria-label="Chọn ${layout.label}"
              >
                <span class="theme-chip-label">${layout.label}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="ctrl-col-group">
          <div class="theme-picker" aria-label="Chọn phong cách poster">
            ${THEME_OPTIONS.map((theme, index) => `
              <button
                class="theme-chip"
                type="button"
                data-theme-index="${index}"
                aria-pressed="${index === S.themeIndex}"
                aria-label="Chọn mẫu ${theme.label}"
              >
                <span class="theme-chip-dot" aria-hidden="true"></span>
                <span class="theme-chip-text">
                  <span class="theme-chip-label">${theme.label}</span>
                </span>
              </button>
            `).join('')}
          </div>

          <div class="time-picker" aria-label="Chọn thời gian đếm ngược">
            ${INTERVAL_OPTIONS.map(seconds => `
              <button
                class="time-chip"
                type="button"
                data-interval="${seconds}"
                aria-pressed="${seconds === S.interval}"
                aria-label="Chọn ${seconds} giây"
              >
                <span class="theme-chip-dot" aria-hidden="true"></span>
                <span class="theme-chip-label">${seconds} giây</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="name-grid">
        <div class="name-field">
          <input
            id="event-name"
            class="name-input"
            type="text"
            inputmode="text"
            maxlength="44"
            placeholder="Họ tên/Thông điệp"
            aria-label="Họ tên hoặc thông điệp để hiển thị trên poster"
          >
        </div>

        <div class="name-field">
          <input
            id="student-name"
            class="name-input"
            type="text"
            inputmode="text"
            maxlength="32"
            placeholder="Sự kiện/Địa điểm"
            aria-label="Sự kiện hoặc địa điểm để hiển thị trên poster"
          >
        </div>
      </div>

      <section class="poster-shell" id="poster-preview" aria-label="Poster preview">
        <div class="photo-grid" id="photo-grid" data-layout="${S.layoutIndex + 1}" data-photo-count="${S.photoCount}"></div>
      </section>

      <button class="shoot-btn" id="shoot-btn" aria-label="Chụp">
        <span class="s-text">Chụp</span>
      </button>
    </div>
  </div>
</div>

<!-- Result overlay -->
<div class="result-ov hidden" id="rov">
  <div class="result-card">
    <img class="poster-img" id="poster-img" alt="Poster được ghép lại"/>
    <div class="dl-info">
      <a id="dl-link" class="btn-primary" download="photobooth.jpg" aria-label="Tải ảnh về máy">
        <span class="btn-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img" focusable="false" aria-hidden="true">
            <path d="M12 3.5v9.2l3.2-3.2 1.8 1.8-6 6-6-6 1.8-1.8 3.2 3.2V3.5h2z"></path>
            <path d="M5 19.5h14v2H5z"></path>
          </svg>
        </span>
        <span>Tải ảnh</span>
      </a>
      <button id="print-btn" class="btn-primary" type="button" aria-label="In poster ra máy in">
        <span class="btn-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img" focusable="false" aria-hidden="true">
            <path d="M7 7V3.5h10V7H7z"></path>
            <path d="M7 17.5h10V21H7z"></path>
            <path d="M6 9h12a3 3 0 0 1 3 3v4h-3v-3H6v3H3v-4a3 3 0 0 1 3-3zm1.5 2.2h9v1.8h-9z"></path>
          </svg>
        </span>
        <span>In ảnh</span>
      </button>
    </div>
    <button id="retake-btn" class="btn-sec btn-full" aria-label="Chụp lại bộ ảnh mới">↩ Chụp lại</button>
  </div>
</div>


<canvas id="cvs" width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" style="display:none"></canvas>
`;

// ── Camera ────────────────────────────────────────────────────────────────────
async function startCam() {
  try {
    S.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', aspectRatio: 4 / 3, width: { ideal: 1920 }, height: { ideal: 1440 } },
      audio: false,
    });
    const cam = q('#cam');
    cam.srcObject = S.stream;
    await new Promise(res => cam.addEventListener('loadedmetadata', res, { once: true }));
    q('#cerr').classList.add('hidden');
  } catch {
    q('#cerr').classList.remove('hidden');
  }
}

// ── Shoot sequence ────────────────────────────────────────────────────────────
async function shoot() {
  if (S.mode !== 'ready') return;
  if (!S.stream) { await startCam(); await sleep(600); }
  const cam = q('#cam');
  if (!cam.srcObject || cam.videoWidth === 0) return;

  S.mode = 'shooting';
  showPosterPreview = true;
  q('#shoot-btn').disabled = true;
  syncThemePicker();
  syncLayoutPicker();
  syncPhotoCountPicker();
  syncIntervalPicker();
  syncEventNameField();
  syncStudentNameField();
  clearPhotoObjectUrls();
  S.photos = [];
  qa('.pv-slot').forEach(s => s.classList.remove('filled'));
  qa('.pv').forEach(p => { p.src = ''; });
  q('.ctrl-col').classList.remove('hide-preview');
  q('.ctrl-col').classList.add('shooting');
  q('#cov').classList.remove('hidden');

  for (let i = 0; i < S.photoCount; i++) {
    const startedAt = performance.now();
    let lastShown = S.interval + 1;
    while (true) {
      const elapsed = (performance.now() - startedAt) / 1000;
      const remaining = Math.max(0, S.interval - elapsed);
      const shown = Math.ceil(remaining);
      if (shown !== lastShown) {
        q('#cnt-n').textContent = String(shown);
        q('#cnt-n').dataset.tick = '1';
        await raf();
        delete q('#cnt-n').dataset.tick;
        lastShown = shown;
      }
      if (remaining <= 0) break;
      await sleep(Math.min(remaining * 1000, 32));
    }
    q('#cnt-n').textContent = '';
    q('#cnt-mascot').classList.add('is-visible');
    await sleep(180);
    q('#cnt-mascot').classList.remove('is-visible');

    S.photos.push(await capFrame(cam));
    if (navigator.vibrate) navigator.vibrate([50]);

    q(`#pv${i}`).src = S.photos[i];
    q(`#pvs${i}`).classList.add('filled');

    q(`#d${i}`)?.classList.add('done');
    if (i < S.photoCount - 1) await sleep(220);
  }

  await nextFrame();
  q('#cov').classList.add('is-processing');
  q('#cnt-n').textContent = 'Đang xử lý';
  q('#shoot-btn').disabled = false;
  syncThemePicker();
  syncLayoutPicker();
  syncIntervalPicker();
  await nextFrame();
  try {
    await renderPoster();
  } catch (err) {
    console.error('buildPoster failed:', err);
    q('#cov').classList.remove('is-processing');
    q('#cov').classList.add('hidden');
    alert('Không thể tạo poster, hãy chụp lại.');
    S.mode = 'ready';
    syncThemePicker();
    syncLayoutPicker();
    syncPhotoCountPicker();
    syncIntervalPicker();
    syncReadyCountdown();
    syncEventNameField();
    syncStudentNameField();
    return;
  }
  let uploadBlob;
  try {
    uploadBlob = await canvasToBlob(q('#cvs'), 0.94);
  } catch (err) {
    // ponytail: canvas taint (SVG/CORS) → degrade gracefully
    console.error('toDataURL failed:', err);
    q('#cov').classList.remove('is-processing');
    q('#cov').classList.add('hidden');
    alert('Không thể xuất ảnh, hãy chụp lại.');
    S.mode = 'ready';
    syncThemePicker();
    syncLayoutPicker();
    syncPhotoCountPicker();
    syncIntervalPicker();
    syncReadyCountdown();
    syncEventNameField();
    syncStudentNameField();
    return;
  }
  S.mode = 'done';
  syncEventNameField();
  syncStudentNameField();
  if (S.posterObjectUrl) URL.revokeObjectURL(S.posterObjectUrl);
  S.posterObjectUrl = URL.createObjectURL(uploadBlob);
  S.posterUrl = S.posterObjectUrl;
  await fadeOutProcessing();
  showResult();
  syncThemePicker();
  syncLayoutPicker();
  syncPhotoCountPicker();
  syncIntervalPicker();
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('toBlob failed')), 'image/jpeg', quality);
  });
}

async function capFrame(cam) {
  const vw = cam.videoWidth, vh = cam.videoHeight;
  const sz = Math.min(vw, vh);

  const raw = document.createElement('canvas');
  raw.width = sz; raw.height = sz;
  const rx = raw.getContext('2d');
  rx.imageSmoothingEnabled = true;
  rx.imageSmoothingQuality = 'high';
  rx.translate(sz, 0); rx.scale(-1, 1);
  rx.drawImage(cam, (vw - sz) / 2, (vh - sz) / 2, sz, sz, 0, 0, sz, sz);

  const blob = await canvasToBlob(raw, 0.92);
  const url = URL.createObjectURL(blob);
  S.photoObjectUrls.push(url);
  return url;
}

function clearPhotoObjectUrls() {
  S.photoObjectUrls.forEach(url => URL.revokeObjectURL(url));
  S.photoObjectUrls = [];
}

// ── Result screen ─────────────────────────────────────────────────────────────
function showResult() {
  q('#poster-img').src = S.posterUrl;
  q('#dl-link').href   = S.posterUrl;
  q('#rov').classList.remove('hidden');
  q('#rov').classList.remove('is-ready');
  requestAnimationFrame(() => q('#rov').classList.add('is-ready'));
}

async function uploadPoster(blob) {
  const TIMEOUT_MS = 8000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'image/jpeg' },
      body: blob,
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const { url } = await res.json();
    return url;
  } catch (err) {
    console.error('Upload error:', err.message);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function retake() {
  if (S.posterObjectUrl) URL.revokeObjectURL(S.posterObjectUrl);
  clearPhotoObjectUrls();
  S.mode = 'ready'; S.photos = []; S.posterUrl = null;
  S.posterObjectUrl = null;
  q('#rov').classList.add('hidden');
  q('#cov').classList.remove('is-processing');
  q('#shoot-btn').disabled = false;
  qa('.pv-slot').forEach(s => s.classList.remove('filled'));
  qa('.pv').forEach(p => { p.src = ''; });
  q('#cov').classList.remove('hidden');
  q('.ctrl-col').classList.remove('shooting');
  q('#rov').classList.remove('is-ready');
  showPosterPreview = !isMobile();
  if (!showPosterPreview) q('.ctrl-col').classList.add('hide-preview');
  syncThemePicker();
  syncPosterPreview();
  syncLayoutPicker();
  syncPhotoCountPicker();
  syncIntervalPicker();
  syncReadyCountdown();
  syncEventNameField();
  syncStudentNameField();
}

function printPoster() {
  if (!S.posterUrl) return;
  const printWindow = window.open('', '_blank', 'width=900,height=1200');
  if (!printWindow) return;
  printWindow.document.write(`<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>In ảnh Photobooth</title>
  <style>
    @page { margin: 0; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #fff; }
    img { width: 100%; max-width: 1080px; height: auto; display: block; }
  </style>
</head>
<body>
  <img src="${S.posterUrl}" alt="Photobooth poster" onload="window.focus(); window.print();">
</body>
</html>`);
  printWindow.document.close();
}

// ── Events ────────────────────────────────────────────────────────────────────
q('#shoot-btn').addEventListener('click', shoot);
q('#retry-cam').addEventListener('click', startCam);
q('#retake-btn').addEventListener('click', retake);
q('#print-btn').addEventListener('click', printPoster);
q('#event-name').value = S.eventName;
q('#event-name').addEventListener('input', e => setEventName(e.target.value));
q('#student-name').value = S.studentName;
q('#student-name').addEventListener('input', e => setStudentName(e.target.value));
qa('.theme-chip[data-theme-index]').forEach(btn => {
  btn.addEventListener('click', () => setThemeIndex(btn.dataset.themeIndex));
});
qa('.layout-chip[data-layout-index]').forEach(btn => {
  btn.addEventListener('click', () => setLayoutIndex(btn.dataset.layoutIndex));
});
qa('.count-chip[data-photo-count]').forEach(btn => {
  btn.addEventListener('click', () => setPhotoCount(btn.dataset.photoCount));
});
qa('.time-chip').forEach(btn => {
  btn.addEventListener('click', () => setIntervalSeconds(btn.dataset.interval));
});

// ── Mobile orientation ───────────────────────────────────────────────────────
window.addEventListener('orientationchange', () => {
  if (S.mode === 'ready') startCam();
});

// ── Init ──────────────────────────────────────────────────────────────────────
if (!showPosterPreview) q('.ctrl-col').classList.add('hide-preview');
syncThemePicker();
syncPosterPreview();
syncLayoutPicker();
syncPhotoCountPicker();
syncIntervalPicker();
syncReadyCountdown();
syncEventNameField();
syncStudentNameField();
startCam();
if (import.meta.env.DEV) window.__t = { S, buildPoster: renderPoster, showResult, setThemeIndex, setLayoutIndex, setPhotoCount, setIntervalSeconds, setEventName, setStudentName };
