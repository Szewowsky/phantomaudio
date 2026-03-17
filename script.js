/* ============================================
   PHANTOM AUDIO — Main Script
   ============================================ */

(function () {
  'use strict';

  const FRAME_COUNT = 85;
  const frames = [];
  let loadedCount = 0;
  let lastDrawnIndex = -1;
  let isMobile = window.innerWidth < 768;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Choose frame path based on screen size
  function getFramePath() {
    return isMobile ? 'frames-mobile/frame_' : 'frames/frame_';
  }

  // DOM Elements
  const loader = document.getElementById('loader');
  const loaderBar = document.getElementById('loader-bar');
  const loaderPercent = document.getElementById('loader-percent');
  const canvas = document.getElementById('hero-canvas');
  const ctx = canvas.getContext('2d');
  const heroWrapper = document.getElementById('hero-wrapper');
  const heroContent = document.querySelector('.hero-content');
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  const cursorDot = document.getElementById('cursor-dot');

  /* ---- Frame Preloader ---- */
  function preloadFrames() {
    const framePath = getFramePath();

    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      const num = String(i).padStart(4, '0');
      img.src = `${framePath}${num}.jpg`;
      img.onload = onFrameLoaded;
      img.onerror = onFrameLoaded;
      frames[i - 1] = img;
    }
  }

  function onFrameLoaded() {
    loadedCount++;
    const progress = Math.round((loadedCount / FRAME_COUNT) * 100);
    loaderBar.style.width = progress + '%';
    loaderPercent.textContent = progress + '%';

    if (loadedCount >= FRAME_COUNT) {
      finishLoading();
    }
  }

  function finishLoading() {
    loader.classList.add('hidden');
    document.body.classList.remove('loading');

    resizeCanvas();
    drawFrame(0, true);
    initScrollAnimation();
    initRevealObserver();
    initNav();
    initCursor();
  }

  /* ---- Canvas Renderer ---- */
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (lastDrawnIndex >= 0) {
      drawFrame(lastDrawnIndex, true);
    }
  }

  function drawFrame(index, force) {
    if (index === lastDrawnIndex && !force) return;
    if (!frames[index] || !frames[index].complete) return;

    lastDrawnIndex = index;
    const img = frames[index];

    const displayW = window.innerWidth;
    const displayH = window.innerHeight;

    // Cover-fit calculation
    const canvasRatio = displayW / displayH;
    const imgRatio = img.naturalWidth / img.naturalHeight;

    let drawW, drawH, drawX, drawY;

    if (imgRatio > canvasRatio) {
      drawH = displayH;
      drawW = drawH * imgRatio;
      drawX = (displayW - drawW) / 2;
      drawY = 0;
    } else {
      drawW = displayW;
      drawH = drawW / imgRatio;
      drawX = 0;
      drawY = (displayH - drawH) / 2;
    }

    ctx.clearRect(0, 0, displayW, displayH);
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }

  /* ---- Scroll-Driven Animation (Lerp Smoothing) ---- */
  function initScrollAnimation() {
    let targetProgress = 0;
    let currentProgress = 0;
    const lerpFactor = prefersReducedMotion ? 1 : 0.08;

    function onScroll() {
      const scrollTop = window.scrollY;
      const maxScroll = heroWrapper.offsetHeight - window.innerHeight;
      if (maxScroll > 0) {
        targetProgress = Math.min(Math.max(scrollTop / maxScroll, 0), 1);
      }
    }

    function renderLoop() {
      currentProgress += (targetProgress - currentProgress) * lerpFactor;

      const frameIndex = Math.min(Math.floor(currentProgress * FRAME_COUNT), FRAME_COUNT - 1);

      if (Math.abs(targetProgress - currentProgress) > 0.001) {
        drawFrame(frameIndex);

        if (heroContent) {
          heroContent.style.opacity = Math.max(1 - currentProgress * 3, 0);
        }
      }

      requestAnimationFrame(renderLoop);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    requestAnimationFrame(renderLoop);
  }

  /* ---- Intersection Observer — Reveals ---- */
  function initRevealObserver() {
    const revealEls = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    revealEls.forEach((el) => observer.observe(el));
  }

  /* ---- Navigation ---- */
  function initNav() {
    let scrollTicking = false;

    function onNavScroll() {
      if (!scrollTicking) {
        requestAnimationFrame(() => {
          scrollTicking = false;
          if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
          } else {
            navbar.classList.remove('scrolled');
          }
        });
        scrollTicking = true;
      }
    }

    window.addEventListener('scroll', onNavScroll, { passive: true });

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (targetId === '#') return;
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
          closeNav();
        }
      });
    });

    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      document.body.classList.toggle('nav-open');
    });

    document.addEventListener('click', (e) => {
      if (
        navLinks.classList.contains('open') &&
        !navLinks.contains(e.target) &&
        !hamburger.contains(e.target)
      ) {
        closeNav();
      }
    });
  }

  function closeNav() {
    navLinks.classList.remove('open');
    document.body.classList.remove('nav-open');
  }

  /* ---- Custom Cursor ---- */
  function initCursor() {
    const isTouch = window.matchMedia('(hover: none)').matches;
    if (isTouch || isMobile) {
      cursorDot.classList.add('hidden');
      return;
    }

    document.addEventListener('mousemove', (e) => {
      cursorDot.style.left = e.clientX - 4 + 'px';
      cursorDot.style.top = e.clientY - 4 + 'px';
    });

    const interactiveEls = document.querySelectorAll('a, button, .feature-card');
    interactiveEls.forEach((el) => {
      el.addEventListener('mouseenter', () => cursorDot.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursorDot.classList.remove('hover'));
    });
  }

  /* ---- Resize Handler ---- */
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      isMobile = window.innerWidth < 768;
      resizeCanvas();
    }, 200);
  });

  /* ---- Init ---- */
  preloadFrames();
})();
