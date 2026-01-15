/**
 * CAIR Coding Guide - Main Application
 * Loads content from JSON and renders it dynamically
 */

// Global state
let guideData = null;
let currentChapter = null;

// DOM Elements
const elements = {
  loading: document.getElementById ('loading'),
  article: document.getElementById ('article'),
  navMenu: document.getElementById ('navMenu'),
  tocMenu: document.getElementById ('tocMenu'),
  searchInput: document.getElementById ('searchInput'),
  sidebar: document.getElementById ('sidebar'),
  mobileMenuToggle: document.getElementById ('mobileMenuToggle'),
  themeToggle: document.getElementById ('themeToggle'),
  lastUpdated: document.getElementById ('lastUpdated'),
};

/**
 * Initialize the application
 */
async function init () {
  try {
    // Initialize theme
    initTheme ();

    // Load guide data from JSON
    await loadGuideData ();

    // Render navigation menu
    renderNavigation ();

    // Set up event listeners
    setupEventListeners ();

    // Load initial chapter from URL hash or default to home
    const hash = window.location.hash.slice (1) || 'home';
    loadChapter (hash);

    // Update last updated date
    elements.lastUpdated.textContent = guideData.lastUpdated;
  } catch (error) {
    console.error ('Failed to initialize app:', error);
    showError ('Failed to load coding guide. Please refresh the page.');
  }
}

/**
 * Initialize theme from localStorage or system preference
 */
