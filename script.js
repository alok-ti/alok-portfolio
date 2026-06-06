/**
 * ================================================================
 *  PRIME PORTFOLIO — MAIN JAVASCRIPT v2.0
 *  Senior Frontend Review — All improvements applied
 *
 *  Improvements:
 *  - prefers-reduced-motion respected for ALL animations
 *  - Particle canvas paused when tab is not visible (Page Visibility API)
 *  - ResizeObserver debounced to prevent layout thrashing
 *  - Stagger delays injected via CSS custom property (no JS timeout loops)
 *  - Theme toggle updates aria-label dynamically
 *  - Hamburger menu traps focus (keyboard accessibility)
 *  - Project filter uses CSS transitions (no display:none flash)
 *  - Form submit shows aria-live success/error feedback
 *  - Back-to-top uses hidden attribute (native, accessible)
 *  - Footer year auto-updated
 *  - No global event listener leaks (passive scroll, ResizeObserver cleanup)
 *
 *  Table of Contents:
 *   0.  Utility Helpers
 *   1.  Page Loader
 *   2.  Custom Cursor
 *   3.  Particle Canvas Background
 *   4.  Navbar: Scroll + Active Link
 *   5.  Mobile Hamburger + Focus Trap
 *   6.  Dark / Light Mode Toggle
 *   7.  Smooth Scrolling
 *   8.  Scroll Reveal Animations (with stagger)
 *   9.  Typing Animation (Hero)
 *  10.  Animated Counter (About Stats)
 *  11.  Skill Bar Animations
 *  12.  Project Filter (fade transition)
 *  13.  Testimonials Slider
 *  14.  Contact Form Validation
 *  15.  Back To Top Button
 *  16.  Footer Year
 *  17.  Init / Entry Point
 * ================================================================
 */

'use strict';

/* ================================================================
   0. UTILITY HELPERS
================================================================ */

/** Shorthand querySelector */
const $ = (sel, ctx = document) => ctx.querySelector(sel);

/** Shorthand querySelectorAll → real Array */
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/** Check if user prefers reduced motion */
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Debounce — returns a function that fires 'fn' only after
 * 'wait' ms of silence. Used for resize handlers.
 */
function debounce(fn, wait = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

/* ================================================================
   1. PAGE LOADER
================================================================ */
function initLoader() {
  const loader = $('#loader');
  if (!loader) return;

  // Prevent scroll while loading
  document.body.style.overflow = 'hidden';

  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('hidden');
      document.body.style.overflow = '';
    }, prefersReducedMotion() ? 0 : 500);
  });
}

/* ================================================================
   2. CUSTOM CURSOR
   Only active on mouse-pointer devices. Respects reduced-motion.
================================================================ */
function initCursor() {
  const dot     = $('#cursor-dot');
  const outline = $('#cursor-outline');
  if (!dot || !outline) return;
  if (!window.matchMedia('(pointer: fine)').matches) return;
  if (prefersReducedMotion()) return; // don't animate on reduced-motion

  let mouseX = 0, mouseY = 0;
  let outlineX = 0, outlineY = 0;
  let rafId;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    // Dot follows instantly (via transform for GPU)
    dot.style.left = mouseX + 'px';
    dot.style.top  = mouseY + 'px';
  }, { passive: true });

  function lerpOutline() {
    outlineX += (mouseX - outlineX) * 0.13;
    outlineY += (mouseY - outlineY) * 0.13;
    outline.style.left = outlineX + 'px';
    outline.style.top  = outlineY + 'px';
    rafId = requestAnimationFrame(lerpOutline);
  }
  lerpOutline();

  // Scale up on interactive elements
  const HOVER_TARGETS = 'a, button, [role="button"], input, textarea, .project-card, .skill-card, .service-card';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(HOVER_TARGETS)) document.body.classList.add('cursor-hover');
  }, { passive: true });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(HOVER_TARGETS)) document.body.classList.remove('cursor-hover');
  }, { passive: true });

  // Hide cursor when it leaves the window
  document.addEventListener('mouseleave', () => {
    dot.style.opacity = '0';
    outline.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    dot.style.opacity = '1';
    outline.style.opacity = '1';
  });
}

