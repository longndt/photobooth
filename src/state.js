export function loadState(defaults) {
  return {
    ...defaults,
    eventName: localStorage.getItem('photobooth.eventName') || defaults.eventName || '',
    studentName: localStorage.getItem('photobooth.studentName') || defaults.studentName || '',
    interval: Number(localStorage.getItem('photobooth.interval') || defaults.interval || 3) || 3,
    themeIndex: Number(localStorage.getItem('photobooth.themeIndex') || defaults.themeIndex || 0) || 0,
    photoCount: Number(localStorage.getItem('photobooth.photoCount') || defaults.photoCount || 3) || 3,
    layoutIndex: Number(localStorage.getItem('photobooth.layoutIndex') || defaults.layoutIndex || 0) || 0,
  };
}

export function saveState(key, value) {
  localStorage.setItem(`photobooth.${key}`, String(value));
}
