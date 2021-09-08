/**
 * This module contains code that is common between both the Page and Post views
 */
define(require => {

  // Startup content plugins
  require(['prism', 'reframe', 'littlefoot'], (prism, reframe, {littlefoot}) => {
    // Run reframe plugin to make framed content responsive
    reframe('.post-full-content', 'fluid-width-video-wrapper')

    // Fire up the syntax highlighter
    prism.highlightAll()

    // Start bigfootjs footnotes
    littlefoot({
      activateOnHover: true,
      dismissOnUnhover: true,
      hoverDelay: 3000,
    })
  })

  /**
   * Gallery card support
   *
   * Detects when a gallery card has been used and applies sizing to make sure
   * the display matches what is seen in the editor.
   */
  require([], () => {
    const images = document.querySelectorAll('.kg-gallery-image img')
    images.forEach(image => {
      const container = image.closest('.kg-gallery-image')
      const ratio = image.attributes.width.value / image.attributes.height.value
      container.style.flex = ratio + ' 1 0%'
    })
  })

  /**
   * Code expansion logic
   *
   * Expands code elements as the top is scrolled up into the top 75% of the page,
   * or the bottom down into the bottom 75%. Collapses the elements when either edge
   * is not inside the middle 50% of the view.
   */
  require(['ramda', 'waypoints'], function(R, Waypoint) {
    // Map `this` to the first parameter on a provided function, then remainging args
    // Waypoints uses `this` to provide the element to handler and offset functions
    const ttp = f => function(...args){ return f(this, ...args) }

    // Waypoint handlers for elements
    const toggleClass = R.curry((className, wpt, dir) => wpt.element.classList.toggle(className))

    // Create a waypoint instance
    const makeWaypoint = R.curry((handler, offset, element) =>
      new Waypoint({
        element,
        handler: ttp(handler),
        offset: typeof offset == 'function' ? ttp(offset) : offset
      })
    )

    // Create the waypoints
    const waypoints = R.chain( // Flat map our elements over the curried constructors
      R.juxt( // Func that applies the list of constructors to an element value
        R.map( // Create a curried waypoint constructor for each offset
          makeWaypoint(toggleClass('active')),
          [
            '75%',
            wpt => Waypoint.viewportHeight() / 4 - wpt.element.offsetHeight
          ]
        )
      ),
      // We want to target the `pre` element that wraps the `code` element, it
      // unfortunately has no distinctive attributes
      R.map(el => el.parentElement, document.querySelectorAll('code[class*="language-"]'))
    )
  })

})