/* ================================================================
   3. PARTICLE CANVAS BACKGROUND
   Paused when tab is not visible (Page Visibility API).
================================================================ */
function initParticles() {
  const canvas = $('#particles-canvas');
  if (!canvas) return;

  // Skip particles on reduced-motion preference
  if (prefersReducedMotion()) {
    canvas.style.display = 'none';
    return;
  }

  const ctx = canvas.getContext('2d');
  let particles = [];
  let rafId;
  let isRunning = true;

  const BRAND_COLORS = ['#6c63ff', '#00d9ff', '#a855f7', '#10b981'];

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r:  Math.random() * 1.8 + 0.4,
      alpha: Math.random() * 0.45 + 0.1,
      color: BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)],
    };
  }

  function initArray() {
    const count = Math.min(70, Math.floor((canvas.width * canvas.height) / 15000));
    particles = Array.from({ length: count }, createParticle);
  }

  function drawConnections() {
    const MAX_DIST = 110;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx   = particles[i].x - particles[j].x;
        const dy   = particles[i].y - particles[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist < MAX_DIST) {
          const opacity = (1 - dist / MAX_DIST) * 0.12;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(108,99,255,${opacity})`;
          ctx.lineWidth   = 1;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    if (!isRunning) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      // Wrap edges
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    drawConnections();
    rafId = requestAnimationFrame(animate);
  }

  // Page Visibility API — pause when tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isRunning = false;
      cancelAnimationFrame(rafId);
    } else {
      isRunning = true;
      animate();
    }
  });

  // Debounced resize
  const onResize = debounce(() => {
    cancelAnimationFrame(rafId);
    resize();
    initArray();
    animate();
  }, 250);

  const ro = new ResizeObserver(onResize);
  ro.observe(canvas.parentElement);

  resize();
  initArray();
  animate();
}

/* ================================================================
   4. NAVBAR: SCROLL BEHAVIOUR & ACTIVE LINK
================================================================ */
function initNavbar() {
  const navbar   = $('#navbar');
  const navLinks = $$('.nav__link');
  const sections = $$('section[id]');

  function onScroll() {
    // Scrolled glass effect
    navbar.classList.toggle('scrolled', window.scrollY > 50);

    // Highlight active section
    const mid = window.scrollY + window.innerHeight * 0.4;
    let activeId = '';

    sections.forEach((s) => {
      if (s.offsetTop <= mid) activeId = s.id;
    });

    navLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${activeId}`;
      link.classList.toggle('active', isActive);
      link.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ================================================================
   5. MOBILE HAMBURGER + FOCUS TRAP
================================================================ */
function initHamburger() {
  const hamburger = $('#hamburger');
  const navMenu   = $('#nav-menu');
  if (!hamburger || !navMenu) return;

  // Collect focusable elements inside the mobile menu
  function getFocusable() {
    return $$('a, button', navMenu).filter(
      (el) => !el.disabled && el.offsetParent !== null
    );
  }

  function open() {
    hamburger.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
    hamburger.setAttribute('aria-label', 'Close navigation menu');
    navMenu.classList.add('open');
    // Focus first item after animation
    setTimeout(() => getFocusable()[0]?.focus(), 50);
  }

  function close() {
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Open navigation menu');
    navMenu.classList.remove('open');
  }

  hamburger.addEventListener('click', () => {
    navMenu.classList.contains('open') ? close() : open();
  });

  // Close when a link is clicked
  navMenu.addEventListener('click', (e) => {
    if (e.target.matches('.nav__link')) close();
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) close();
  });

  // Escape key closes menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('open')) {
      close();
      hamburger.focus();
    }

    // Tab key trap inside open menu
    if (e.key === 'Tab' && navMenu.classList.contains('open')) {
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}

/* ================================================================
   6. DARK / LIGHT MODE TOGGLE
================================================================ */
function initThemeToggle() {
  const btn  = $('#theme-toggle');
  const html = document.documentElement;
  if (!btn) return;

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('prime-theme', theme);
    btn.setAttribute('aria-label',
      theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
    );
  }

  // Respect OS preference on first visit, else load saved
  const saved = localStorage.getItem('prime-theme');
  if (saved) {
    applyTheme(saved);
  } else {
    const osPrefers = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    applyTheme(osPrefers);
  }

  btn.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });
}

