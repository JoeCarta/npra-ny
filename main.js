// Stacking Cards controller (scoped per .sc-viewport, supports multiple instances)
    (function () {
      const viewports = Array.from(document.querySelectorAll(".sc-viewport"));
      if (!viewports.length) return;

      const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
      const lerp = (a, b, t) => a + (b - a) * t;

      viewports.forEach((viewport) => {
        const cards = Array.from(viewport.querySelectorAll(".sc-card"));
        const fill = viewport.querySelector(".sc-progress__fill");
        const idxEl = viewport.querySelector(".sc-progress__idx");
        const totalEl = viewport.querySelector(".sc-progress__total");

        const total = cards.length;
        if (totalEl) totalEl.textContent = String(total);

        // Card bg from data-bg
        cards.forEach((c) => {
          const bg = c.getAttribute("data-bg");
          if (bg) c.style.setProperty("--sc-card-bg", bg);
        });

        let progress = 0;
        let target = 0;

        // Tuning
        const WHEEL_SENS = 0.0017;
        const DRAG_SENS = 0.0062;
        const SNAP_SPEED = 0.14;
        const STACK_DEPTH = 4;

        let hoverActive = false;
        let dragging = false;
        let startY = 0;

        function setProgressUI(p) {
          const i = Math.round(p);
          if (idxEl) idxEl.textContent = String(i + 1);
          if (fill) fill.style.width = ((p / Math.max(1, total - 1)) * 100).toFixed(2) + "%";
        }

        function render(p) {
          setProgressUI(p);

          for (let i = 0; i < total; i++) {
            const card = cards[i];
            const d = i - p; // 0 active; >0 upcoming; <0 past
            const isPast = d < -0.25;
            const depth = clamp(d, -1, STACK_DEPTH);

            let y = 0, scale = 1, rot = 0, opacity = 1, blur = 0;

            if (isPast) {
              const t = clamp((-d - 0.25) / 0.9, 0, 1);
              y = lerp(0, -160, t);
              scale = lerp(1, 0.965, t);
              rot = lerp(0, -5, t);
              opacity = lerp(1, 0, t);
              blur = lerp(0, 6, t);
              card.style.zIndex = String(100 - i);
              card.style.pointerEvents = "none";
            } else {
              const t = clamp(depth, 0, STACK_DEPTH);
              y = t * 12;
              scale = 1 - t * 0.04;
              rot = t * 0.75;
              opacity = 1 - t * 0.12;
              blur = t * 0.6;
              card.style.zIndex = String(1000 - i);
              card.style.pointerEvents = (Math.abs(d) < 0.6) ? "auto" : "none";
            }

            card.style.opacity = opacity.toFixed(3);
            card.style.filter = "blur(" + blur.toFixed(2) + "px)";
            card.style.transform =
              "translate3d(0," + y.toFixed(2) + "px,0) " +
              "scale(" + scale.toFixed(4) + ") " +
              "rotate(" + rot.toFixed(2) + "deg)";
          }
        }

        function animate() {
          progress = lerp(progress, target, SNAP_SPEED);
          if (Math.abs(progress - target) < 0.001) progress = target;
          render(progress);
          requestAnimationFrame(animate);
        }

        function nudgeTarget(delta) {
          target = clamp(target + delta, 0, total - 1);
        }

        viewport.addEventListener("mouseenter", () => {
          hoverActive = true;
          viewport.classList.add("sc-active");
        });
        viewport.addEventListener("mouseleave", () => {
          hoverActive = false;
          viewport.classList.remove("sc-active");
        });
        viewport.addEventListener("focusin", () => {
          hoverActive = true;
          viewport.classList.add("sc-active");
        });
        viewport.addEventListener("focusout", () => {
          hoverActive = false;
          viewport.classList.remove("sc-active");
        });

        viewport.addEventListener("wheel", (e) => {
          if (!hoverActive) return;
          e.preventDefault();
          nudgeTarget(e.deltaY * WHEEL_SENS);
        }, { passive: false });

        viewport.addEventListener("pointerdown", (e) => {
          dragging = true;
          startY = e.clientY;
          viewport.setPointerCapture(e.pointerId);
        });

        viewport.addEventListener("pointermove", (e) => {
          if (!dragging) return;
          const dy = e.clientY - startY;
          startY = e.clientY;
          nudgeTarget(-dy * DRAG_SENS);
        });

        function endDrag(e) {
          if (!dragging) return;
          dragging = false;
          target = clamp(Math.round(target), 0, total - 1);
          try { viewport.releasePointerCapture(e.pointerId); } catch {}
        }

        viewport.addEventListener("pointerup", endDrag);
        viewport.addEventListener("pointercancel", endDrag);

        viewport.addEventListener("keydown", (e) => {
          if (e.key === "ArrowDown" || e.key === "PageDown") {
            e.preventDefault();
            target = clamp(Math.round(target + 1), 0, total - 1);
          }
          if (e.key === "ArrowUp" || e.key === "PageUp") {
            e.preventDefault();
            target = clamp(Math.round(target - 1), 0, total - 1);
          }
          if (e.key === "Home") { e.preventDefault(); target = 0; }
          if (e.key === "End") { e.preventDefault(); target = total - 1; }
        });

        target = 0;
        progress = 0;
        render(progress);
        requestAnimationFrame(animate);
      });
    })();
    
