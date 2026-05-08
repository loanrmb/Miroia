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
})();