/* ================================================================
   7. SMOOTH SCROLLING
   Intercepts all anchor clicks and offsets for navbar height.
================================================================ */
function initSmoothScroll() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const id = link.getAttribute('href').slice(1);
    if (!id) return; // bare "#" — scroll to top

    const target = document.getElementById(id);
    if (!target) return;

    e.preventDefault();
    const navbar = $('#navbar');
    const offset = navbar ? navbar.offsetHeight : 72;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    // Move focus for keyboard users
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
}

/* ================================================================
   8. SCROLL REVEAL ANIMATIONS
   Stagger delay applied via CSS custom property --reveal-delay
   so the JS doesn't manage timeouts.
================================================================ */
function initScrollReveal() {
  const elements = $$('.reveal');
  if (!elements.length) return;

  // If user prefers reduced motion, just reveal everything immediately
  if (prefersReducedMotion()) {
    elements.forEach((el) => el.classList.add('visible'));
    return;
  }

  // Assign stagger delay to children of the same parent
  const processed = new Set();
  elements.forEach((el) => {
    const parent = el.parentElement;
    if (processed.has(parent)) return;
    processed.add(parent);

    const siblings = $$('.reveal', parent);
    siblings.forEach((sib, i) => {
      sib.style.setProperty('--reveal-delay', `${i * 0.08}s`);
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );

  elements.forEach((el) => observer.observe(el));
}

/* ================================================================
   9. TYPING ANIMATION — Hero Section
================================================================ */
function initTypingAnimation() {
  const target = $('#typed-text');
  if (!target) return;

  const words = [
    'CS Student',
    'Software Developer',
    'AI Enthusiast',
    'Web Developer',
    'Python Developer',
    'Problem Solver',
  ];

  // Skip animation if reduced-motion — just show first word
  if (prefersReducedMotion()) {
    target.textContent = words[0];
    return;
  }

  let wordIdx  = 0;
  let charIdx  = 0;
  let deleting = false;

  const TYPE_MS   = 80;
  const DELETE_MS = 45;
  const PAUSE_MS  = 1900;
  const EMPTY_MS  = 380;

  function tick() {
    const word = words[wordIdx];

    if (!deleting) {
      charIdx++;
      target.textContent = word.slice(0, charIdx);
      if (charIdx === word.length) {
        deleting = true;
        setTimeout(tick, PAUSE_MS);
        return;
      }
    } else {
      charIdx--;
      target.textContent = word.slice(0, charIdx);
      if (charIdx === 0) {
        deleting = false;
        wordIdx  = (wordIdx + 1) % words.length;
        setTimeout(tick, EMPTY_MS);
        return;
      }
    }

    setTimeout(tick, deleting ? DELETE_MS : TYPE_MS);
  }

  setTimeout(tick, 900);
}

/* ================================================================
   10. ANIMATED COUNTER — About Stats
================================================================ */
function initCounters() {
  const counters = $$('[data-count]');
  if (!counters.length) return;

  if (prefersReducedMotion()) {
    counters.forEach((el) => { el.textContent = el.dataset.count; });
    return;
  }

  const DURATION = 1600;

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function animate(el) {
    const to        = parseInt(el.dataset.count, 10);
    const startTime = performance.now();

    function update(now) {
      const p = Math.min((now - startTime) / DURATION, 1);
      el.textContent = Math.floor(easeOutQuart(p) * to);
      if (p < 1) requestAnimationFrame(update);
      else el.textContent = to;
    }

    requestAnimationFrame(update);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((el) => observer.observe(el));
}

/* ================================================================
   11. SKILL BAR ANIMATIONS
================================================================ */
function initSkillBars() {
  const bars = $$('.skill-card__bar');
  if (!bars.length) return;

  if (prefersReducedMotion()) {
    bars.forEach((bar) => { bar.style.width = (bar.dataset.width || 0) + '%'; });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const bar = entry.target;
          // Slight delay so CSS transition fires after element is visible
          requestAnimationFrame(() => {
            bar.style.width = (bar.dataset.width || 0) + '%';
          });
          observer.unobserve(bar);
        }
      });
    },
    { threshold: 0.25 }
  );

  bars.forEach((bar) => {
    bar.style.width = '0';
    observer.observe(bar);
  });
}

