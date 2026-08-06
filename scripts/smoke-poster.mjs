import puppeteer from 'puppeteer';
import { POSTER_THEMES } from '../src/concepts.js';
import { POSTER_LAYOUTS } from '../src/poster/config.js';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5173';

async function main() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => {
    pageErrors.push(err.message);
  });

  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__t?.buildPoster);

  const themeChipCount = await page.$$eval('.theme-chip', nodes => nodes.length);
  if (themeChipCount !== 2) {
    throw new Error(`Expected 2 theme chips, found ${themeChipCount}`);
  }
  const themeLabels = await page.$$eval('.theme-chip .theme-chip-label', nodes => nodes.map(node => node.textContent.trim()));
  if (themeLabels.join('|') !== 'mẫu A|mẫu B') {
    throw new Error(`Unexpected theme labels: ${themeLabels.join('|')}`);
  }
  const themeCount = await page.$$eval('.theme-chip', nodes => nodes.length);
  if (themeCount !== 2) {
    throw new Error(`Expected 2 theme chips, found ${themeCount}`);
  }

  await page.click('.theme-chip[data-theme-index="1"]');
  await page.waitForFunction(() => window.__t?.S?.themeIndex === 1);
  const activeTheme = await page.$eval('.theme-chip.is-active .theme-chip-label', el => el.textContent.trim());
  if (activeTheme !== 'mẫu B') {
    throw new Error(`Expected mẫu B active, got ${activeTheme}`);
  }
  const theme2 = POSTER_THEMES[1];
  const previewAccent = await page.$eval('#poster-preview', el => getComputedStyle(el).getPropertyValue('--preview-shell-accent').trim());
  if (previewAccent !== theme2.photos.borderColor) {
    throw new Error(`Expected preview accent to follow theme 2, got ${previewAccent}`);
  }
  const previewText = await page.$eval('#poster-preview', el => el.textContent.replace(/\s+/g, ' ').trim());
  if (previewText !== '123') {
    throw new Error(`Expected preview to contain only slot badges, got ${previewText}`);
  }
  const previewTheme = await page.$eval('#poster-preview', el => {
    const styles = getComputedStyle(el);
    return {
      surface: styles.getPropertyValue('--preview-slot-bg').trim(),
      border: styles.getPropertyValue('--preview-slot-border').trim(),
      accent: styles.getPropertyValue('--preview-slot-accent').trim(),
      frame: styles.getPropertyValue('--preview-shell-border').trim(),
      event: styles.getPropertyValue('--preview-event').trim(),
    };
  });
  if (
    previewTheme.surface !== theme2.photos.slotBg ||
    previewTheme.border !== theme2.photos.borderColor ||
    previewTheme.accent !== theme2.photos.cornerAccent.color ||
    previewTheme.frame !== theme2.frame.outer ||
    previewTheme.event !== theme2.event.color
  ) {
    throw new Error(`Preview theme colors do not match poster theme: ${JSON.stringify(previewTheme)}`);
  }
  const heroBorder = await page.$eval('#pvs0', el => getComputedStyle(el).borderTopColor);
  if (heroBorder !== 'rgb(124, 203, 185)') {
    throw new Error(`Preview hero slot border did not apply selected theme immediately: ${heroBorder}`);
  }

  const layoutCount = await page.$$eval('.layout-chip', nodes => nodes.length);
  if (layoutCount !== 2) {
    throw new Error(`Expected 2 layout chips, found ${layoutCount}`);
  }
  await page.click('.count-chip[data-photo-count="3"]');
  await page.waitForFunction(() => window.__t?.S?.photoCount === 3);
  const lockedLayoutState = await page.$eval('.layout-picker', el => ({
    locked: el.classList.contains('is-locked'),
    opacity: getComputedStyle(el).opacity,
  }));
  if (lockedLayoutState.locked || Number(lockedLayoutState.opacity) < 0.9) {
    throw new Error(`Layout picker should stay available for 3 ảnh: ${JSON.stringify(lockedLayoutState)}`);
  }
  const blockedLayoutIndex = await page.evaluate(() => {
    window.__t.setLayoutIndex(1);
    return window.__t.S.layoutIndex;
  });
  if (blockedLayoutIndex !== 1) {
    throw new Error(`Layout index should change on 3 ảnh, got ${blockedLayoutIndex}`);
  }
  const threePhotoLayout = await page.evaluate(() => {
    const grid = document.querySelector('#photo-grid');
    const slots = [...document.querySelectorAll('#photo-grid .pv-slot')].map(el => {
      const r = el.getBoundingClientRect();
      const g = grid.getBoundingClientRect();
      return { x: r.x - g.x, y: r.y - g.y, w: r.width, h: r.height };
    });
    return { layout: grid.dataset.layout, slots };
  });
  if (threePhotoLayout.slots.length !== 3) {
    throw new Error(`Expected 3 preview slots for 3 ảnh, got ${threePhotoLayout.slots.length}`);
  }
  await page.click('.count-chip[data-photo-count="4"]');
  await page.waitForFunction(() => window.__t?.S?.photoCount === 4);
  const fourPhotoSlots = await page.$$eval('#photo-grid .pv-slot', nodes => nodes.length);
  if (fourPhotoSlots !== 4) {
    throw new Error(`Expected 4 preview slots, found ${fourPhotoSlots}`);
  }
  await page.click('.count-chip[data-photo-count="3"]');
  await page.waitForFunction(() => window.__t?.S?.photoCount === 3);
  await page.click('.layout-chip[data-layout-index="1"]');
  await page.waitForFunction(() => window.__t?.S?.layoutIndex === 1);
  const activeLayout = await page.$eval('.layout-chip.is-active .theme-chip-label', el => el.textContent.trim());
  if (activeLayout !== 'khung B') {
    throw new Error(`Expected khung B active, got ${activeLayout}`);
  }
  const previewLayout = await page.$eval('#photo-grid', el => el.dataset.layout);
  if (previewLayout !== '2') {
    throw new Error(`Expected preview layout 2, got ${previewLayout}`);
  }
  const photoCountLabels = await page.$$eval('.count-chip .theme-chip-label', nodes => nodes.map(node => node.textContent.trim()));
  if (photoCountLabels.join('|') !== '3 ảnh|4 ảnh') {
    throw new Error(`Unexpected photo count labels: ${photoCountLabels.join('|')}`);
  }
  const timerLabels = await page.$$eval('.time-chip .theme-chip-label', nodes => nodes.map(node => node.textContent.trim()));
  if (timerLabels.join('|') !== '3 giây|5 giây') {
    throw new Error(`Unexpected timer labels: ${timerLabels.join('|')}`);
  }
  const countdownMascot = await page.$eval('#cnt-mascot', img => ({
    src: img.getAttribute('src') || '',
    hidden: img.classList.contains('is-visible'),
  }));
  if (!countdownMascot.src.includes('mascot')) {
    throw new Error(`Countdown mascot is not wired to the mascot asset: ${countdownMascot.src}`);
  }
  if (countdownMascot.hidden) {
    throw new Error('Countdown mascot should be hidden before shooting starts');
  }
  await page.click('.time-chip[data-interval="5"]');
  await page.waitForFunction(() => window.__t?.S?.interval === 5);
  const activeChipStyles = await page.$$eval(
    '.theme-chip.is-active, .layout-chip.is-active, .count-chip.is-active, .time-chip.is-active',
    nodes => nodes.map(node => getComputedStyle(node).backgroundImage)
  );
  if (new Set(activeChipStyles).size !== 4) {
    throw new Error(`Active chip rows should use distinct backgrounds: ${activeChipStyles.join(' | ')}`);
  }
  const layoutRects = await page.evaluate(() => {
    const grid = document.querySelector('#photo-grid').getBoundingClientRect();
    const slots = [...document.querySelectorAll('#photo-grid .pv-slot')].map(el => {
      const r = el.getBoundingClientRect();
      return { x: r.x - grid.x, y: r.y - grid.y, w: r.width, h: r.height };
    });
    return { grid: { width: grid.width, height: grid.height }, slots };
  });
  if (layoutRects.slots.length !== 3) {
    throw new Error(`Expected 3 preview slots for default 3 ảnh, got ${layoutRects.slots.length}`);
  }
  const close = (actual, expected) => Math.abs(actual - expected) < 0.12;
  if (!(layoutRects.slots[0].w > layoutRects.slots[1].w && layoutRects.slots[1].w > 0)) {
    throw new Error(`Preview slot widths are wrong: ${JSON.stringify(layoutRects)}`);
  }
  if (!(layoutRects.slots[0].h > 0 && layoutRects.slots[1].h > 0)) {
    throw new Error(`Preview slot heights are wrong: ${JSON.stringify(layoutRects)}`);
  }
  const activePosterLayout = POSTER_LAYOUTS[3][1];
  const photoArea = activePosterLayout.reduce((box, slot) => ({
    left: Math.min(box.left, slot.x),
    top: Math.min(box.top, slot.y),
    right: Math.max(box.right, slot.x + slot.w),
    bottom: Math.max(box.bottom, slot.y + slot.h),
  }), { left: Infinity, top: Infinity, right: 0, bottom: 0 });
  const previewRatio = layoutRects.grid.width / layoutRects.grid.height;
  const renderRatio = (photoArea.right - photoArea.left) / (photoArea.bottom - photoArea.top);
  if (Math.abs(previewRatio - renderRatio) > 0.02) {
    throw new Error(`Preview photo area ratio drifted from poster layout: ${previewRatio.toFixed(4)} vs ${renderRatio.toFixed(4)}`);
  }
  const shootVisible = await page.$eval('#shoot-btn', btn => {
    const r = btn.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= window.innerHeight;
  });
  if (!shootVisible) {
    throw new Error('Shoot button is not fully visible');
  }
  const shootDisabled = await page.$eval('#shoot-btn', btn => ({
    disabled: btn.disabled,
    blur: getComputedStyle(btn).filter,
  }));
  if (shootDisabled.disabled || shootDisabled.blur !== 'none') {
    throw new Error(`Shoot button should be enabled before shooting: ${JSON.stringify(shootDisabled)}`);
  }
  const shootOffset = await page.$eval('#shoot-btn', btn => {
    const parent = btn.parentElement;
    const btnRect = btn.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    return btnRect.top - parentRect.top;
  });
  if (shootOffset < 12) {
    throw new Error(`Shoot button did not move down enough: ${shootOffset.toFixed(1)}px`);
  }

  const placeholders = await page.$$eval('.name-input', nodes => nodes.map(node => node.placeholder));
  if (placeholders.join('|') !== 'Họ tên/Thông điệp|Sự kiện/Địa điểm') {
    throw new Error(`Unexpected input placeholders: ${placeholders.join('|')}`);
  }

  await page.evaluate(() => window.__t?.setEventName?.('Open Day 2026'));
  await page.waitForFunction(() => window.__t?.S?.eventName === 'Open Day 2026');
  await page.evaluate(() => window.__t?.setStudentName?.('Nguyen '));
  await page.waitForFunction(() => window.__t?.S?.studentName === 'Nguyen ');
  await page.evaluate(() => window.__t?.setStudentName?.('Nguyen Van A'));
  await page.waitForFunction(() => window.__t?.S?.studentName === 'Nguyen Van A');
  await page.evaluate(() => window.__t?.setStudentName?.(''));
  await page.waitForFunction(() => window.__t?.S?.studentName === '');

  await page.evaluate(() => {
    const makeShot = index => {
      const canvas = document.createElement('canvas');
      canvas.width = 1800;
      canvas.height = 1800;
      const ctx = canvas.getContext('2d');
      const bg = ctx.createLinearGradient(0, 0, 1800, 1800);
      const top = ['#eef0ed', '#e0e8e1', '#e9eee9', '#d6e0db', '#dde8e4'][index];
      const bottom = ['#17241d', '#21372b', '#24352b', '#1b2d23', '#20362d'][index];
      bg.addColorStop(0, top);
      bg.addColorStop(1, bottom);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 1800, 1800);
      ctx.fillStyle = '#252525';
      ctx.beginPath();
      ctx.arc(900, 620, 184, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.fillRect(608, 820, 584, 680);
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 108px "Be Vietnam Pro", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`SHOT ${index + 1}`, 900, 1200);
      return canvas.toDataURL('image/jpeg', 0.95);
    };

    window.__t.setPhotoCount(4);
    window.__t.S.photos = [0, 1, 2, 3].map(makeShot);
  });
  await page.evaluate(async () => {
    await window.__t.buildPoster();
  });

  const metrics = await page.$eval('#cvs', canvas => ({
    width: canvas.width,
    height: canvas.height,
    pngLength: canvas.toDataURL('image/png').length,
  }));
  if (metrics.width !== 1080 || metrics.height !== 1350) {
    throw new Error(`Unexpected canvas size ${metrics.width}x${metrics.height}`);
  }
  if (metrics.pngLength < 20000) {
    throw new Error(`Poster PNG too small (${metrics.pngLength})`);
  }

  for (let themeIndex = 0; themeIndex < POSTER_THEMES.length; themeIndex += 1) {
    await page.evaluate(index => window.__t?.setThemeIndex?.(index), themeIndex);
    await page.waitForFunction(index => window.__t?.S?.themeIndex === index, {}, themeIndex);
    const previewThemeId = await page.$eval('#poster-preview', el => el.dataset.themeIndex);
    if (previewThemeId !== String(themeIndex + 1)) {
      throw new Error(`Preview theme id did not track theme ${themeIndex + 1}: got ${previewThemeId}`);
    }
    const expectedTheme = POSTER_THEMES[themeIndex];
    const previewVars = await page.$eval('#poster-preview', el => {
      const styles = getComputedStyle(el);
      return {
        header: styles.getPropertyValue('--preview-header-bg').trim(),
        footer: styles.getPropertyValue('--preview-footer-bg').trim(),
        inner: styles.getPropertyValue('--preview-frame-inner').trim(),
        surface: styles.getPropertyValue('--preview-slot-bg').trim(),
        border: styles.getPropertyValue('--preview-slot-border').trim(),
        accent: styles.getPropertyValue('--preview-slot-accent').trim(),
      };
    });
    if (
      previewVars.header !== expectedTheme.header.bg ||
      previewVars.footer !== expectedTheme.footer.bg ||
      previewVars.inner !== expectedTheme.frame.inner ||
      previewVars.surface !== expectedTheme.photos.slotBg ||
      previewVars.border !== expectedTheme.photos.borderColor ||
      previewVars.accent !== expectedTheme.photos.cornerAccent.color
    ) {
      throw new Error(`Preview theme variables do not match theme ${themeIndex + 1}: ${JSON.stringify(previewVars)}`);
    }
    await page.evaluate(async () => {
      await window.__t.buildPoster();
    });
    const sloganRange = await page.$eval('#cvs', canvas => {
      const ctx = canvas.getContext('2d');
      const { data } = ctx.getImageData(160, 96, 320, 42);
      let min = 255;
      let max = 0;
      for (let i = 0; i < data.length; i += 4) {
        const luminance = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        min = Math.min(min, luminance);
        max = Math.max(max, luminance);
      }
      return max - min;
    });
    if (sloganRange < 30) {
      throw new Error(`Header slogan contrast is too low for theme ${themeIndex + 1}: ${sloganRange.toFixed(1)}`);
    }
  }

  await page.evaluate(async () => {
    window.__t.setThemeIndex(0);
    await window.__t.buildPoster();
  });
  const resultState = await page.evaluate(() => {
    window.__t.S.posterUrl = document.querySelector('#cvs').toDataURL('image/jpeg', 0.97);
    window.__t.showResult();
    return {
      hidden: document.querySelector('#rov').classList.contains('hidden'),
    };
  });
  if (resultState.hidden) {
    throw new Error('Result screen did not open');
  }

  if (consoleErrors.length || pageErrors.length) {
    throw new Error(`Browser errors: ${[...consoleErrors, ...pageErrors].join(' | ')}`);
  }

  await browser.close();
}

main().catch(async err => {
  console.error(err);
  process.exitCode = 1;
});
