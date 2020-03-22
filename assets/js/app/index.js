/*
 * Load common list page logic
 */
require(['app/lists-common'])

/**
 * Index page logic
 */
require(['waypoints'], (Waypoint) => {
  // Show top nav when hero scrolls out of view
	new Waypoint({
		element: document.querySelector('.post-feed'),
		handler: dir => document
											.querySelector('.site-nav-main .site-nav')
											.classList.toggle('fixed-nav-active', dir === 'down')
	})
})
