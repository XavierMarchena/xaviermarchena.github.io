/* ==========================================================================
   Xavier Marchena — Portfolio
   Navigation, scroll-spy, reveal-on-scroll, media preferences
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------------------
     Sticky nav shadow
     ---------------------------------------------------------------------- */
  var nav = document.querySelector(".site-nav");

  function onScroll() {
    if (nav) {
      nav.classList.toggle("is-stuck", window.scrollY > 8);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ----------------------------------------------------------------------
     Mobile menu
     ---------------------------------------------------------------------- */
  var toggle = document.querySelector(".site-nav__toggle");
  var menu = document.getElementById("primary-menu");

  function closeMenu() {
    if (!toggle || !menu) return;
    toggle.setAttribute("aria-expanded", "false");
    menu.classList.remove("is-open");
  }

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      menu.classList.toggle("is-open", !open);
    });

    // Close after choosing a link
    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeMenu();
    });

    // Close on Escape
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu();
    });

    // Reset state when resizing up to desktop
    window.addEventListener("resize", function () {
      if (window.innerWidth > 768) closeMenu();
    });
  }

  /* ----------------------------------------------------------------------
     Scroll-spy — highlight the section in view
     ---------------------------------------------------------------------- */
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll(".site-nav__links a[href^='#']")
  );

  if ("IntersectionObserver" in window && navLinks.length) {
    var sections = navLinks
      .map(function (link) {
        return document.querySelector(link.getAttribute("href"));
      })
      .filter(Boolean);

    var setActive = function (id) {
      navLinks.forEach(function (link) {
        var active = link.getAttribute("href") === "#" + id;
        link.classList.toggle("is-active", active);
        if (active) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    };

    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );

    sections.forEach(function (section) {
      spy.observe(section);
    });
  }

  /* ----------------------------------------------------------------------
     Reveal-on-scroll
     ---------------------------------------------------------------------- */
  var revealables = document.querySelectorAll(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var revealer = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );

    revealables.forEach(function (el) {
      revealer.observe(el);
    });
  }

  /* ----------------------------------------------------------------------
     Respect reduced motion for autoplaying project videos
     ---------------------------------------------------------------------- */
  if (reduceMotion) {
    document.querySelectorAll("video[autoplay]").forEach(function (video) {
      video.removeAttribute("autoplay");
      video.pause();
    });
  }
})();
