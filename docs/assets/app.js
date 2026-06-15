/**
 * CAIR Coding Guide — Application
 * Loads chapter content from JSON and renders it dynamically.
 */

let guideData = null;
let currentChapterId = null;

const el = {
  loading:           document.getElementById('loading'),
  article:           document.getElementById('article'),
  navMenu:           document.getElementById('navMenu'),
  tocMenu:           document.getElementById('tocMenu'),
  searchInput:       document.getElementById('searchInput'),
  sidebar:           document.getElementById('sidebar'),
  mobileMenuToggle:  document.getElementById('mobileMenuToggle'),
  themeToggle:       document.getElementById('themeToggle'),
  lastUpdated:       document.getElementById('lastUpdated'),
};

async function init() {
  try {
    initTheme();
    await loadGuideData();
    renderNavigation();
    setupEventListeners();
    const hash = window.location.hash.slice(1) || 'home';
    loadChapter(hash);
    if (el.lastUpdated) el.lastUpdated.textContent = guideData.lastUpdated;
  } catch (err) {
    console.error('Failed to initialize app:', err);
    showError('Failed to load the coding guide. Please refresh the page.');
  }
}

function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

async function loadGuideData() {
  const res = await fetch('data/codeguide.json');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  guideData = await res.json();
}

function renderNavigation(chapters) {
  const list = (chapters || guideData.chapters)
    .slice()
    .sort((a, b) => a.order - b.order)
    .map(ch => `
      <li class="nav-item">
        <a href="#${ch.id}" class="nav-link" data-chapter="${ch.id}">${ch.title}</a>
      </li>`)
    .join('');
  el.navMenu.innerHTML = list;
}

function loadChapter(id) {
  if (!guideData) return;
  const chapter = guideData.chapters.find(ch => ch.id === id);
  if (!chapter) { showError('Chapter not found.'); return; }

  currentChapterId = id;
  history.pushState(null, '', `#${id}`);

  renderChapter(chapter);
  updateActiveNav(id);
  generateTOC();

  el.loading.style.display = 'none';
  el.article.classList.add('visible');
  window.scrollTo(0, 0);
  el.sidebar.classList.remove('open');
}

function renderChapter(chapter) {
  marked.setOptions({
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try { return hljs.highlight(code, { language: lang }).value; } catch (_) {}
      }
      return hljs.highlightAuto(code).value;
    },
    breaks: true,
    gfm: true,
  });

  el.article.innerHTML = marked.parse(chapter.content);
  el.article.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
}

function updateActiveNav(id) {
  el.navMenu.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
  const active = el.navMenu.querySelector(`[data-chapter="${id}"]`);
  if (active) {
    active.classList.add('active');
    active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

function generateTOC() {
  const headings = el.article.querySelectorAll('h2, h3');
  if (!headings.length) {
    el.tocMenu.innerHTML = '';
    return;
  }

  el.tocMenu.innerHTML = Array.from(headings).map((h, i) => {
    const id = `h-${i}`;
    h.id = id;
    return `<li><a href="#${id}" class="toc-link level-${h.tagName[1]}" data-heading="${id}">${h.textContent}</a></li>`;
  }).join('');

  el.tocMenu.querySelectorAll('.toc-link').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const target = document.getElementById(a.dataset.heading);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        updateActiveTOC(a.dataset.heading);
      }
    });
  });

  setupScrollSpy();
}

function updateActiveTOC(id) {
  el.tocMenu.querySelectorAll('.toc-link').forEach(a => a.classList.remove('active'));
  const active = el.tocMenu.querySelector(`[data-heading="${id}"]`);
  if (active) active.classList.add('active');
}

function setupScrollSpy() {
  const headings = el.article.querySelectorAll('h2, h3');
  const observer = new IntersectionObserver(
    entries => { entries.forEach(e => { if (e.isIntersecting) updateActiveTOC(e.target.id); }); },
    { rootMargin: '-80px 0px -70% 0px' }
  );
  headings.forEach(h => observer.observe(h));
}

function handleSearch(query) {
  if (!query.trim()) { renderNavigation(); return; }
  const q = query.toLowerCase();
  const matched = guideData.chapters.filter(
    ch => ch.title.toLowerCase().includes(q) || ch.content.toLowerCase().includes(q)
  );
  if (!matched.length) {
    el.navMenu.innerHTML = '<li style="padding:0.75rem 1.25rem;font-size:0.875rem;color:var(--text-muted)">No results</li>';
    return;
  }
  renderNavigation(matched);
}

function setupEventListeners() {
  el.themeToggle.addEventListener('click', toggleTheme);

  el.navMenu.addEventListener('click', e => {
    const link = e.target.closest('.nav-link');
    if (link) { e.preventDefault(); loadChapter(link.dataset.chapter); }
  });

  let searchTimer;
  el.searchInput.addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => handleSearch(e.target.value), 280);
  });

  window.addEventListener('hashchange', () => {
    loadChapter(window.location.hash.slice(1) || 'home');
  });

  el.mobileMenuToggle.addEventListener('click', () => el.sidebar.classList.toggle('open'));

  document.addEventListener('click', e => {
    if (window.innerWidth <= 768
      && !el.sidebar.contains(e.target)
      && !el.mobileMenuToggle.contains(e.target)
      && el.sidebar.classList.contains('open')) {
      el.sidebar.classList.remove('open');
    }
  });
}

function showError(msg) {
  el.article.innerHTML = `
    <div style="padding:3rem;text-align:center">
      <h2 style="color:#ef4444;margin-bottom:1rem">Something went wrong</h2>
      <p style="color:var(--text-muted)">${msg}</p>
    </div>`;
  el.loading.style.display = 'none';
  el.article.classList.add('visible');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
