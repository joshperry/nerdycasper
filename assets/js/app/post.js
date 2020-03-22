/**
 * Load shared content view logic
 */
require(['app/content-common'])

/**
 * Post specific logic
 */
require(['waypoints'], (Waypoint) => {
  // Replace nav with title on scroll
  new Waypoint({
    element: document.querySelector('.post-full-title'),
    handler: dir => document
                      .querySelector('.site-nav-main')
                      .classList.toggle('nav-post-title-active', dir === 'down')
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

})
