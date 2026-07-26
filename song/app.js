(() => {
  const STORAGE_KEY = 'lyrics_bookmarks_v1';

  const CATEGORIES = [
    { key: 'zh', label: '中文' },
    { key: 'en', label: '英文' },
    { key: 'cantonese', label: '粵語' },
    { key: 'kr', label: '韓語' },
    { key: 'bgm', label: 'BGM' },
    { key: 'kids', label: '兒歌' }
  ];

  const SONG_GROUPS = [
    { id: 'zh', title: '中文', range: '1600 - 1699' },
    { id: 'en', title: '英文', range: '1600 - 1699' },
    { id: 'cantonese', title: '粵語', range: '1600 - 1699' },
    { id: 'kr', title: '韓語', range: '1600 - 1699' },
    { id: 'bgm', title: 'BGM', range: '1600 - 1699' },
    { id: 'kids', title: '兒歌', range: '1600 - 1699' }
  ];

  const state = {
    data: [],
    bookmarks: loadBookmarks(),
    search: '',
    activeCategory: 'zh'
  };

  const els = {
    catalogListContainer: document.getElementById('catalogListContainer'),
    catalogSearch: document.getElementById('catalogSearch'),
    searchClear: document.getElementById('searchClear'),
    catalogListScroll: document.getElementById('catalogListScroll'),
    toast: document.getElementById('toast'),
    viewCatalog: document.getElementById('viewCatalog'),
    catalogBack: document.getElementById('catalogBack')
  };

  init();

  async function init() {
    await loadSongs();
    if (els.catalogListContainer) renderCatalog();
    if (document.getElementById('bookmarkListContainer')) renderBookmarks();
    bindEvents();
    highlightBottomNav();
  }

  async function loadSongs() {
    try {
      const res = await fetch('./data/songs.json', { cache: 'no-store' });
      state.data = await res.json();
    } catch {
      state.data = [];
    }
  }

  function loadBookmarks() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function saveBookmarks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.bookmarks));
  }

  function bindEvents() {
    if (els.catalogSearch) {
      els.catalogSearch.addEventListener('input', e => {
        state.search = e.target.value.trim();
        renderCatalog();
        els.searchClear?.classList.toggle('visible', state.search.length > 0);
      });
    }

    if (els.searchClear) {
      els.searchClear.addEventListener('click', () => {
        state.search = '';
        els.catalogSearch.value = '';
        els.searchClear.classList.remove('visible');
        renderCatalog();
      });
    }

    document.addEventListener('click', e => {
      const catBtn = e.target.closest('[data-category]');
      if (catBtn) {
        state.activeCategory = catBtn.dataset.category;
        renderCatalog();
      }

      const bookmarkBtn = e.target.closest('[data-bookmark-id]');
      if (bookmarkBtn) {
        toggleBookmark(bookmarkBtn.dataset.bookmarkId);
      }

      const nav = e.target.closest('.bottom-nav .nav-item');
      if (nav) handleNav(nav.dataset.tab);
    });
  }

  function renderCatalog() {
    if (!els.catalogListContainer) return;

    const groups = SONG_GROUPS.filter(g => {
      const txt = `${g.title} ${g.range}`.toLowerCase();
      return !state.search || txt.includes(state.search.toLowerCase());
    });

    if (!groups.length) {
      els.catalogListContainer.innerHTML = `<div class="list-empty">沒有符合的目錄</div>`;
      return;
    }

    els.catalogListContainer.innerHTML = groups.map(g => `
      <div class="list-item catalog" data-category="${g.id}">
        <span class="item-title">${g.title}</span>
      </div>
    `).join('');
  }

  function renderBookmarks() {
    const container = document.getElementById('bookmarkListContainer');
    if (!container) return;

    const items = state.data.filter(s => state.bookmarks.includes(songKey(s)));
    if (!items.length) {
      container.innerHTML = `<div class="list-empty">尚未加入任何書籤</div>`;
      return;
    }

    container.innerHTML = items.map(songCardHtml).join('');
  }

  function songCardHtml(song) {
    const bookmarked = state.bookmarks.includes(songKey(song));
    return `
      <div class="list-item">
        <span class="item-number">${song.number}.</span>
        <span class="item-title">
          ${escapeHtml(song.title)}
          ${song.sub ? `<span class="sub">${escapeHtml(song.sub)}</span>` : ''}
        </span>
        <button class="bookmark-btn ${bookmarked ? 'active' : ''}" data-bookmark-id="${songKey(song)}" aria-label="書籤">
          ${bookmarked ? '★' : '☆'}
        </button>
      </div>
    `;
  }

  function toggleBookmark(id) {
    const idx = state.bookmarks.indexOf(id);
    if (idx >= 0) {
      state.bookmarks.splice(idx, 1);
      showToast('已移除書籤');
    } else {
      state.bookmarks.push(id);
      showToast('已加入書籤');
    }
    saveBookmarks();
    renderBookmarks();
  }

  function handleNav(tab) {
    if (tab === 'bookmark') location.href = './bookmark.html';
    if (tab === 'lyrics') location.href = './lyrics.html';
    if (tab === 'settings') location.href = './settings.html';
  }

  function highlightBottomNav() {
    document.querySelectorAll('.bottom-nav .nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === 'catalog');
    });
  }

  function showToast(msg) {
    if (!els.toast) return;
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => els.toast.classList.remove('show'), 1600);
  }

  function songKey(song) {
    return `${song.category || 'zh'}:${song.number}:${song.title}`;
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
  songs.forEach((song, index) => {
  const number = index + 1;
});

})();