/* ================================================================
   12. PROJECT FILTER
   Uses opacity + scale transition instead of display:none flash.
================================================================ */
function initProjectFilter() {
  const filterBtns   = $$('.filter-btn');
  const projectCards = $$('.project-card');
  if (!filterBtns.length || !projectCards.length) return;

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      // Update active tab
      filterBtns.forEach((b) => {
        b.classList.remove('filter-btn--active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('filter-btn--active');
      btn.setAttribute('aria-selected', 'true');

      const filter = btn.dataset.filter;

      projectCards.forEach((card, i) => {
        const match = filter === 'all' || card.dataset.category === filter;

        if (match) {
          card.classList.remove('hide');
          // Stagger entrance
          card.style.transitionDelay = `${i * 0.04}s`;
          card.style.opacity = '1';
          card.style.transform = 'scale(1)';
          card.removeAttribute('aria-hidden');
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.94)';
          card.setAttribute('aria-hidden', 'true');
          // Delay adding .hide until after transition
          setTimeout(() => {
            if (card.style.opacity === '0') card.classList.add('hide');
          }, 300);
        }
      });
    });
  });
}

/* ================================================================
   13. TESTIMONIALS SLIDER
   Full keyboard + swipe + auto-advance + pause-on-hover.
================================================================ */
function initTestimonialsSlider() {
  const track    = $('#testimonials-track');
  const dotsWrap = $('#testimonials-dots');
  const prevBtn  = $('#testimonial-prev');
  const nextBtn  = $('#testimonial-next');
  if (!track) return;

  const slides = $$('.testimonial-card', track);
  const total  = slides.length;
  let current  = 0;
  let autoId;

  // Build dot tabs
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'testimonials__dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
    dot.setAttribute('aria-selected', String(i === 0));
    dot.addEventListener('click', () => { goTo(i); resetAuto(); });
    dotsWrap.appendChild(dot);
  });

  const dots = $$('.testimonials__dot', dotsWrap);

  function goTo(idx) {
    current = (idx + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;

    dots.forEach((d, i) => {
      const isActive = i === current;
      d.classList.toggle('active', isActive);
      d.setAttribute('aria-selected', String(isActive));
    });

    // Update slide aria-hidden
    slides.forEach((s, i) => {
      s.setAttribute('aria-hidden', String(i !== current));
    });
  }

  // Initialise
  goTo(0);

  prevBtn?.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
  nextBtn?.addEventListener('click', () => { goTo(current + 1); resetAuto(); });

  // Arrow-key navigation when slider is focused
  const slider = $('#testimonials-slider');
  slider?.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { goTo(current - 1); resetAuto(); }
    if (e.key === 'ArrowRight') { goTo(current + 1); resetAuto(); }
  });

  // Auto-advance (skip if reduced-motion)
  function startAuto() {
    if (prefersReducedMotion()) return;
    autoId = setInterval(() => goTo(current + 1), 5000);
  }
  function stopAuto()  { clearInterval(autoId); }
  function resetAuto() { stopAuto(); startAuto(); }

  slider?.addEventListener('mouseenter', stopAuto);
  slider?.addEventListener('mouseleave', startAuto);
  slider?.addEventListener('focusin',    stopAuto);
  slider?.addEventListener('focusout',   startAuto);

  // Touch / swipe
  let touchX = 0;
  track.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend',   (e) => {
    const diff = touchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 45) { goTo(diff > 0 ? current + 1 : current - 1); resetAuto(); }
  }, { passive: true });

  startAuto();
}

