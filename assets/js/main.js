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

  if (navLinks.length) {
    var sections = navLinks
      .map(function (link) {
        return document.querySelector(link.getAttribute("href"));
      })
      .filter(Boolean);

    var currentId = null;

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

    // Position-based: highlight whichever section sits under the reading
    // line (~42% of the viewport). Deterministic across instant jumps and
    // scroll restoration, where an intersection-band spy can go stale
    // (no section in the band -> nothing ever updates).
    var updateSpy = function () {
      var line = window.scrollY + window.innerHeight * 0.42;
      var next = null;
      for (var i = 0; i < sections.length; i++) {
        var top = sections[i].offsetTop;
        if (line >= top && line < top + sections[i].offsetHeight) {
          next = sections[i].id;
          break;
        }
      }
      if (next !== currentId) {
        currentId = next;
        setActive(next);
      }
    };

    window.addEventListener("scroll", updateSpy, { passive: true });
    updateSpy();
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
     Project previews — muted loops play while in view, pause offscreen.

     These are content previews (equivalent to the animated GIFs the site
     previously shipped), so they are not gated behind prefers-reduced-motion;
     that preference still governs the reveal/transition animations above.
     ---------------------------------------------------------------------- */
  var previews = document.querySelectorAll(".plate__media video");

  if (previews.length && "IntersectionObserver" in window) {
    var player = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var attempt = entry.target.play();
            if (attempt && typeof attempt.catch === "function") {
              attempt.catch(function () {
                /* autoplay blocked — poster stays until the user interacts */
              });
            }
          } else {
            entry.target.pause();
          }
        });
      },
      { threshold: 0.25 }
    );

    previews.forEach(function (video) {
      video.pause(); // avoid all three playing from page load until observed
      player.observe(video);
    });
  }
})();