// Team card tap-to-open (touch / click)
    (function () {
      const cards = Array.from(document.querySelectorAll('.tc-card'));
      if (!cards.length) return;

      cards.forEach(card => {
        card.addEventListener('click', () => {
          const isOpen = card.classList.contains('open');
          // Close all others
          cards.forEach(c => c.classList.remove('open'));
          if (!isOpen) card.classList.add('open');
        });
        // Keyboard support
        card.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            card.click();
          }
          if (e.key === 'Escape') card.classList.remove('open');
        });
      });

      // Click outside closes all
      document.addEventListener('click', e => {
        if (!e.target.closest('.tc-card')) {
          cards.forEach(c => c.classList.remove('open'));
        }
      });
    })();

// Mobile menu
    function toggleMobileMenu(){
      const drawer = document.getElementById('mobile-drawer');
      const menuIcon = document.getElementById('menu-icon');
      const closeIcon = document.getElementById('close-icon');

      drawer.classList.toggle('active');
      const open = drawer.classList.contains('active');
      menuIcon.style.display = open ? 'none' : 'block';
      closeIcon.style.display = open ? 'block' : 'none';
    }
    function closeMobileMenu(){
      const drawer = document.getElementById('mobile-drawer');
      const menuIcon = document.getElementById('menu-icon');
      const closeIcon = document.getElementById('close-icon');

      drawer.classList.remove('active');
      menuIcon.style.display = 'block';
      closeIcon.style.display = 'none';
    }

    // Newsletter
    function handleNewsletterSubmit(e){
      e.preventDefault();
      const email = e.target.querySelector('input[type="email"]').value;
      alert("Thank you for subscribing! We'll keep you updated at: " + email);
      e.target.reset();
    }

    // Glass navbar + minimal hero parallax
    const header = document.getElementById('header');
    const heroBg = document.getElementById('heroBg');

    function onScroll(){
      const y = window.scrollY || 0;
      header.classList.toggle('scrolled', y > 18);

      if (heroBg){
        const t = Math.min(y * 0.31, 226);
        heroBg.style.transform = `scale(1.06) translateY(${t}px)`;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Subtle reveal (single style)
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReduced && 'IntersectionObserver' in window){
      const revealObs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting){
            entry.target.classList.add('in');
            revealObs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });

      document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));
    } else {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
    }

    // --- Initiatives sidebar: closest to viewport center ---
    const tocLinks = Array.from(document.querySelectorAll('.toc-link'));
    const initSections = Array.from(document.querySelectorAll('.initiative-observe'));

    function setActiveToc(id){
      tocLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
    }

    function closestSectionToCenter() {
      const centerY = window.innerHeight / 2;

      let best = null;       // { id, dist }
      for (const sec of initSections) {
        const r = sec.getBoundingClientRect();

        // Choose the section point you care about:
        // - midpoint of section
        const secMid = (r.top + r.bottom) / 2;

        const dist = Math.abs(secMid - centerY);

        if (!best || dist < best.dist) {
          best = { id: sec.id, dist };
        }
      }

      if (best) setActiveToc(best.id);
    }

    // Throttle with rAF so it’s cheap even on fast scroll
    let ticking = false;
    function onScrollSpy() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        closestSectionToCenter();
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScrollSpy, { passive: true });
    window.addEventListener('resize', onScrollSpy);
    // run once on load
    closestSectionToCenter();

    // Optional: clicking a TOC item locks active state briefly while smooth scrolling
    tocLinks.forEach(a => {
      a.addEventListener('click', () => {
        const id = a.getAttribute('href').slice(1);
        setActiveToc(id);
        // after scroll settles, scrollspy will take over automatically
      });
    });

    // Top nav active state
    const navLinks = Array.from(document.querySelectorAll('.nav a'));
    const targets = navLinks
      .map(a => { try { const h = a.getAttribute('href'); return h?.startsWith('#') ? document.querySelector(h) : null; } catch(e) { return null; } })
      .filter(Boolean);

    if ('IntersectionObserver' in window){
      const navSpy = new IntersectionObserver((entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a,b) => (b.intersectionRatio - a.intersectionRatio))[0];

        if (visible && visible.target && visible.target.id){
          navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + visible.target.id));
        }
      }, { threshold: [0.25, 0.45] });

      targets.forEach(s => navSpy.observe(s));
    }