// Poster themes: token data only; renderer lives in src/poster/render.js.

export const POSTER_THEMES = [
  {
    id: 1,
    name: 'màu 1',
    bg: {
      color: '#F8F3E6',
      texture: { type: 'grid', color: 'rgba(10,147,150,0.07)', step: 36 },
    },
    header: {
      bg: '#F8F3E6',
      topBar: { color: '#D6A72C', height: 7 },
      bottomBar: { colors: ['rgba(10,147,150,0.10)', 'rgba(10,147,150,0.32)'], height: 2 },
    },
    title: { color: '#0A5B66' },
    subtitle: { color: '#B85C19' },
    event: { color: '#C24E2C' },
    text: {
      school: 'PHOTOBOOTH',
      subtitle: 'Smile & Capture',
      footer: 'Happy moments',
    },
    meta: { color: '#375B63' },
    date: { color: '#7A4E1C' },
    photos: {
      slotShadow: 'rgba(10,147,150,0.18)',
      slotBg: '#FFFDF6',
      borderColor: '#D6A72C',
      borderWidth: 3,
      radius: 10,
      cornerAccent: { color: '#0A9396', size: 22, lw: 2 },
    },
    footer: {
      bg: '#082733',
      borderColor: '#86C8B7',
      glow: 'rgba(10,147,150,0.22)',
      hashtag: { text: 'Happy moments', color: '#0A5B66' },
      script: { family: '"Cormorant Garamond", serif', color: '#B85C19', italic: true },
    },
    frame: { outer: 'transparent', outerW: 0, inner: '#D6A72C', innerW: 2 },
  },
  {
    id: 2,
    name: 'màu 2',
    bg: {
      color: '#F3FBF8',
      texture: { type: 'dots', color: 'rgba(10,147,150,0.08)', step: 42 },
    },
    header: {
      bg: '#F3FBF8',
      topBar: { color: '#0A9396', height: 7 },
      bottomBar: { colors: ['rgba(10,147,150,0.08)', 'rgba(255,203,47,0.22)'], height: 2 },
    },
    title: { color: '#0A5B66' },
    subtitle: { color: '#C7751A' },
    event: { color: '#9E4A2C' },
    text: {
      school: 'PHOTOBOOTH',
      subtitle: 'Smile & Capture',
      footer: 'Happy moments',
    },
    meta: { color: '#0A5B66' },
    date: { color: '#4E6A6E' },
    photos: {
      slotShadow: 'rgba(10,91,102,0.14)',
      slotBg: '#FFFFFF',
      borderColor: '#7CCBB9',
      borderWidth: 3,
      radius: 18,
      cornerAccent: { color: '#D28A2E', size: 30, lw: 3 },
    },
    footer: {
      bg: '#050505',
      borderColor: '#F5C542',
      glow: 'rgba(124,203,185,0.18)',
      hashtag: { text: 'Happy moments', color: '#0A5B66' },
      script: { family: '"Cormorant Garamond", serif', color: '#C7751A', italic: true },
    },
    frame: { outer: 'transparent', outerW: 0, inner: '#D28A2E', innerW: 2 },
  },
];
