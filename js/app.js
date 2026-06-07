/* ==========================================================================
   Twisha Patel — Portfolio
   Interactivity: theme, scroll, ⌘K, magnetic, filters, reveals, count-up
   ========================================================================== */

(function () {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----- Footer year ----- */
  const yearEl = $('#footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ======================================================================
     Preloader
     ====================================================================== */
  window.addEventListener('load', () => {
    setTimeout(() => {
      const p = $('#preloader');
      if (p) p.classList.add('hide');
    }, 350);
  });

  /* ======================================================================
     Theme toggle (persisted)
     ====================================================================== */
  const themeToggle = $('#themeToggle');
  const root = document.documentElement;

  const setTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('tp-theme', theme); } catch (e) {}
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#FAFAFA' : '#0A0A0A');
  };

  let storedTheme = null;
  try { storedTheme = localStorage.getItem('tp-theme'); } catch (e) {}
  if (storedTheme === 'light' || storedTheme === 'dark') {
    setTheme(storedTheme);
  } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    setTheme('light');
  }

  themeToggle?.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') || 'dark';
    setTheme(current === 'dark' ? 'light' : 'dark');
  });

  /* ======================================================================
     Nav: scrolled state + active link highlight
     ====================================================================== */
  const nav = $('#nav');
  const navLinks = $$('.nav-link[data-nav]');
  const sections = navLinks
    .map(a => $(a.getAttribute('href')))
    .filter(Boolean);

  const onScroll = () => {
    const y = window.scrollY;

    // Scrolled state
    nav?.classList.toggle('scrolled', y > 8);

    // Scroll progress
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (y / docHeight) * 100 : 0;
    const sp = $('#scrollProgress');
    if (sp) sp.style.width = pct + '%';

    // Back to top
    const bt = $('#backTop');
    if (bt) bt.classList.toggle('visible', y > 600);

    // Active link
    let active = null;
    for (const sec of sections) {
      const top = sec.offsetTop - 120;
      if (y >= top) active = sec;
    }
    navLinks.forEach(a => {
      const href = a.getAttribute('href').replace('#', '');
      a.classList.toggle('active', active && active.id === href);
    });
  };

  let scrollRaf = null;
  window.addEventListener('scroll', () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      onScroll();
      scrollRaf = null;
    });
  }, { passive: true });
  onScroll();

  /* ======================================================================
     Mobile menu
     ====================================================================== */
  const mobileToggle = $('#mobileToggle');
  const mobileMenu = $('#mobileMenu');
  const mobileBackdrop = $('#mobileBackdrop');
  const mqDesktop = window.matchMedia('(min-width: 769px)');

  function setMobileMenu(open) {
    if (!mobileMenu) return;
    mobileMenu.classList.toggle('open', open);
    mobileMenu.setAttribute('aria-hidden', String(!open));
    if (mobileToggle) mobileToggle.setAttribute('aria-expanded', String(open));
    if (mobileBackdrop) {
      mobileBackdrop.classList.toggle('open', open);
      if (open) mobileBackdrop.removeAttribute('hidden');
      else mobileBackdrop.setAttribute('hidden', '');
    }
    document.body.classList.toggle('menu-open', open);
  }

  mobileToggle?.addEventListener('click', () => {
    setMobileMenu(!mobileMenu.classList.contains('open'));
  });
  mobileBackdrop?.addEventListener('click', () => setMobileMenu(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu?.classList.contains('open')) {
      setMobileMenu(false);
      mobileToggle?.focus();
    }
  });
  mqDesktop.addEventListener('change', (e) => {
    if (e.matches) setMobileMenu(false);
  });

  /* ======================================================================
     Smooth scroll for anchor links (with offset for fixed nav)
     ====================================================================== */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = $(href);
      if (!target) return;
      e.preventDefault();
      const offset = 64;
      window.scrollTo({
        top: target.offsetTop - offset,
        behavior: reducedMotion ? 'auto' : 'smooth'
      });
      // Close mobile menu if open
      setMobileMenu(false);
    });
  });

  /* ======================================================================
     Back to top
     ====================================================================== */
  $('#backTop')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  });

  /* Lift the back-to-top button off the footer to avoid overlap.
     Watches the footer; when it enters the viewport, anchor the button
     to the left edge of the viewport. */
  (() => {
    const bt = $('#backTop');
    const footer = $('#siteFooter');
    if (!bt || !footer || typeof IntersectionObserver === 'undefined') return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          bt.classList.toggle('lifted', entry.isIntersecting);
        }
      },
      { threshold: 0, rootMargin: '0px 0px -10% 0px' }
    );
    io.observe(footer);
  })();

  /* ======================================================================
     Scroll reveals
     ====================================================================== */
  const revealEls = $$('.reveal, .stagger, .bento-cell');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in-view'));
  }

  /* ======================================================================
     Hero count-up
     ====================================================================== */
  const counters = $$('.hero-meta-num[data-count]');
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const isFloat = !Number.isInteger(target);
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = target * eased;
      el.textContent = (isFloat ? value.toFixed(1) : Math.round(value)) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          co.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => co.observe(c));
  } else {
    counters.forEach(animateCount);
  }

  /* ======================================================================
     Project filtering
     ====================================================================== */
  const filterBtns = $$('.filter-btn');
  const projectCards = $$('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      filterBtns.forEach(b => b.classList.toggle('active', b === btn));
      projectCards.forEach(card => {
        const match = filter === 'all' || card.dataset.cat === filter;
        card.classList.toggle('hidden', !match);
      });
    });
  });

  /* ======================================================================
     Magnetic buttons (subtle)
     ====================================================================== */
  if (!reducedMotion && window.matchMedia('(pointer: fine)').matches) {
    $$('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  /* ======================================================================
     Command Palette (⌘K)
     ====================================================================== */
  const cmdkOverlay = $('#cmdkOverlay');
  const cmdkInput = $('#cmdkInput');
  const cmdkResults = $('#cmdkResults');
  const cmdkTrigger = $('#cmdkTrigger');

  // Build searchable index
  const cmdkItems = [
    { type: 'Navigation', title: 'Home', sub: 'Hero section', icon: 'home', action: () => scrollToId('home') },
    { type: 'Navigation', title: 'About', sub: 'Who I am', icon: 'user', action: () => scrollToId('about') },
    { type: 'Navigation', title: 'Experience', sub: 'Career timeline', icon: 'briefcase', action: () => scrollToId('experience') },
    { type: 'Navigation', title: 'Projects', sub: 'Featured work', icon: 'code', action: () => scrollToId('work') },
    { type: 'Navigation', title: 'Skills', sub: 'How I build', icon: 'sparkles', action: () => scrollToId('skills') },
    { type: 'Navigation', title: 'Tech Stack', sub: 'Tools I use', icon: 'stack', action: () => scrollToId('stack') },
    { type: 'Navigation', title: 'Education', sub: 'Academic background', icon: 'edu', action: () => scrollToId('education') },
    { type: 'Navigation', title: 'Contact', sub: 'Get in touch', icon: 'mail', action: () => scrollToId('contact') },

    { type: 'Projects', title: 'LlamaIndex Open-Source Contribution', sub: 'RAG · FastAPI · 2026', icon: 'code', action: () => window.open('https://github.com/run-llama/llama_index', '_blank') },
    { type: 'Projects', title: 'Pneumonia Detector AI', sub: 'Medical imaging · 2025', icon: 'code', action: () => window.open('https://github.com/twishapatel12/Pneumonia-Detector-AI', '_blank') },
    { type: 'Projects', title: 'AutoML Pipeline Service', sub: 'ML platform · 2025', icon: 'code', action: () => window.open('https://github.com/twishapatel12/AutoML-Pipeline', '_blank') },
    { type: 'Projects', title: 'Finance-domain Small LLM', sub: 'Flan-T5 · 2025', icon: 'code', action: () => window.open('https://github.com/twishapatel12/Finance-LLM', '_blank') },
    { type: 'Projects', title: 'Real-time Object Detection', sub: 'MMDetection · 2025', icon: 'code', action: () => window.open('https://github.com/twishapatel12/ObjectDetection-RTMDet-tiny', '_blank') },
    { type: 'Projects', title: 'Traffic Sign Recognition', sub: 'CNN · 2023', icon: 'code', action: () => window.open('https://github.com/twishapatel12/TrafficSignRecognition', '_blank') },
    { type: 'Projects', title: 'Desktop Voice Assistant', sub: 'Speech AI · 2023', icon: 'code', action: () => window.open('https://github.com/twishapatel12/VoiceAssistant', '_blank') },

    { type: 'Actions', title: 'Send Email', sub: 'twishap534@gmail.com', icon: 'mail', action: () => window.location.href = 'mailto:twishap534@gmail.com' },
    { type: 'Actions', title: 'Download Resume', sub: 'TwishaPatel_Resume.pdf', icon: 'download', action: () => window.location.href = 'docs/TwishaPatel_Resume.pdf' },
    { type: 'Actions', title: 'Open GitHub', sub: '@twishapatel12', icon: 'github', action: () => window.open('https://github.com/twishapatel12', '_blank') },
    { type: 'Actions', title: 'Open LinkedIn', sub: 'twisha-patel-253bbb229', icon: 'linkedin', action: () => window.open('https://www.linkedin.com/in/twisha-patel-253bbb229/', '_blank') },
    { type: 'Actions', title: 'Toggle Theme', sub: 'Dark / Light', icon: 'theme', action: () => themeToggle?.click() },
  ];

  const iconSvg = (name) => {
    const map = {
      home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
      user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      briefcase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
      code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
      sparkles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l1.9 5.8L20 10l-5.8 1.9L12 18l-1.9-5.8L4 10l5.8-1.9L12 3z"/></svg>',
      stack: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
      edu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
      mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="m22 6-10 7L2 6"/></svg>',
      download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>',
      github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.8 10.9.6.1.8-.3.8-.6v-2.2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2.9-.3 1.9-.4 3-.4s2.1.1 3 .4c2.3-1.6 3.3-1.2 3.3-1.2.7 1.6.2 2.8.1 3.1.7.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.5-1.5 7.8-5.8 7.8-10.9C23.5 5.7 18.3.5 12 .5z"/></svg>',
      linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2zM8 19H5v-9h3v9zM6.5 8.25A1.75 1.75 0 1 1 8.25 6.5 1.75 1.75 0 0 1 6.5 8.25zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0 0 13 14.19V19h-3v-9h2.9v1.3a3.11 3.11 0 0 1 2.7-1.4c1.55 0 3.36.86 3.36 3.66z"/></svg>',
      theme: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
    };
    return map[name] || map.code;
  };

  function scrollToId(id) {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.offsetTop - 64, behavior: 'smooth' });
  }

  let selectedIndex = 0;
  let currentResults = [];

  const renderResults = (query = '') => {
    const q = query.trim().toLowerCase();
    const filtered = cmdkItems.filter(it =>
      !q || it.title.toLowerCase().includes(q) || it.sub.toLowerCase().includes(q) || it.type.toLowerCase().includes(q)
    );
    currentResults = filtered;

    if (!filtered.length) {
      cmdkResults.innerHTML = '<div class="cmdk-empty">No results. Try "projects", "resume", or "github".</div>';
      return;
    }

    // Group by type
    const groups = {};
    filtered.forEach(it => { (groups[it.type] = groups[it.type] || []).push(it); });

    let html = '';
    let idx = 0;
    Object.keys(groups).forEach(type => {
      html += `<div class="cmdk-section-label">${type}</div>`;
      groups[type].forEach(it => {
        const isSel = idx === selectedIndex ? ' selected' : '';
        html += `<div class="cmdk-item${isSel}" data-idx="${idx}">
          <div class="cmdk-item-left">
            <div class="cmdk-item-icon">${iconSvg(it.icon)}</div>
            <div>
              <div class="cmdk-item-title">${it.title}</div>
              <div class="cmdk-item-sub">${it.sub}</div>
            </div>
          </div>
        </div>`;
        idx++;
      });
    });
    cmdkResults.innerHTML = html;

    // Bind clicks
    $$('.cmdk-item', cmdkResults).forEach(el => {
      el.addEventListener('click', () => {
        const i = parseInt(el.dataset.idx, 10);
        if (currentResults[i]) {
          currentResults[i].action();
          closeCmdk();
        }
      });
      el.addEventListener('mouseenter', () => {
        selectedIndex = parseInt(el.dataset.idx, 10);
        $$('.cmdk-item', cmdkResults).forEach((e, j) => e.classList.toggle('selected', j === selectedIndex));
      });
    });
  };

  const openCmdk = () => {
    cmdkOverlay.classList.add('open');
    cmdkInput.value = '';
    selectedIndex = 0;
    renderResults();
    setTimeout(() => cmdkInput.focus(), 50);
    document.body.style.overflow = 'hidden';
  };

  const closeCmdk = () => {
    cmdkOverlay.classList.remove('open');
    document.body.style.overflow = '';
  };

  cmdkTrigger?.addEventListener('click', openCmdk);

  cmdkInput?.addEventListener('input', (e) => {
    selectedIndex = 0;
    renderResults(e.target.value);
  });

  cmdkInput?.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, currentResults.length - 1);
      renderResults(cmdkInput.value);
      scrollSelectedIntoView();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      renderResults(cmdkInput.value);
      scrollSelectedIntoView();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentResults[selectedIndex]) {
        currentResults[selectedIndex].action();
        closeCmdk();
      }
    } else if (e.key === 'Escape') {
      closeCmdk();
    }
  });

  const scrollSelectedIntoView = () => {
    requestAnimationFrame(() => {
      const sel = $('.cmdk-item.selected', cmdkResults);
      if (sel) sel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  };

  // Global keyboard shortcut
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (cmdkOverlay.classList.contains('open')) closeCmdk();
      else openCmdk();
    } else if (e.key === 'Escape' && cmdkOverlay.classList.contains('open')) {
      closeCmdk();
    }
  });

  // Click outside closes
  cmdkOverlay?.addEventListener('click', (e) => {
    if (e.target === cmdkOverlay) closeCmdk();
  });

  /* ======================================================================
     Subtle parallax for code card
     ====================================================================== */
  if (!reducedMotion && window.matchMedia('(pointer: fine)').matches) {
    const codeCard = $('.code-card');
    const hero = $('.hero');
    if (codeCard && hero) {
      hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        codeCard.style.transform = `perspective(1000px) rotateY(${-5 + x * 4}deg) rotateX(${2 - y * 4}deg)`;
      });
      hero.addEventListener('mouseleave', () => {
        codeCard.style.transform = '';
      });
    }
  }

  /* ======================================================================
     Project card tilt (subtle)
     ====================================================================== */
  if (!reducedMotion && window.matchMedia('(pointer: fine)').matches) {
    $$('.project-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `translateY(-4px) perspective(1000px) rotateX(${-y * 2}deg) rotateY(${x * 2}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ======================================================================
     Hero name: letter-by-letter reveal
     ====================================================================== */
  (function splitHeroName() {
    if (reducedMotion) return;
    const els = $$('[data-name-split]');
    els.forEach(el => {
      const text = el.textContent;
      el.textContent = '';
      const frag = document.createDocumentFragment();
      [...text].forEach((ch, i) => {
        const span = document.createElement('span');
        span.className = 'ch';
        span.textContent = ch;
        span.style.animationDelay = (0.15 + i * 0.04) + 's';
        frag.appendChild(span);
      });
      el.appendChild(frag);
    });
  })();

  /* ======================================================================
     Console signature
     ====================================================================== */
  if (window.console && console.log) {
    console.log(
      '%cTwisha Patel — Portfolio',
      'color:#3B82F6;font-weight:600;font-size:14px;'
    );
    console.log(
      '%cBuilt with vanilla web. No frameworks shipped to prod.',
      'color:#707070;font-size:11px;'
    );
    console.log('Looking for AI/ML engineering talent? → twishap534@gmail.com');
  }

})();