function initTheme () {
  const savedTheme = localStorage.getItem ('theme');
  const prefersDark = window.matchMedia ('(prefers-color-scheme: dark)')
    .matches;

  if (savedTheme) {
    document.documentElement.setAttribute ('data-theme', savedTheme);
  } else if (prefersDark) {
    document.documentElement.setAttribute ('data-theme', 'dark');
  }
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme () {
  const currentTheme = document.documentElement.getAttribute ('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.documentElement.setAttribute ('data-theme', newTheme);
  localStorage.setItem ('theme', newTheme);
}

/**
 * Load guide data from JSON file
 */
async function loadGuideData () {
  try {
    const response = await fetch ('data/codeguide.json');
    if (!response.ok) {
      throw new Error (`HTTP error! status: ${response.status}`);
    }
    guideData = await response.json ();
  } catch (error) {
    console.error ('Error loading guide data:', error);
    throw error;
  }
}

/**
 * Render navigation menu from guide data
 */
function renderNavigation () {
  if (!guideData || !guideData.chapters) return;

  const navHTML = guideData.chapters
    .sort ((a, b) => a.order - b.order)
    .map (
      chapter => `
            <li class="nav-item">
                <a href="#${chapter.id}" 
                   class="nav-link" 
                   data-chapter="${chapter.id}">
                    ${chapter.title}
                </a>
            </li>
        `
    )
    .join ('');

  elements.navMenu.innerHTML = navHTML;
}

/**
 * Load and display a chapter
 */
function loadChapter (chapterId) {
  if (!guideData) return;

  const chapter = guideData.chapters.find (ch => ch.id === chapterId);

  if (!chapter) {
    showError ('Chapter not found');
    return;
  }

  currentChapter = chapter;

  // Update URL hash without scrolling
  history.pushState (null, null, `#${chapterId}`);

  // Render chapter content
  renderChapter (chapter);

  // Update active navigation
  updateActiveNav (chapterId);

  // Generate table of contents
  generateTOC ();

  // Hide loading, show article
  elements.loading.style.display = 'none';
  elements.article.classList.add ('visible');

  // Scroll to top
  window.scrollTo (0, 0);

  // Close mobile menu if open
  elements.sidebar.classList.remove ('open');
}

/**
 * Render chapter content
 */
function renderChapter (chapter) {
  // Configure marked options
  marked.setOptions ({
    highlight: function (code, lang) {
      if (lang && hljs.getLanguage (lang)) {
        try {
          return hljs.highlight (code, {language: lang}).value;
        } catch (err) {
          console.error ('Highlight error:', err);
        }
      }
      return hljs.highlightAuto (code).value;
    },
    breaks: true,
    gfm: true,
  });

  // Parse markdown to HTML
  const html = marked.parse (chapter.content);

  // Render to article
  elements.article.innerHTML = html;

  // Apply syntax highlighting to any remaining code blocks
  elements.article.querySelectorAll ('pre code').forEach (block => {
    hljs.highlightElement (block);
  });
}

/**
 * Update active navigation item
 */
function updateActiveNav (chapterId) {
  // Remove active class from all nav links
  elements.navMenu.querySelectorAll ('.nav-link').forEach (link => {
    link.classList.remove ('active');
  });

  // Add active class to current chapter
  const activeLink = elements.navMenu.querySelector (
    `[data-chapter="${chapterId}"]`
  );
  if (activeLink) {
    activeLink.classList.add ('active');

    // Scroll nav item into view
    activeLink.scrollIntoView ({block: 'nearest', behavior: 'smooth'});
  }
}

/**
 * Generate table of contents from headings
 */
function generateTOC () {
  const headings = elements.article.querySelectorAll ('h2, h3');

  if (headings.length === 0) {
    elements.tocMenu.innerHTML =
      '<p style="color: var(--text-secondary); font-size: 0.875rem;">No headings found</p>';
    return;
  }

  const tocHTML = Array.from (headings)
    .map ((heading, index) => {
      const level = heading.tagName.toLowerCase ();
      const text = heading.textContent;
      const id = `heading-${index}`;

      // Add ID to heading for linking
      heading.id = id;

      return `
            <li>
                <a href="#${id}" 
                   class="toc-link level-${level.charAt (1)}" 
                   data-heading="${id}">
                    ${text}
                </a>
            </li>
        `;
    })
    .join ('');

  elements.tocMenu.innerHTML = tocHTML;

  // Set up TOC click handlers
  elements.tocMenu.querySelectorAll ('.toc-link').forEach (link => {
    link.addEventListener ('click', e => {
      e.preventDefault ();
      const targetId = link.getAttribute ('href').slice (1);
      const target = document.getElementById (targetId);
      if (target) {
        target.scrollIntoView ({behavior: 'smooth', block: 'start'});
        updateActiveTOC (targetId);
      }
    });
  });

  // Set up scroll spy for TOC
  setupScrollSpy ();
}

/**
 * Update active TOC item
 */
function updateActiveTOC (headingId) {
  elements.tocMenu.querySelectorAll ('.toc-link').forEach (link => {
    link.classList.remove ('active');
  });

  const activeLink = elements.tocMenu.querySelector (
    `[data-heading="${headingId}"]`
  );
  if (activeLink) {
    activeLink.classList.add ('active');
  }
}

/**
 * Set up scroll spy for TOC
 */
function setupScrollSpy () {
  const headings = elements.article.querySelectorAll ('h2, h3');

  const observer = new IntersectionObserver (
    entries => {
      entries.forEach (entry => {
        if (entry.isIntersecting) {
          updateActiveTOC (entry.target.id);
        }
      });
    },
    {
      rootMargin: '-80px 0px -80% 0px',
    }
  );

  headings.forEach (heading => observer.observe (heading));
}

/**
 * Search functionality
 */
function handleSearch (query) {
  if (!query.trim ()) {
    renderNavigation ();
    return;
  }

  const searchTerm = query.toLowerCase ();
  const filteredChapters = guideData.chapters.filter (
    chapter =>
      chapter.title.toLowerCase ().includes (searchTerm) ||
      chapter.content.toLowerCase ().includes (searchTerm)
  );

  if (filteredChapters.length === 0) {
    elements.navMenu.innerHTML =
      '<p style="padding: 1rem; color: var(--text-secondary); font-size: 0.875rem;">No results found</p>';
    return;
  }

  const navHTML = filteredChapters
    .sort ((a, b) => a.order - b.order)
    .map (chapter => {
      const highlightedTitle = highlightText (chapter.title, searchTerm);
      return `
                <li class="nav-item">
                    <a href="#${chapter.id}" 
                       class="nav-link" 
                       data-chapter="${chapter.id}">
                        ${highlightedTitle}
                    </a>
                </li>
            `;
    })
    .join ('');

  elements.navMenu.innerHTML = navHTML;
}

/**
 * Highlight search term in text
 */
function highlightText (text, searchTerm) {
  const regex = new RegExp (`(${searchTerm})`, 'gi');
  return text.replace (regex, '<mark>$1</mark>');
}

/**
 * Set up event listeners
 */
function setupEventListeners () {
  // Theme toggle
  elements.themeToggle.addEventListener ('click', toggleTheme);

  // Navigation clicks
  elements.navMenu.addEventListener ('click', e => {
    if (e.target.classList.contains ('nav-link')) {
      e.preventDefault ();
      const chapterId = e.target.dataset.chapter;
      loadChapter (chapterId);
    }
  });

  // Search input
  let searchTimeout;
  elements.searchInput.addEventListener ('input', e => {
    clearTimeout (searchTimeout);
    searchTimeout = setTimeout (() => {
      handleSearch (e.target.value);
    }, 300);
  });

  // Hash change (browser back/forward)
  window.addEventListener ('hashchange', () => {
    const hash = window.location.hash.slice (1) || 'home';
    loadChapter (hash);
  });

  // Mobile menu toggle
  elements.mobileMenuToggle.addEventListener ('click', () => {
    elements.sidebar.classList.toggle ('open');
  });

  // Close mobile menu when clicking outside
  document.addEventListener ('click', e => {
    if (window.innerWidth <= 768) {
      if (
        !elements.sidebar.contains (e.target) &&
        !elements.mobileMenuToggle.contains (e.target) &&
        elements.sidebar.classList.contains ('open')
      ) {
        elements.sidebar.classList.remove ('open');
      }
    }
  });
}

/**
 * Show error message
 */
function showError (message) {
  elements.article.innerHTML = `
        <div style="padding: 2rem; text-align: center;">
            <h2 style="color: #ef4444; margin-bottom: 1rem;">Error</h2>
            <p style="color: var(--text-secondary);">${message}</p>
        </div>
    `;
  elements.loading.style.display = 'none';
  elements.article.classList.add ('visible');
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener ('DOMContentLoaded', init);
} else {
  init ();
}
