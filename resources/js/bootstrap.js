// resources/js/bootstrap.js
import axios from 'axios';

window.axios = axios;

// --- Axios defaults ---
window.axios.defaults.withCredentials = true;                    // kirim cookie sesi
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
// pakai mekanisme XSRF bawaan axios (cookie -> header) agar selalu fresh
window.axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
window.axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

// --- Helper baca cookie (untuk fetch patch) ---
function readCookie(name) {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\]\\/+.^])/g, '\\$1') + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

// --- Patch global fetch agar:
// 1) kirim cookie (credentials:same-origin)
// 2) selalu set X-Requested-With
// 3) set header X-XSRF-TOKEN dari cookie 'XSRF-TOKEN' (selalu terbaru)
(() => {
  if (!('fetch' in window)) return;
  const originalFetch = window.fetch.bind(window);

  window.fetch = (input, init = {}) => {
    const headers = new Headers(init.headers || {});
    if (!headers.has('X-Requested-With')) headers.set('X-Requested-With', 'XMLHttpRequest');

    const xsrf = readCookie('XSRF-TOKEN');
    if (xsrf && !headers.has('X-XSRF-TOKEN')) headers.set('X-XSRF-TOKEN', xsrf);

    return originalFetch(input, {
      credentials: 'same-origin',
      ...init,
      headers,
    });
  };
})();
