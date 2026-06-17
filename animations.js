/* ============================================
   Miroia animations
   - Scroll reveal (fade, stagger, words, chars)
   - Number counters
   - 3D card tilt
   - Magnetic buttons
   - Respects prefers-reduced-motion
   ============================================ */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- 1. Split text for word/char reveal ----------
  const splitWords = (el) => {
    const text = el.textContent.trim();
    const words = text.split(/(\s+)/);
    el.innerHTML = words
      .map((w, i) => {
        if (/^\s+$/.test(w)) return ' ';
        return `<span class="reveal-word" style="--i:${i / 2}">${w}</span>`;
      })
      .join('');
  };

  const splitChars = (el) => {
    const text = el.textContent.trim();
    el.innerHTML = [...text]
      .map((c, i) => `<span class="reveal-char" style="--i:${i}">${c === ' ' ? '&nbsp;' : c}</span>`)
      .join('');
  };

  document.querySelectorAll('[data-reveal-words]').forEach(splitWords);
  document.querySelectorAll('[data-reveal-chars]').forEach(splitChars);


  // ---------- 2. IntersectionObserver: reveal on scroll ----------
  const revealTargets = document.querySelectorAll(
    '[data-reveal], [data-reveal-children], [data-reveal-words], [data-reveal-chars]'
  );

  if (revealTargets.length) {
    if (reduced) {
      revealTargets.forEach(el => el.classList.add('is-visible'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      }, { rootMargin: '-8% 0px -8% 0px', threshold: 0 });
      revealTargets.forEach(t => io.observe(t));
    }
  }


  // ---------- 3. Number counter animation ----------
  const counters = document.querySelectorAll('[data-counter]');
  if (counters.length) {
    const formatFR = new Intl.NumberFormat('fr-FR');

    const animateCounter = (el) => {
      const target = parseFloat(el.dataset.counter);
      const suffix = el.dataset.suffix || '';
      const duration = 1500;
      const start = performance.now();

      if (reduced) {
        el.textContent = formatFR.format(target) + suffix;
        return;
      }

      const step = (t) => {
        const p = Math.min((t - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = Math.round(target * eased);
        el.textContent = formatFR.format(val) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const cIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animateCounter(e.target);
          cIO.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(c => {
      c.textContent = '0';
      cIO.observe(c);
    });
  }


  // ---------- 4. 3D Card Tilt ----------
  if (!reduced) {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      const maxTilt = parseFloat(card.dataset.tilt) || 5;

      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const tx = (px - 0.5) * maxTilt * 2;
        const ty = (0.5 - py) * maxTilt * 2;
        card.style.setProperty('--tilt-x', `${tx}deg`);
        card.style.setProperty('--tilt-y', `${ty}deg`);
        card.style.setProperty('--mx', `${px * 100}%`);
        card.style.setProperty('--my', `${py * 100}%`);
      });

      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      });
    });
  }


  // ---------- 5. Magnetic Buttons ----------
  if (!reduced) {
    document.querySelectorAll('[data-magnetic]').forEach(btn => {
      const strength = parseFloat(btn.dataset.magnetic) || 0.25;

      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * strength;
        const dy = (e.clientY - (r.top + r.height / 2)) * strength;
        btn.style.setProperty('--mag-x', `${dx}px`);
        btn.style.setProperty('--mag-y', `${dy}px`);
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.setProperty('--mag-x', '0px');
        btn.style.setProperty('--mag-y', '0px');
      });
    });
  }
  // ---------- 6. Mobile nav toggle ----------
  const burger    = document.querySelector('.nav__burger');
  const mobileNav = document.querySelector('.nav__mobile');

  if (burger && mobileNav) {
    const open  = () => {
      burger.classList.add('is-open');
      mobileNav.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
      mobileNav.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };
    const close = () => {
      burger.classList.remove('is-open');
      mobileNav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      mobileNav.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    burger.addEventListener('click', () =>
      mobileNav.classList.contains('is-open') ? close() : open()
    );

    // Close on any link tap
    mobileNav.querySelectorAll('a').forEach(link =>
      link.addEventListener('click', close)
    );

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) close();
    });

    // Close when resizing back to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 740) close();
    });
  }

})();

import i18n from './i18n.js';

function applyLang(lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (i18n[lang]?.[key]) el.textContent = i18n[lang][key];
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.dataset.i18nHtml;
    if (i18n[lang]?.[key]) el.innerHTML = i18n[lang][key];
  });
  document.documentElement.lang = lang === 'fr' ? 'fr-CA' : 'en';
  document.querySelectorAll('.lang-label').forEach(el => {
    el.textContent = lang.toUpperCase();
  });
  document.querySelectorAll('.lang-option').forEach(btn => {
    btn.classList.toggle('lang-option--active', btn.dataset.lang === lang);
  });
  localStorage.setItem('miroia-lang', lang);
}

document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('miroia-lang') || 'fr';
  applyLang(saved);

  const trigger  = document.getElementById('lang-toggle');
  const menu     = document.getElementById('lang-menu');
  const dropdown = document.getElementById('lang-dropdown');

  function openDropdown() {
    if (!menu) return;
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    dropdown.classList.add('is-open');
  }
  function closeDropdown() {
    if (!menu) return;
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    dropdown.classList.remove('is-open');
  }

  trigger?.addEventListener('click', e => {
    e.stopPropagation();
    menu.hidden ? openDropdown() : closeDropdown();
  });

  document.querySelectorAll('.lang-option').forEach(btn => {
    btn.addEventListener('click', () => {
      applyLang(btn.dataset.lang);
      closeDropdown();
    });
  });

  document.addEventListener('click', e => {
    if (!dropdown?.contains(e.target)) closeDropdown();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDropdown();
  });
});

/* ── Carousel auto-scroll ─────────────────────── */
(function initCarouselAutoScroll() {
  const DELAY  = 4500;   // ms between auto-advances
  const RESUME = 6000;   // ms after interaction before resuming

  let autoTimer   = null;
  let resumeTimer = null;

  // The "Tout est dans le détail" carousel logic lives in an IIFE inside
  // index.html and is not reachable here. Its only externally usable advance
  // mechanism is its controls, so we advance by clicking the dot after the
  // active one (wrapping to the first), which reuses the existing goTo()
  // handler. Programmatic .click() events are isTrusted=false, so the pause()
  // guard ignores them and auto-advance never pauses itself.
  function goToNextSlide() {
    const dots = [...document.querySelectorAll('.beauty__dot')];
    if (!dots.length) return;
    const activeIdx = dots.findIndex(d => d.classList.contains('active'));
    const next = dots[(activeIdx + 1) % dots.length];
    next?.click();
  }

  function start() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => {
      goToNextSlide();
    }, DELAY);
  }

  function pause(e) {
    if (e && !e.isTrusted) return;   // ignore our own programmatic advances
    clearInterval(autoTimer);
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(start, RESUME);
  }

  function stop() {
    clearInterval(autoTimer);
    clearTimeout(resumeTimer);
  }

  // Start on load
  document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('beautyTrack');
    if (!track) return;   // carousel only exists on index.html
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    start();

    // Pause on every manual interaction (arrows + dots), alongside the
    // existing handlers — these are not replaced.
    const arrows = document.querySelectorAll('.beauty__btn');
    const dots   = document.querySelectorAll('.beauty__dot');

    [...arrows, ...dots].forEach(el => {
      el.addEventListener('click', pause, { passive: true });
    });

    // Pause while hovering the carousel section
    const section = document.querySelector('.beauty');
    section?.addEventListener('mouseenter', stop);
    section?.addEventListener('mouseleave', start);
  });
}());
