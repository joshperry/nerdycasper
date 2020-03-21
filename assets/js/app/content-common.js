define(require => {
  // Startup content plugins
  require(['jquery', 'prism', 'jquery.fitvids', 'bigfoot'], ($, prism) => {
    // Run fitvids plugin
    $(".post-full-content").fitVids()

    // Fire up the syntax highlighter
    prism.highlightAll()

    // Start bigfootjs footnotes
    $.bigfoot({
      activateOnHover: true,
      deleteOnUnhover: true,
      hoverDelay: 3000,
    })
  })

  /**
   * Gallery card support
   *
   * Detects when a gallery card has been used and applies sizing to make sure
   * the display matches what is seen in the editor.
   */
  require(['jquery'], ($) => {
    $(function resizeImagesInGalleries() {
      var images = document.querySelectorAll('.kg-gallery-image img')
      images.forEach(function (image) {
        var container = image.closest('.kg-gallery-image')
        var width = image.attributes.width.value
        var height = image.attributes.height.value
        var ratio = width / height
        container.style.flex = ratio + ' 1 0%'
      })
    })
  })

  /**
   * Code expansion logic
   *
   * Expands code elements as the top is scrolled up into the top 75% of the page,
   * or the bottom down into the bottom 75%. Collapses the elements when the the edges
   * leave these boundaries.
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
      R.applySpec( // Func that applies the list of constructors to an element value
        R.map( // Create a curried waypoint constructor for each offset
          makeWaypoint(toggleClass('active')),
          [
            '75%',
            wpt => Waypoint.viewportHeight() / 4 - wpt.element.offsetHeight
          ]
        )
      ),
      document.querySelectorAll('pre[class*="language-"]')
    )
  })
})
