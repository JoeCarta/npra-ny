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
      // Highlight a section's link only while that section is on screen.
      var navSpy = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          navLinks.forEach(function (a) {
            if (a.getAttribute("href") === "#" + e.target.id) a.classList.toggle("active", e.isIntersecting);
          });
        });
      }, { threshold: 0.25 });
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

  /* ---- Events: shared data + date helpers (Sanity) ---------------- */
  var calIcon = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25"/></svg>';
  var clockIcon = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
  var pinIcon = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>';
  var LONG_DATE = { month: "long", day: "numeric", year: "numeric" };

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dayKey(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parseDay(key) { var p = key.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function fmtDay(key, opts) { return parseDay(key).toLocaleDateString("en-US", opts); }
  function fmtRange(start, end) {
    if (!end || end === start) return fmtDay(start, LONG_DATE);
    try { return new Intl.DateTimeFormat("en-US", LONG_DATE).formatRange(parseDay(start), parseDay(end)); }
    catch (err) { return fmtDay(start, LONG_DATE) + " – " + fmtDay(end, LONG_DATE); }
  }
  // Every calendar day an event is on: its date range plus any "also happening on" dates.
  function eventDays(e) {
    var days = [];
    var last = e.endDate && e.endDate > e.startDate ? e.endDate : e.startDate;
    for (var d = parseDay(e.startDate); dayKey(d) <= last && days.length < 92; d.setDate(d.getDate() + 1)) days.push(dayKey(d));
    (e.moreDates || []).forEach(function (k) { if (k && days.indexOf(k) < 0) days.push(k); });
    return days.sort();
  }
  function hasFlyer(e) { return !!(e.image && e.image.asset && e.image.asset._ref); }
  function flyerImg(e, width, cls, alt) {
    if (!hasFlyer(e)) return "";
    return '<img class="' + cls + '" loading="lazy" src="' + sanityImageUrl(e.image.asset._ref, width) + '" alt="' + esc(alt) + '">';
  }
  function calendarLink(day) { return "members.html?day=" + day + "#events"; }

  var eventsPromise = null;
  function loadEvents() {
    if (!eventsPromise) {
      eventsPromise = fetchJSON('*[_type=="event" && defined(startDate)]|order(startDate asc)[0...500]' +
        '{_id, title, startDate, endDate, moreDates, time, location, description, url, image{alt, asset}}')
        .then(function (data) {
          return (data.result || []).map(function (e) { e.days = eventDays(e); return e; });
        });
    }
    return eventsPromise;
  }

  function byKey(a, b) { return a.key < b.key ? -1 : a.key > b.key ? 1 : 0; }
  // Each event's next date from today on (events that are over drop off), soonest first.
  function upcomingEvents(events, limit) {
    var today = dayKey(new Date());
    return events
      .map(function (e) { return { e: e, key: e.days.filter(function (k) { return k >= today; })[0] }; })
      .filter(function (x) { return x.key; })
      .sort(byKey)
      .slice(0, limit);
  }
  // Multi-day events show their whole range; repeating ones show the given date.
  function whenLabel(e, key) {
    return e.endDate && key >= e.startDate && key <= e.endDate ? fmtRange(e.startDate, e.endDate) : fmtDay(key, LONG_DATE);
  }
  // A list row (members page + calendar month list) that opens that day's flyers.
  function eventRow(e, key, meta, past) {
    return '<button type="button" class="event-row cal-row' + (past ? " is-past" : "") + '" data-cal-day="' + key + '">' +
      '<span class="event-date-badge"><span class="month">' + esc(fmtDay(key, { month: "short" })) + '</span><span class="day">' + parseDay(key).getDate() + "</span></span>" +
      '<span class="event-row-body"><span class="event-row-title">' + esc(e.title) + '</span><span class="event-row-meta">' + esc(meta) + "</span></span>" +
      flyerImg(e, 120, "cal-row-thumb", "") +
      "</button>";
  }

  /* ---- Homepage: next three upcoming events ----------------------- */
  var eventsGrid = document.getElementById("events-grid");
  if (eventsGrid) {
    loadEvents()
      .then(function (events) {
        var upcoming = upcomingEvents(events, 3);
        if (!upcoming.length) {
          eventsGrid.innerHTML = '<p class="events-empty">Stay tuned for upcoming events.</p>';
          return;
        }
        eventsGrid.innerHTML = upcoming.map(function (x) {
          var e = x.e;
          return '<a href="' + calendarLink(x.key) + '" class="event" data-cal-day="' + x.key + '">' +
            (hasFlyer(e) ? '<div class="event-media">' + flyerImg(e, 800, "", "") + "</div>" : "") +
            '<div class="event-body"><h3>' + esc(e.title) + "</h3>" +
            '<div class="meta">' + calIcon + "<span>" + esc(whenLabel(e, x.key)) + "</span></div>" +
            (e.time ? '<div class="meta">' + clockIcon + "<span>" + esc(e.time) + "</span></div>" : "") +
            (e.location ? '<div class="meta">' + pinIcon + "<span>" + esc(e.location) + "</span></div>" : "") +
            "</div></a>";
        }).join("");
      })
      .catch(function () { eventsGrid.innerHTML = '<p class="events-empty">Events are unavailable right now — please check back soon.</p>'; });
  }

  /* ---- Members page: upcoming events list ------------------------- */
  var upcomingList = document.getElementById("upcoming-list");
  if (upcomingList) {
    loadEvents()
      .then(function (events) {
        var upcoming = upcomingEvents(events, 8);
        upcomingList.innerHTML = upcoming.length
          ? upcoming.map(function (x) {
              return eventRow(x.e, x.key, [whenLabel(x.e, x.key), x.e.time, x.e.location].filter(Boolean).join(" · "), false);
            }).join("")
          : '<p class="events-empty">No upcoming events on the calendar right now — check back soon.</p>';
      })
      .catch(function () { upcomingList.innerHTML = '<p class="events-empty">Events are unavailable right now — please check back soon.</p>'; });
  }

  /* ---- Monthly calendar (full-screen view, opened by [data-open-calendar]) --
     Month view: grid + that month's list. Day view: the day's full flyers.
     "Back to calendar" (or Escape / phone back) returns from a day to the month;
     "Close" returns to the page. ?day=YYYY-MM-DD opens straight to a day. */
  if (document.querySelector("[data-open-calendar]")) {
    var chevronLeft = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>';
    var chevronRight = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>';
    var closeX = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>';
    var weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    var calDialog = document.createElement("dialog");
    calDialog.className = "cal-dialog";
    calDialog.setAttribute("aria-labelledby", "cal-title");
    calDialog.innerHTML =
      '<div class="cal-dialog-inner">' +
        '<div class="cal-bar">' +
          '<button type="button" class="cal-bar-btn cal-back" data-cal="back" hidden>' + chevronLeft + "<span>Back to calendar</span></button>" +
          '<h2 class="cal-bar-title" id="cal-title">Events calendar</h2>' +
          '<button type="button" class="cal-bar-btn cal-close" data-cal="close">' + closeX + "<span>Close</span></button>" +
        "</div>" +
        '<div class="cal-view" data-view="month">' +
          '<div class="cal-head">' +
            '<h3 class="cal-month" aria-live="polite"></h3>' +
            '<div class="cal-nav">' +
              '<button type="button" class="btn cal-today" data-cal="today">Today</button>' +
              '<button type="button" class="cal-arrow" data-cal="prev" aria-label="Previous month">' + chevronLeft + "</button>" +
              '<button type="button" class="cal-arrow" data-cal="next" aria-label="Next month">' + chevronRight + "</button>" +
            "</div>" +
          "</div>" +
          '<table class="cal-grid"><thead><tr>' +
            weekdays.map(function (w) { return '<th scope="col"><abbr title="' + w + '">' + w.slice(0, 3) + "</abbr></th>"; }).join("") +
          "</tr></thead><tbody></tbody></table>" +
          '<h3 class="cal-list-title"></h3>' +
          '<div class="events-list cal-list"></div>' +
        "</div>" +
        '<div class="cal-view" data-view="day" hidden>' +
          '<h3 class="cal-day-title" tabindex="-1"></h3>' +
          '<div class="cal-day-body"></div>' +
          '<button type="button" class="btn cal-back-bottom" data-cal="back">' + chevronLeft + "<span>Back to calendar</span></button>" +
        "</div>" +
      "</div>";
    document.body.appendChild(calDialog);

    var q = function (sel) { return calDialog.querySelector(sel); };
    var calInner = q(".cal-dialog-inner");
    var calBack = q(".cal-back");
    var calTitle = q(".cal-bar-title");
    var monthView = q('[data-view="month"]');
    var dayView = q('[data-view="day"]');
    var calMonth = q(".cal-month");
    var calBody = q(".cal-grid tbody");
    var calListTitle = q(".cal-list-title");
    var calList = q(".cal-list");
    var dayTitle = q(".cal-day-title");
    var dayBody = q(".cal-day-body");

    var byDay = {};
    var allEvents = [];
    var calState = "loading"; // loading | ready | error
    var mode = "month";       // month | day
    var currentDay = null;
    var lastTrigger = null;
    var view = new Date();
    view.setDate(1);

    var renderMonth = function () {
      var y = view.getFullYear(), m = view.getMonth();
      var prefix = y + "-" + pad(m + 1);
      var today = dayKey(new Date());
      var monthName = view.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      calMonth.textContent = monthName;

      // Grid: blank cells before the 1st, one cell per day, blanks to finish the last week.
      var cells = [];
      for (var i = 0; i < view.getDay(); i++) cells.push('<td class="cal-out"></td>');
      var daysInMonth = new Date(y, m + 1, 0).getDate();
      for (var d = 1; d <= daysInMonth; d++) {
        var key = prefix + "-" + pad(d);
        var evs = byDay[key] || [];
        var cls = "cal-day" + (key === today ? " is-today" : "") + (key < today ? " is-past" : "") + (evs.length ? " has-events" : "");
        if (!evs.length) {
          cells.push('<td class="' + cls + '"><span class="cal-date">' + d + "</span></td>");
          continue;
        }
        var label = fmtDay(key, { weekday: "long", month: "long", day: "numeric" }) + ": " +
          evs.map(function (e) { return e.title; }).join(", ");
        cells.push('<td class="' + cls + '" data-day="' + key + '">' +
          '<button type="button" class="cal-date" aria-label="' + esc(label) + '">' + d + "</button>" +
          '<div class="cal-chips" aria-hidden="true">' + evs.map(function (e) {
            return '<span class="cal-chip">' + flyerImg(e, 80, "", "") + "<span>" + esc(e.title) + "</span></span>";
          }).join("") + "</div>" +
          '<div class="cal-dots" aria-hidden="true">' + evs.slice(0, 3).map(function () { return "<i></i>"; }).join("") + "</div>" +
          "</td>");
      }
      while (cells.length % 7) cells.push('<td class="cal-out"></td>');
      var rows = [];
      for (var r = 0; r < cells.length; r += 7) rows.push("<tr>" + cells.slice(r, r + 7).join("") + "</tr>");
      calBody.innerHTML = rows.join("");

      // List under the grid: each event happening this month, once, by its first date here.
      calListTitle.textContent = "Events in " + view.toLocaleDateString("en-US", { month: "long" });
      if (calState !== "ready") {
        calList.innerHTML = '<p class="events-empty">' + (calState === "error"
          ? "The calendar couldn’t load right now — please check back soon." : "Loading events…") + "</p>";
        return;
      }
      var inMonth = allEvents
        .map(function (e) { return { e: e, here: e.days.filter(function (k) { return k.indexOf(prefix) === 0; }) }; })
        .filter(function (x) { return x.here.length; })
        .map(function (x) { x.key = x.here[0]; return x; })
        .sort(byKey);
      calList.innerHTML = inMonth.length ? inMonth.map(function (x) {
        var e = x.e;
        var when = e.endDate ? fmtRange(e.startDate, e.endDate)
          : x.here.map(function (k) { return fmtDay(k, { weekday: "short", month: "short", day: "numeric" }); }).join(", ");
        return eventRow(e, x.key, [when, e.time, e.location].filter(Boolean).join(" · "), x.here[x.here.length - 1] < today);
      }).join("") : '<p class="events-empty">Nothing on the calendar for ' + esc(monthName) + " yet.</p>";
    };

    var renderFlyer = function (e, key) {
      var when = e.endDate ? fmtRange(e.startDate, e.endDate) : "";
      var others = e.endDate ? [] : e.days.filter(function (k) { return k !== key; });
      var also = others.length ? "Also on " + others.slice(0, 6).map(function (k) { return fmtDay(k, { month: "short", day: "numeric" }); }).join(", ") + (others.length > 6 ? "…" : "") : "";
      var buttons = [
        safeHref(e.url) ? '<a href="' + esc(e.url) + '" class="btn btn-primary" target="_blank" rel="noopener">Learn more</a>' : "",
        hasFlyer(e) ? '<a href="' + esc(sanityImageUrl(e.image.asset._ref)) + '" class="btn" target="_blank" rel="noopener">Open full flyer</a>' : ""
      ].join("");
      return '<article class="cal-flyer">' +
        flyerImg(e, 1000, "cal-flyer-img", e.image && e.image.alt ? e.image.alt : "Flyer for " + e.title) +
        '<div class="cal-flyer-info">' +
          '<h4 class="cal-flyer-title">' + esc(e.title) + "</h4>" +
          (when ? '<div class="meta">' + calIcon + "<span>" + esc(when) + "</span></div>" : "") +
          (also ? '<div class="meta">' + calIcon + "<span>" + esc(also) + "</span></div>" : "") +
          (e.time ? '<div class="meta">' + clockIcon + "<span>" + esc(e.time) + "</span></div>" : "") +
          (e.location ? '<div class="meta">' + pinIcon + "<span>" + esc(e.location) + "</span></div>" : "") +
          (e.description ? '<p class="cal-flyer-desc">' + esc(e.description) + "</p>" : "") +
          (buttons ? '<div class="cal-flyer-buttons">' + buttons + "</div>" : "") +
        "</div></article>";
    };

    // Keep ?day= in the address bar while a day is open, so it can be shared.
    var setDayParam = function (key) {
      try {
        var url = new URL(window.location.href);
        if (key) url.searchParams.set("day", key); else url.searchParams.delete("day");
        history.replaceState(null, "", url.toString());
      } catch (err) {}
    };

    var showMonth = function () {
      var fromDay = mode === "day" ? currentDay : null;
      mode = "month";
      currentDay = null;
      dayView.hidden = true;
      monthView.hidden = false;
      calBack.hidden = true;
      calTitle.hidden = false;
      renderMonth();
      setDayParam(null);
      // Coming back from a day: put focus back on that day in the grid.
      var cell = fromDay && calBody.querySelector('td[data-day="' + fromDay + '"] .cal-date');
      if (cell) cell.focus();
    };

    var showDay = function (key) {
      var evs = byDay[key];
      if (!evs || !evs.length) return false;
      mode = "day";
      currentDay = key;
      view = parseDay(key.slice(0, 8) + "01"); // "Back" lands on this day's month
      dayTitle.textContent = fmtDay(key, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      dayBody.innerHTML = evs.map(function (e) { return renderFlyer(e, key); }).join("");
      monthView.hidden = true;
      dayView.hidden = false;
      calBack.hidden = false;
      calTitle.hidden = true;
      calInner.scrollTop = 0;
      setDayParam(key);
      dayTitle.focus();
      return true;
    };

    var openCalendar = function (day, trigger) {
      lastTrigger = trigger || null;
      if (!calDialog.open) {
        if (typeof calDialog.showModal === "function") calDialog.showModal(); else calDialog.setAttribute("open", "");
      }
      if (!(day && showDay(day))) {
        if (day) view = parseDay(day.slice(0, 8) + "01");
        showMonth();
        calInner.scrollTop = 0;
      }
    };

    // Step back one level: day → month, month → closed.
    var stepBack = function () {
      if (mode === "day") showMonth(); else calDialog.close();
    };

    document.addEventListener("click", function (ev) {
      var opener = ev.target.closest("[data-open-calendar]");
      if (opener) { ev.preventDefault(); openCalendar(null, opener); return; }
      var dayLink = ev.target.closest("[data-cal-day]");
      if (!dayLink) return;
      ev.preventDefault();
      var key = dayLink.getAttribute("data-cal-day");
      if (calDialog.open) showDay(key); else openCalendar(key, dayLink);
    });

    calDialog.addEventListener("click", function (ev) {
      if (ev.target === calDialog) { calDialog.close(); return; } // dimmed backdrop (desktop)
      var btn = ev.target.closest("[data-cal]");
      if (btn) {
        var act = btn.getAttribute("data-cal");
        if (act === "close") calDialog.close();
        else if (act === "back") showMonth();
        else {
          if (act === "prev") view.setMonth(view.getMonth() - 1);
          else if (act === "next") view.setMonth(view.getMonth() + 1);
          else if (act === "today") { view = new Date(); view.setDate(1); }
          renderMonth();
        }
        return;
      }
      var cell = ev.target.closest("td.has-events");
      if (cell) showDay(cell.getAttribute("data-day"));
    });

    // Escape and the phone back gesture step back instead of always closing.
    calDialog.addEventListener("cancel", function (ev) {
      if (mode === "day") { ev.preventDefault(); showMonth(); }
    });
    calDialog.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && calDialog.open) { ev.preventDefault(); stepBack(); }
    });
    calDialog.addEventListener("close", function () {
      mode = "month";
      setDayParam(null);
      if (lastTrigger && document.body.contains(lastTrigger)) lastTrigger.focus();
    });

    var linkedDay = new URLSearchParams(window.location.search).get("day");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(linkedDay || "")) linkedDay = null;

    loadEvents()
      .then(function (events) {
        allEvents = events;
        events.forEach(function (e) {
          e.days.forEach(function (k) { (byDay[k] = byDay[k] || []).push(e); });
        });
        calState = "ready";
        if (linkedDay) openCalendar(linkedDay, null);
        else if (calDialog.open && mode === "month") renderMonth();
      })
      .catch(function () {
        calState = "error";
        if (calDialog.open && mode === "month") renderMonth();
      });
  }

  /* ---- Homepage: team subtext (Sanity siteSettings) --------------- */
  var teamSubtext = document.getElementById("team-subtext");
  if (teamSubtext) {
    fetchJSON('*[_type=="siteSettings"][0]')
      .then(function (data) { if (data.result && data.result.subtext) teamSubtext.textContent = data.result.subtext; })
      .catch(function () {});
  }

  /* ---- Newsletter archive + homepage recent issues (Sanity) ------- */
  var ISSUE_CARD_FIELDS = '{_id, title, "slug": slug.current, issueNumber, publishedAt, summary, tags, link}';

  // Every issue has its own page (server-rendered, so its full text is searchable).
  function issueLink(n) {
    if (n.slug) return '<a href="/la-agenda/' + encodeURIComponent(n.slug) + '" class="nl-archive-link">Read the full issue &rarr;</a>';
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
})();
