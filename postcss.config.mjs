// Local PostCSS config — Mockmate uses plain CSS (no Tailwind/PostCSS plugins).
// This file prevents Vite from walking up the directory tree and picking up
// unrelated PostCSS configs from parent projects, which can cause build failures.
export default {
  plugins: [],
};