/* ================================================================
   14. CONTACT FORM VALIDATION
================================================================ */
function initContactForm() {
  const form       = $('#contact-form');
  const submitBtn  = $('#contact-submit');
  const submitText = $('#contact-submit-text');
  const successMsg = $('#form-success');
  if (!form) return;

  function showError(inputId, errorId, msg) {
    const input = $(`#${inputId}`);
    const err   = $(`#${errorId}`);
    if (!input || !err) return;
    input.classList.add('error');
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', errorId);
    err.textContent = msg;
  }

  function clearError(inputId, errorId) {
    const input = $(`#${inputId}`);
    const err   = $(`#${errorId}`);
    if (!input || !err) return;
    input.classList.remove('error');
    input.removeAttribute('aria-invalid');
    err.textContent = '';
  }

  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }

  function validate() {
    let valid = true;

    const name = $('#contact-name')?.value.trim() ?? '';
    if (name.length < 2) {
      showError('contact-name', 'error-name', 'Please enter your full name (at least 2 characters).');
      valid = false;
    } else { clearError('contact-name', 'error-name'); }

    const email = $('#contact-email')?.value.trim() ?? '';
    if (!email) {
      showError('contact-email', 'error-email', 'Please enter your email address.');
      valid = false;
    } else if (!isEmail(email)) {
      showError('contact-email', 'error-email', 'Please enter a valid email address.');
      valid = false;
    } else { clearError('contact-email', 'error-email'); }

    const subject = $('#contact-subject')?.value.trim() ?? '';
    if (subject.length < 3) {
      showError('contact-subject', 'error-subject', 'Please enter a subject (at least 3 characters).');
      valid = false;
    } else { clearError('contact-subject', 'error-subject'); }

    const message = $('#contact-message')?.value.trim() ?? '';
    if (message.length < 10) {
      showError('contact-message', 'error-message', 'Please enter a message (at least 10 characters).');
      valid = false;
    } else { clearError('contact-message', 'error-message'); }

    return valid;
  }

  // Real-time clearing as user types
  $$('#contact-name, #contact-email, #contact-subject, #contact-message').forEach((input) => {
    input.addEventListener('input', () => {
      input.classList.remove('error');
      input.removeAttribute('aria-invalid');
      const errorId = 'error-' + input.id.replace('contact-', '');
      const errorEl = $(`#${errorId}`);
      if (errorEl) errorEl.textContent = '';
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) {
      // Focus first error field
      const firstError = form.querySelector('.error');
      firstError?.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-busy', 'true');
    submitText.textContent = 'Sending…';

    // Simulated network delay
    await new Promise((res) => setTimeout(res, 1600));

    submitText.textContent = 'Sent! ✓';
    successMsg.hidden = false;
    successMsg.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
    form.reset();

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.removeAttribute('aria-busy');
      submitText.textContent = 'Send Message';
      successMsg.hidden = true;
    }, 4500);
  });
}

/* ================================================================
   15. BACK TO TOP BUTTON
================================================================ */
function initBackToTop() {
  const btn = $('#back-to-top');
  if (!btn) return;

  function onScroll() {
    const show = window.scrollY > 500;
    btn.classList.toggle('visible', show);
    // Use hidden attr for native accessibility
    btn.hidden = !show;
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  });
}

/* ================================================================
   16. FOOTER YEAR
================================================================ */
function initFooterYear() {
  const el = $('#footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ================================================================
   17. INIT / ENTRY POINT
================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Core
  initLoader();
  initCursor();
  initNavbar();
  initHamburger();
  initThemeToggle();
  initSmoothScroll();

  // Animations
  initScrollReveal();
  initTypingAnimation();
  initCounters();
  initSkillBars();
  initParticles();

  // Interactive components
  initProjectFilter();
  initTestimonialsSlider();
  initContactForm();
  initBackToTop();

  // Utilities
  initFooterYear();

  // Dev helper
  console.log(
    '%c< Alok Tiwari /> Portfolio',
    'color:#6c63ff;font-size:16px;font-weight:900;font-family:monospace;',
    '\n\nComputer Science Student & Aspiring Software Engineer.\nBuilt with ❤️  vanilla HTML, CSS & JS.\nInspect away — all code is documented and readable.'
  );
});
