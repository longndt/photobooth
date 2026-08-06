export function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function drawCornerAccents(ctx, x, y, w, h, color, size = 28, lw = 3) {
  if (size <= 0 || lw <= 0) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = 'square';
  ctx.lineJoin = 'miter';
  ctx.beginPath(); ctx.moveTo(x + size, y); ctx.lineTo(x, y); ctx.lineTo(x, y + size); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + w - size, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + size); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y + h - size); ctx.lineTo(x, y + h); ctx.lineTo(x + size, y + h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + w - size, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - size); ctx.stroke();
  ctx.restore();
}

export function drawGlowOrb(ctx, x, y, radius, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawHeaderText(ctx, text, x, y, maxW, fontWeight, fontSize, minSize, family, color, align = 'left') {
  const display = String(text || '').trim();
  if (!display) return;

  ctx.save();
  let size = fontSize;
  do {
    ctx.font = `${fontWeight} ${size}px "${family}", Arial, sans-serif`;
    if (ctx.measureText(display).width <= maxW) break;
    size -= 2;
  } while (size >= minSize);

  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(display, x, y, maxW);
  ctx.restore();
}

export async function buildPoster({
  canvas,
  photos,
  theme,
  layout,
  width,
  height,
}) {
  await document.fonts.ready;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const scale = width / 1080;
  const sx = value => value * scale;
  const sy = value => value * scale;

  ctx.fillStyle = theme.bg.color;
  ctx.fillRect(0, 0, width, height);

  drawGlowOrb(ctx, sx(160), sy(140), sx(260), theme.frame.outer, 0.18);
  drawGlowOrb(ctx, sx(920), sy(220), sx(280), theme.photos.cornerAccent.color, 0.12);
  drawGlowOrb(ctx, sx(760), sy(1180), sx(320), theme.footer.glow || theme.footer.borderColor, 0.12);
  drawGlowOrb(ctx, sx(540), sy(760), sx(420), 'rgba(255,255,255,0.18)', 0.08);

  if (theme.bg.texture.type === 'grid') {
    ctx.fillStyle = theme.bg.texture.color;
    for (let x = 0; x < width; x += theme.bg.texture.step) ctx.fillRect(x, 0, 1, height);
    for (let y = 0; y < height; y += theme.bg.texture.step) ctx.fillRect(0, y, width, 1);
  } else if (theme.bg.texture.type === 'dots') {
    ctx.fillStyle = theme.bg.texture.color;
    const s = theme.bg.texture.step;
    for (let x = 0; x < width; x += s) for (let y = 0; y < height; y += s) ctx.fillRect(x, y, 2, 2);
  }

  layout.forEach(({ x, y, w, h, hero }) => {
    ctx.save();
    ctx.shadowColor = theme.photos.slotShadow;
    ctx.shadowBlur = hero ? sx(34) : sx(22);
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = theme.photos.slotBg;
    roundRect(ctx, sx(x - 8), sy(y - 8), sx(w + 16), sy(h + 16), sx(theme.photos.radius + 2));
    ctx.fill();
    ctx.restore();
  });

  layout.forEach(({ x, y, w, h }) => {
    ctx.fillStyle = theme.photos.slotBg;
    roundRect(ctx, sx(x), sy(y), sx(w), sy(h), sx(theme.photos.radius));
    ctx.fill();
  });

  await Promise.all(photos.map((p, i) => {
    const slot = layout[i];
    return drawPhoto(ctx, p, sx(slot.x + 8), sy(slot.y + 8), sx(slot.w - 16), sy(slot.h - 16), sx(theme.photos.radius - 4));
  }));

  layout.forEach(({ x, y, w, h, hero }, i) => {
    ctx.save();
    roundRect(ctx, sx(x + 8), sy(y + 8), sx(w - 16), sy(h - 16), sx(theme.photos.radius - 4));
    ctx.clip();
    const accent = i === 0 ? theme.frame.outer : theme.photos.cornerAccent.color;
    drawGlowOrb(ctx, sx(x + w * 0.18), sy(y + h * 0.18), sx(hero ? 160 : 120), accent, 0.08);
    drawGlowOrb(ctx, sx(x + w * 0.86), sy(y + h * 0.82), sx(hero ? 130 : 90), theme.footer.borderColor, 0.06);
    ctx.restore();
  });

  layout.forEach(({ x, y, w, h }) => {
    ctx.save();
    roundRect(ctx, sx(x + 8), sy(y + 8), sx(w - 16), sy(h - 16), sx(theme.photos.radius - 4));
    ctx.clip();
    ctx.fillStyle = 'rgba(0,31,20,0.09)';
    ctx.fillRect(sx(x + 8), sy(y + 8), sx(w - 16), sy(h - 16));
    ctx.restore();
  });

  layout.forEach(({ x, y, w, h, hero }) => {
    ctx.strokeStyle = theme.photos.borderColor;
    ctx.lineWidth = sx(hero ? theme.photos.borderWidth + 2 : theme.photos.borderWidth);
    roundRect(ctx, sx(x), sy(y), sx(w), sy(h), sx(theme.photos.radius));
    ctx.stroke();
    drawCornerAccents(ctx, sx(x), sy(y), sx(w), sy(h), theme.photos.cornerAccent.color, sx(theme.photos.cornerAccent.size), sx(theme.photos.cornerAccent.lw));
  });
}

function drawPhoto(ctx, url, x, y, w, h, radius = 0) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.max(w / img.width, h / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.save();
        if (radius > 0) roundRect(ctx, x, y, w, h, radius);
        else {
          ctx.beginPath();
          ctx.rect(x, y, w, h);
        }
        ctx.clip();
        ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
        ctx.restore();
        res();
      } catch (e) {
        rej(e);
      }
    };
    img.onerror = rej;
    img.src = url;
  });
}
