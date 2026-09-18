/* =====================================================================
   NPRA New York Chapter — site scripts (single source of truth)
   ===================================================================== */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // API CDN: fast cached reads that refresh automatically when content is published.
  var SANITY = "https://nn3j1n98.apicdn.sanity.io/v2025-02-19/data/query/production?query=";

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

  /* ---- Sanity: helpers -------------------------------------------- */
  function sanityImageUrl(ref, width) {
    if (!ref) return "";
    var m = ref.match(/^image-(.+)-(\d+x\d+)-(\w+)$/);
    if (!m) return "";
    return "https://cdn.sanity.io/images/nn3j1n98/production/" + m[1] + "-" + m[2] + "." + m[3] +
      (width ? "?w=" + width + "&fit=max&auto=format" : "");
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fetchJSON(query, params) {
    var url = SANITY + encodeURIComponent(query);
    Object.keys(params || {}).forEach(function (k) {
      url += "&" + encodeURIComponent("$" + k) + "=" + encodeURIComponent(JSON.stringify(params[k]));
    });
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("Sanity request failed: " + r.status);
      return r.json();
    });
  }
  function fmtDate(iso, withDay) {
    if (!iso) return "";
    try {
      var opts = withDay ? { month: "long", day: "numeric", year: "numeric" } : { month: "long", year: "numeric" };
      return new Date(iso + "T12:00:00").toLocaleDateString("en-US", opts);
    } catch (e) { return iso; }
  }
  function safeHref(href) {
    return /^(https?:|mailto:|tel:)/i.test(href || "") ? href : "";
  }

  /* ---- Portable Text (rich text from the Studio) → HTML ----------- */
  function renderSpans(children, markDefs) {
    var defs = {};
    (markDefs || []).forEach(function (d) { defs[d._key] = d; });
    return (children || []).map(function (span) {
      var out = esc(span.text).replace(/\n/g, "<br>");
      (span.marks || []).forEach(function (mark) {
        if (mark === "strong") out = "<strong>" + out + "</strong>";
        else if (mark === "em") out = "<em>" + out + "</em>";
        else if (defs[mark] && defs[mark]._type === "link") {
          var href = safeHref(defs[mark].href);
          if (!href) return;
          var external = /^https?:/i.test(href);
          out = '<a href="' + esc(href) + '"' + (external ? ' target="_blank" rel="noopener"' : "") + ">" + out + "</a>";
        }
      });
      return out;
    }).join("");
  }
  function renderPortableText(blocks) {
    var html = "";
    var openList = null;
    var blockTags = { h2: "h2", h3: "h3", blockquote: "blockquote" };
    (blocks || []).forEach(function (b) {
      var listTag = b._type === "block" && b.listItem ? (b.listItem === "number" ? "ol" : "ul") : null;
      if (openList && openList !== listTag) { html += "</" + openList + ">"; openList = null; }
      if (listTag && !openList) { html += "<" + listTag + ">"; openList = listTag; }

      if (b._type === "block") {
        var inner = renderSpans(b.children, b.markDefs);
        if (listTag) { html += "<li>" + inner + "</li>"; return; }
        if (!inner.replace(/<br>/g, "").trim()) return; // skip empty paragraphs
        var tag = blockTags[b.style] || "p";
        html += "<" + tag + ">" + inner + "</" + tag + ">";
      } else if (b._type === "image" && b.asset && b.asset._ref) {
        html += '<figure><img loading="lazy" src="' + sanityImageUrl(b.asset._ref, 1400) + '" alt="' + esc(b.alt) + '">' +
          (b.caption ? "<figcaption>" + esc(b.caption) + "</figcaption>" : "") + "</figure>";
      }
    });
    if (openList) html += "</" + openList + ">";
    return html;
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
  var ISSUE_CARD_FIELDS = '{_id, title, "slug": slug.current, issueNumber, publishedAt, summary, tags, link, ' +
    '"hasArticle": count(article) > 0, "pdfUrl": pdf.asset->url}';

  // Where "Read" goes: the full article on our site, else the PDF, else an outside link.
  function issueLink(n) {
    if (n.hasArticle && n.slug) return '<a href="issue.html?i=' + encodeURIComponent(n.slug) + '" class="nl-archive-link">Read the full issue &rarr;</a>';
    if (n.pdfUrl) return '<a href="' + esc(n.pdfUrl) + '" class="nl-archive-link" target="_blank" rel="noopener">Read the PDF &rarr;</a>';
    if (safeHref(n.link)) return '<a href="' + esc(n.link) + '" class="nl-archive-link" target="_blank" rel="noopener">Read full issue &rarr;</a>';
    return "";
  }
  function renderTags(tags) {
    return tags && tags.length
      ? '<div class="nl-archive-tags">' + tags.map(function (t) { return '<span class="nl-archive-tag">' + esc(t) + "</span>"; }).join("") + "</div>"
      : "";
  }
  function renderIssue(n, featured) {
    return '<article class="nl-archive-card' + (featured ? " nl-featured" : "") + '">' +
      '<div class="nl-archive-meta">' +
        '<span class="nl-archive-date">' + esc(fmtDate(n.publishedAt)) + "</span>" +
        (n.issueNumber ? '<span class="nl-archive-issue">NYC Chapter · Issue #' + esc(n.issueNumber) + "</span>" : "") +
      "</div>" +
      '<h2 class="nl-archive-title">' + esc(n.title) + "</h2>" +
      (n.summary ? '<p class="nl-archive-body">' + esc(n.summary) + "</p>" : "") +
      renderTags(n.tags) +
      issueLink(n) +
      "</article>";
  }

  var nlGrid = document.getElementById("nl-archive-grid");
  if (nlGrid) {
    fetchJSON('*[_type=="newsletter"]|order(publishedAt desc)' + ISSUE_CARD_FIELDS)
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
    fetchJSON('*[_type=="newsletter"]|order(publishedAt desc)[0...3]' + ISSUE_CARD_FIELDS)
      .then(function (data) {
        var result = data.result;
        // Keep the static featured card if there's nothing to show.
        if (!result || !result.length) return;
        nlRecent.innerHTML = result.map(function (n, i) { return renderIssue(n, i === 0); }).join("");
      })
      .catch(function () {});
  }

  /* ---- Single issue page (issue.html?i=<page link>) --------------- */
  var issueHeader = document.getElementById("issue-header");
  var issueBody = document.getElementById("issue-body");
  if (issueHeader && issueBody) {
    var eyebrow = '<div class="eyebrow"><a href="newsletter.html" class="issue-eyebrow-link">La Agenda&#8209;NY</a></div>';
    var backLink = '<a href="newsletter.html" class="nl-archive-link issue-back">&larr; All issues</a>';
    var showMissing = function (heading, msg) {
      issueHeader.removeAttribute("aria-busy");
      issueHeader.innerHTML = eyebrow + '<h1 class="page-title issue-title">' + heading + "</h1>";
      issueBody.innerHTML = '<p class="lead">' + msg + "</p>" + '<div class="issue-actions">' + backLink + "</div>";
    };
    var slug = new URLSearchParams(window.location.search).get("i");
    if (!slug) {
      showMissing("Issue not found", "This link is missing the issue it points to.");
    } else {
      fetchJSON(
        '*[_type=="newsletter" && slug.current==$slug][0]{title, issueNumber, publishedAt, author, summary, tags, link, ' +
        'coverImage{alt, asset}, article, "pdfUrl": pdf.asset->url}',
        { slug: slug }
      )
        .then(function (data) {
          var n = data.result;
          if (!n) {
            showMissing("Issue not found", "We couldn’t find that issue. It may not be published yet, or its link may have changed.");
            return;
          }
          document.title = n.title + " — La Agenda-NY";
          var metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc && n.summary) metaDesc.setAttribute("content", n.summary);

          var meta = [
            n.publishedAt ? '<span class="issue-date">' + esc(fmtDate(n.publishedAt, true)) + "</span>" : "",
            n.issueNumber ? "<span>Issue #" + esc(n.issueNumber) + "</span>" : "",
            n.author ? "<span>By " + esc(n.author) + "</span>" : ""
          ].join("");
          issueHeader.removeAttribute("aria-busy");
          issueHeader.innerHTML = eyebrow +
            '<h1 class="page-title issue-title">' + esc(n.title) + "</h1>" +
            (meta ? '<p class="issue-meta">' + meta + "</p>" : "") +
            (n.summary ? '<p class="lead">' + esc(n.summary) + "</p>" : "");

          var cover = n.coverImage && n.coverImage.asset && n.coverImage.asset._ref
            ? '<figure class="issue-cover"><img src="' + sanityImageUrl(n.coverImage.asset._ref, 1600) + '" alt="' + esc(n.coverImage.alt) + '"></figure>'
            : "";
          var actions = [
            n.pdfUrl ? '<a href="' + esc(n.pdfUrl) + '" class="btn btn-primary" target="_blank" rel="noopener">Read the PDF</a>' : "",
            safeHref(n.link) ? '<a href="' + esc(n.link) + '" class="btn" target="_blank" rel="noopener">View this issue online</a>' : ""
          ].join("");
          issueBody.innerHTML = cover +
            '<div class="prose">' + renderPortableText(n.article) + "</div>" +
            (actions ? '<div class="issue-buttons">' + actions + "</div>" : "") +
            '<div class="issue-actions">' + renderTags(n.tags) + backLink + "</div>";
        })
        .catch(function () {
          showMissing("Couldn’t load this issue", "This issue couldn’t load right now. Please try again in a moment.");
        });
    }
  }
})();
