/**
 * Load shared content view logic
 */
require(['app/content-common'])

/**
 * Post specific logic
 */
require([], () => {
  // Replace nav with title on scroll
  stickyNavTitle({
    navSelector: '.site-nav-main',
    titleSelector: '.post-full-title',
    activeClass: 'nav-post-title-active'
  })

  // Show author card when avatar is hovered
  document.querySelectorAll('.author-list-item')
    .forEach(authorel => {
      let card
      authorel.addEventListener('mouseover', () => {
        // Add the hover class to the target card
        card = card || authorel.querySelector('.author-card')
        card.classList.add('hovered')
      })

      authorel.addEventListener('mouseout', () => {
        // Hide the hover after a timeout
        setTimeout(
          () => card.classList.remove('hovered'),
          800
        )
      })
    })

  /**
   * Nav/Title replacement
   *
   * Displays the post title in place of the nav bar when scrolling past the title
   *
   * Usage:
   * ```
   * stickyTitle({
   *     navSelector: '.site-nav-main',
   *     titleSelector: '.post-full-title',
   *     activeClass: 'nav-post-title-active'
   * });
   * ```
   */
  function stickyNavTitle(options) {
    const nav = document.querySelector(options.navSelector)
    const title = document.querySelector(options.titleSelector)

    var lastScrollY = window.scrollY
    var ticking = false

    function onScroll() {
      lastScrollY = window.scrollY
      requestTick()
    }

    function requestTick() {
      if (!ticking) {
        requestAnimationFrame(update)
      }
      ticking = true
    }

    function update() {
      const trigger = title.getBoundingClientRect().top + window.scrollY
      const triggerOffset = title.offsetHeight + 35

      // show/hide post title
      if (lastScrollY >= trigger + triggerOffset) {
        nav.classList.add(options.activeClass)
      } else {
        nav.classList.remove(options.activeClass)
      }

      ticking = false
    }

    window.addEventListener('scroll', onScroll, {passive: true})

    update()
  }
})
