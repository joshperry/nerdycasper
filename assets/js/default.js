/**
 * RequireJS config and main theme logic module
 */
(function() {

// Subresource Integrity hashes for CDN-loaded scripts
const sri = {
  katex: 'sha384-y23I5Q6l+B6vatafAwxRu/0oK/79VlbSz7Q9aiSZUvyWYIYsd+qj+o24G5ZU2zJz'
}

function getScriptPath() {
  const scriptel = document.getElementById('rootscript')
  const scriptUrl = new URL(scriptel.src)
  return scriptUrl.pathname.split('/').slice(0, -1).join('/')
}
const scriptpath = getScriptPath();

require.config({
  baseUrl: `${scriptpath}/lib`,

  paths: {
    katex: 'https://cdn.jsdelivr.net/npm/katex@0.11.1/dist/katex.min',
  },

  shim: {
    waypoints: { exports: 'Waypoint' },
    prism: { exports: 'Prism' },
    katex: {
      init: () => {
        // Async load katex CSS
        loadcss('https://cdn.jsdelivr.net/npm/katex@0.11.1/dist/katex.min.css', 'sha384-zB1R0rpPzHqg7Kpt0Aljp8JPLqbXI3bhnPWROx27a9N0Ll6ZP/+DiW/UqRcLbRjq')
      }
    },
  },

  // Hook the require.js script node creation to add SRI attributes
  onNodeCreated: (node, config, module) => {
    if(sri[module]) {
      node.setAttribute('integrity', sri[module])
      node.setAttribute('crossorigin', 'anonymous')
    }
  }
})

// Injects a CSS link tag to async load a CSS file, optionally with SRI
function loadcss(url, srihash) {
  var link = document.createElement("link")
  link.type = "text/css"
  link.rel = "stylesheet"
  link.href = url

  if(srihash) {
    link.setAttribute('integrity', srihash)
    link.setAttribute('crossorigin', 'anonymous')
  }

  document.getElementsByTagName("head")[0].appendChild(link)
}

}())

/**
 * Site-wide logic
 */
require([], () => {
  /**
   * Members subscription logic
   */
  const subbuttel = document.querySelector('.subscribe-butt')
  if(subbuttel) {
    if (getParameterByName('action') == 'subscribe') {
      document.body.classList.add('subscribe-success')
    }

    document.querySelector('.subscribe-success-message .subscribe-close').onclick = function () {
      document.querySelector('.subscribe-success-message').classList.add('close')
    }

    // Reset form on opening subscrion overlay
    subbuttel.onclick = function() {
      document.querySelector('.subscribe-overlay form').className = ''
      document.querySelector('.subscribe-email').value = ''
    }
  }

  // Parse the URL parameter
  function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");

    const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)")
    const results = regex.exec(url);

    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }
})
