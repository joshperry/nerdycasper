define(require => {
  // Startup content plugins
  require(['jquery', 'prism', 'jquery.fitvids', 'bigfoot'], ($, prism) => {
    // Run fitvids plugin
    $(".post-full-content").fitVids()

    // Fire up the syntax highlighter
    prism.highlightAll()

    // Start bigfootjs footnotes
    $.bigfoot()
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
   * Expands code elements as they're scrolled into the center of the page view for easier reading
   */
  require(['jquery', 'ramda', 'jquery.waypoints'], function($, R, Waypoint) {
    var makeWaypoint = R.curry(function(handler, element, offset) {
      return new Waypoint({ element: element, handler: handler, offset: offset });
    });

    var toggleClass = R.curry(function(className, dir) {
      $(this.element).toggleClass(className);
    });

    var toggleActiveClass = toggleClass('active');

    var makeOffsets = R.chain(R.__, [
      '75%',
      function() {
        return Waypoint.viewportHeight() / 4 - this.element.offsetHeight;
      }
    ]);

    var snippets = document.querySelectorAll('pre[class*="language-"]');

    var waypoints = R.chain(R.compose(makeOffsets, makeWaypoint(toggleActiveClass)), snippets);

    /*
    var toggleClass = _.curry(function(className) {
      $(this.element).toggleClass(className);
    });

    var toggleActiveClass = toggleClass('active');

    // Get all code blocks on the page
    var codes = $('pre[class*="language-"]');


    // Waypoints for top of a code element transitioning the bottom nth of the window
    // By default, the handler is triggered when the top of an element
    // hits the top of the viewport offset.
    codes.waypoint(toggleActiveClass, { offset: '75%' });

    // Bottom of a code element transitioning the top quarter of the window
    // We use an offset function to calculate the trigger from the bottom of the element.
    codes.waypoint(toggleActiveClass, {
      offset: function() {
        return Waypoint.viewportHeight() / 4 - this.element.offsetHeight;
      }
    });
    */
  })
})
