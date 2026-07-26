(() => {
  const STORAGE_KEY = 'lyrics_bookmarks_v1';
  const DEFAULT_CATEGORIES = [
    { key: 'zh', label: '中文' },
    { key: 'en', label: '英文' },
    { key: 'cantonese', label: '粵語' },
    { key: 'kr', label: '韓語' },
    { key: 'bgm', label: 'BGM' },
    { key: 'kids', label: '兒歌' }
  ];
  const TAGS = ['所有', '英文', '慢歌', '中板', '中快', '快歌'];
  const state = { songs: [], bookmarks: loadBookmarks() };
  const page = location.pathname.split('/').pop() || 'index.html';

  init();

  async function init() {
    await loadSongs();
    if (page === 'index.html') renderCatalog();
    if (page === 'category.html') renderCategory();
    if (page === 'bookmark.html') renderBookmarks();
    bindCommonNav();
  }

  async function loadSongs() {
    try {
      const res = await fetch('./data/songs.json', { cache: 'no-store' });
      state.songs = await res.json();
    } catch {
      state.songs = [];
    }
  }

  function loadBookmarks() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  }

  function saveBookmarks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.bookmarks));
  }

  function bindCommonNav() {
    document.addEventListener('click', e => {
      const nav = e.target.closest('.bottom-nav .nav-item');
      if (!nav) return;
      const tab = nav.dataset.tab;
      if (tab === 'bookmark') location.href = './bookmark.html';
      if (tab === 'lyrics') location.href = './lyrics.html';
      if (tab === 'settings') location.href = './settings.html';
    });
  }

  function renderCatalog() {
    const container = document.getElementById('catalogListContainer');
    if (!container) return;
    container.innerHTML = DEFAULT_CATEGORIES.map(c =>
      `<div class="list-item catalog" data-cat="${c.key}" data-title="${c.label}"><span class="item-title">${c.label}</span></div>`
    ).join('');
    container.querySelectorAll('[data-cat]').forEach(el => {
      el.addEventListener('click', () => {
        location.href = `category.html?cat=${el.dataset.cat}&title=${encodeURIComponent(el.dataset.title)}`;
      });
    });
  }

  function getCategoryMeta() {
    const p = new URLSearchParams(location.search);
    return { cat: p.get('cat') || 'zh', title: p.get('title') || '中文' };
  }

  function renderCategory() {
    const { cat, title } = getCategoryMeta();
    const titleEl = document.getElementById('categoryTitle');
    if (titleEl) titleEl.textContent = title;

    const backBtn = document.getElementById('backBtn');
    if (backBtn) backBtn.onclick = () => location.href = './index.html';

    const tagScroll = document.getElementById('tagScroll');
    if (tagScroll) tagScroll.innerHTML = TAGS.map((t, i) =>
      `<button class="tag-item ${i === 0 ? 'active' : ''}">${t}</button>`
    ).join('');

    const list = document.getElementById('songListContainer');
    if (!list) return;

    const items = state.songs.filter(s => (s.category || 'zh') === cat);
    if (!items.length) {
      list.innerHTML = '<div class="list-empty">尚未新增歌曲</div>';
      return;
    }

    list.innerHTML = items.map((s, idx) => songHtml(s, idx + 1)).join('');
    list.querySelectorAll('[data-bookmark-id]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        toggleBookmark(btn.dataset.bookmarkId);
        renderCategory();
      });
    });
  }

  function renderBookmarks() {
    const container = document.getElementById('bookmarkListContainer');
    if (!container) return;

    const items = state.songs.filter(s => state.bookmarks.includes(songKey(s)));
    if (!items.length) {
      container.innerHTML = '<div class="list-empty">尚未加入任何書籤</div>';
      return;
    }

    container.innerHTML = items.map((s, idx) => songHtml(s, idx + 1)).join('');
    container.querySelectorAll('[data-bookmark-id]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        toggleBookmark(btn.dataset.bookmarkId);
        renderBookmarks();
      });
    });
  }

  function songHtml(song, num) {
    const key = songKey(song);
    const on = state.bookmarks.includes(key);
    const title = escapeHtml(song.title || '');
    const sub = song.sub ? `<span class="sub">${escapeHtml(song.sub)}</span>` : '';
    return `
      <div class="list-item" data-song="${key}">
        <span class="item-number">${num}.</span>
        <span class="item-title">${title}${sub}</span>
        <button class="bookmark-btn ${on ? 'active' : ''}" data-bookmark-id="${key}">${on ? '★' : '☆'}</button>
      </div>
    `;
  }

  function toggleBookmark(id) {
    const i = state.bookmarks.indexOf(id);
    if (i >= 0) state.bookmarks.splice(i, 1);
    else state.bookmarks.push(id);
    saveBookmarks();
  }

  function songKey(song) {
    return `${song.category || 'zh'}:${song.title || ''}:${song.sub || ''}`;
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
})();
