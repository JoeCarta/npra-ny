/* =====================================================================
   NPRA New York Chapter — site scripts (single source of truth)
   ===================================================================== */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SANITY = "https://nn3j1n98.api.sanity.io/v2021-10-21/data/query/production?query=";

  /* ---- Mobile menu (exposed for inline handlers) ------------------ */
  function setMenu(open) {
    var drawer = document.getElementById("mobile-drawer");
    var menuIcon = document.getElementById("menu-icon");
    var closeIcon = document.getElementById("close-icon");
    if (!drawer) return;
    drawer.classList.toggle("active", open);
    if (menuIcon) menuIcon.style.display = open ? "none" : "block";
    if (closeIcon) closeIcon.style.display = open ? "block" : "none";
    var btn = document.querySelector(".mobile-btn");
    if (btn) btn.setAttribute("aria-expanded", String(open));
  }
  window.toggleMobileMenu = function () {
    var drawer = document.getElementById("mobile-drawer");
    setMenu(!(drawer && drawer.classList.contains("active")));
  };
  window.closeMobileMenu = function () { setMenu(false); };

  /* ---- Sticky header shadow --------------------------------------- */
  var header = document.getElementById("header");
  function onScroll() {
    if (header) header.classList.toggle("scrolled", (window.scrollY || 0) > 18);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Reveal on scroll (content is visible by default) ----------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); obs.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { obs.observe(el); });
  }

  /* ---- Top-nav active spy (homepage section anchors) -------------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav a[href^='#']"));
  if (navLinks.length && "IntersectionObserver" in window) {
    var targets = navLinks
      .map(function (a) { return document.querySelector(a.getAttribute("href")); })
      .filter(Boolean);
    if (targets.length) {
      var navSpy = new IntersectionObserver(function (entries) {
        var visible = entries.filter(function (e) { return e.isIntersecting; })
          .sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; })[0];
        if (visible && visible.target.id) {
          navLinks.forEach(function (a) {
            a.classList.toggle("active", a.getAttribute("href") === "#" + visible.target.id);
          });
        }
      }, { threshold: [0.25, 0.5] });
      targets.forEach(function (s) { navSpy.observe(s); });
    }
  }

  /* ---- Team / board cards: tap-to-open ---------------------------- */
  var cards = Array.prototype.slice.call(document.querySelectorAll(".tc-card"));
  if (cards.length) {
    cards.forEach(function (card) {
      card.addEventListener("click", function () {
        var isOpen = card.classList.contains("open");
        cards.forEach(function (c) { c.classList.remove("open"); });
        if (!isOpen) card.classList.add("open");
      });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); card.click(); }
        if (e.key === "Escape") card.classList.remove("open");
      });
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".tc-card")) cards.forEach(function (c) { c.classList.remove("open"); });
    });
  }

  /* ---- Form success states ---------------------------------------- */
  function showSuccess(form, msg) {
    var note = form.querySelector(".form-success, .join-success");
    if (!note) {
      note = document.createElement("p");
      note.className = form.classList.contains("field-grid") ? "join-success" : "form-success";
      note.setAttribute("role", "status");
      form.appendChild(note);
    }
    note.textContent = msg;
    form.reset();
  }
  window.handleNewsletterSubmit = function (e) {
    e.preventDefault();
    var email = (e.target.querySelector('input[type="email"]') || {}).value || "";
    showSuccess(e.target, "Gracias! You're subscribed — La Agenda-NY will arrive at " + email + ".");
  };
  window.handleJoinSubmit = function (e) {
    e.preventDefault();
    var first = (e.target.querySelector("#join-first") || {}).value || "";
    showSuccess(e.target, "Thank you" + (first ? ", " + first : "") + "! Your application is in. A chapter organizer will follow up soon.");
  };
  window.selectAmount = function (btn) {
    document.querySelectorAll(".donate-amount").forEach(function (b) { b.classList.remove("selected"); });
    btn.classList.add("selected");
  };

  /* ---- Sanity: image URL helper ----------------------------------- */
  function sanityImageUrl(ref) {
    if (!ref) return "";
    var m = ref.match(/^image-(.+)-(\d+x\d+)-(\w+)$/);
    if (!m) return "";
    return "https://cdn.sanity.io/images/nn3j1n98/production/" + m[1] + "-" + m[2] + "." + m[3];
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fetchJSON(query) {
    return fetch(SANITY + encodeURIComponent(query)).then(function (r) { return r.json(); });
  }
  function fmtMonthYear(iso) {
    if (!iso) return "";
    try {
      return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } catch (e) { return iso; }
  }

  /* ---- Homepage: events grid (Sanity) ----------------------------- */
  var eventsGrid = document.getElementById("events-grid");
  if (eventsGrid) {
    var calIcon = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25"/></svg>';
    var pinIcon = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>';
    fetchJSON('*[_type=="event"]|order(date)')
      .then(function (data) {
        var result = data.result;
        if (!result || !result.length) {
          eventsGrid.innerHTML = '<p class="events-empty">Stay tuned for upcoming events.</p>';
          return;
        }
        eventsGrid.innerHTML = result.map(function (e) {
          var img = e.image && e.image.asset && e.image.asset._ref
            ? '<div class="event-media"><img loading="lazy" src="' + sanityImageUrl(e.image.asset._ref) + '" alt="' + esc(e.title) + '"></div>' : "";
          return '<a href="' + esc(e.url || "#") + '" class="event">' + img +
            '<div class="event-body"><h3>' + esc(e.title) + "</h3>" +
            (e.date ? '<div class="meta">' + calIcon + "<span>" + esc(e.date) + "</span></div>" : "") +
            (e.location ? '<div class="meta">' + pinIcon + "<span>" + esc(e.location) + "</span></div>" : "") +
            "</div></a>";
        }).join("");
      })
      .catch(function () { eventsGrid.innerHTML = '<p class="events-empty">Events are unavailable right now — please check back soon.</p>'; });
  }

  /* ---- Homepage: team subtext (Sanity siteSettings) --------------- */
  var teamSubtext = document.getElementById("team-subtext");
  if (teamSubtext) {
    fetchJSON('*[_type=="siteSettings"][0]')
      .then(function (data) { if (data.result && data.result.subtext) teamSubtext.textContent = data.result.subtext; })
      .catch(function () {});
  }

  /* ---- Newsletter archive + homepage recent issues (Sanity) ------- */
  function renderIssue(n, featured) {
    return '<article class="nl-archive-card' + (featured ? " nl-featured" : "") + '">' +
      '<div class="nl-archive-meta">' +
        '<span class="nl-archive-date">' + esc(fmtMonthYear(n.publishedAt)) + "</span>" +
        (n.issueNumber ? '<span class="nl-archive-issue">NYC Chapter · Issue #' + esc(n.issueNumber) + "</span>" : "") +
      "</div>" +
      '<h2 class="nl-archive-title">' + esc(n.title) + "</h2>" +
      (n.body ? '<p class="nl-archive-body">' + esc(n.body) + "</p>" : "") +
      (n.tags && n.tags.length ? '<div class="nl-archive-tags">' + n.tags.map(function (t) { return '<span class="nl-archive-tag">' + esc(t) + "</span>"; }).join("") + "</div>" : "") +
      (n.link ? '<a href="' + esc(n.link) + '" class="nl-archive-link" target="_blank" rel="noopener">Read full issue &rarr;</a>' : "") +
      "</article>";
  }

  var nlGrid = document.getElementById("nl-archive-grid");
  if (nlGrid) {
    fetchJSON('*[_type=="newsletter"]|order(publishedAt desc)')
      .then(function (data) {
        var result = data.result;
        if (!result || !result.length) {
          nlGrid.innerHTML = '<p class="nl-archive-empty">No issues yet — check back soon.</p>';
          return;
        }
        nlGrid.innerHTML = result.map(function (n, i) { return renderIssue(n, i === 0); }).join("");
      })
      .catch(function () { nlGrid.innerHTML = '<p class="nl-archive-empty">Unable to load issues — please try again later.</p>'; });
  }

  var nlRecent = document.getElementById("nl-recent");
  if (nlRecent) {
    fetchJSON('*[_type=="newsletter"]|order(publishedAt desc)[0...3]')
      .then(function (data) {
        var result = data.result;
        // Keep the static featured card if there's nothing to show.
        if (!result || !result.length) return;
        nlRecent.innerHTML = result.map(function (n, i) { return renderIssue(n, i === 0); }).join("");
      })
      .catch(function () {});
  }
})();
