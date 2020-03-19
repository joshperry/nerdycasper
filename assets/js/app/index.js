/*
 * Load common list page logic
 */
require(['app/lists-common'])

/**
 * Index page logic
 */
require(['jquery'], ($) => {
  // TODO: Update to use waypoints.js
  // Show top nav when hero scrolls out of view
  $(() => {
    const nav = document.querySelector('.site-nav-main .site-nav');
    const feed = document.querySelector('.post-feed');

    var lastScrollY = window.scrollY;
    var lastWindowHeight = window.innerHeight;
    var lastDocumentHeight = $(document).height();
    var ticking = false;

    function onScroll() {
      lastScrollY = window.scrollY;
      requestTick();
    }

    function onResize() {
      lastWindowHeight = window.innerHeight;
      lastDocumentHeight = $(document).height();
      requestTick();
    }

    function requestTick() {
      if (!ticking) {
        requestAnimationFrame(update)
      }
      ticking = true
    }

    function update() {
      const trigger = feed.getBoundingClientRect().top + window.scrollY
      const progressMax = lastDocumentHeight - lastWindowHeight

      // show/hide nav
      if (lastScrollY >= trigger - 20) {
        nav.classList.add('fixed-nav-active')
      } else {
        nav.classList.remove('fixed-nav-active')
      }

      ticking = false
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, false)

    update()
  })
})
