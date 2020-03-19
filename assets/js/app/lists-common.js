/**
 * Common logic for list pages
 */
define(require => {
  /**
   * Infinite Scroll
   *
   * When the page is scrolled to 300px from the bottom, the next page of posts
   * is fetched by following the the <link rel="next" href="..."> that is output
   * by {{ghost_head}}.
   *
   * The individual post items are extracted from the fetched pages by looking for
   * a wrapper element with the class "post-card". Any found elements are appended
   * to the element with the class "post-feed" in the currently viewed page.
   */
  require([], () => {
    // TODO: Update to use waypoints.js

    // next link element
    var nextElement = document.querySelector('link[rel=next]');
    if (!nextElement) {
      return;
    }

    // post feed element
    const feedElement = document.querySelector('.post-feed');
    if (!feedElement) {
      return;
    }

    const buffer = 300;

    var ticking = false;
    var loading = false;

    var lastScrollY = window.scrollY;
    var lastWindowHeight = window.innerHeight;
    var lastDocumentHeight = document.documentElement.scrollHeight;

    function onPageLoad() {
      if (this.status === 404) {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
        return;
      }

      // append contents
      const postElements = this.response.querySelectorAll('.post-card');
      postElements.forEach(function (item) {
        // document.importNode is important, without it the item's owner
        // document will be different which can break resizing of
        // `object-fit: cover` images in Safari
        feedElement.appendChild(document.importNode(item, true));
      });

      // set next link
      const resNextElement = this.response.querySelector('link[rel=next]');
      if (resNextElement) {
        nextElement.href = resNextElement.href;
      } else {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
      }

      // sync status
      lastDocumentHeight = document.documentElement.scrollHeight;
      ticking = false;
      loading = false;
    }

    function onUpdate() {
      // return if already loading
      if (loading) {
        return;
      }

      // return if not scroll to the bottom
      if (lastScrollY + lastWindowHeight <= lastDocumentHeight - buffer) {
        ticking = false;
        return;
      }

      loading = true;

      const xhr = new window.XMLHttpRequest();
      xhr.responseType = 'document';

      xhr.addEventListener('load', onPageLoad);

      xhr.open('GET', nextElement.href);
      xhr.send(null);
    }

    function requestTick() {
      ticking || window.requestAnimationFrame(onUpdate);
      ticking = true;
    }

    function onScroll() {
      lastScrollY = window.scrollY;
      requestTick();
    }

    function onResize() {
      lastWindowHeight = window.innerHeight;
      lastDocumentHeight = document.documentElement.scrollHeight;
      requestTick();
    }

    window.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', onResize);

    requestTick();
  })
})
