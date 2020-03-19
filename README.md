# nerdycapser

Based on the default theme for [Ghost](http://github.com/tryghost/ghost/), but with a nerd-oriented feature set. This is the latest development version! If you're just looking to download the latest release, head over to the [releases](https://github.com/joshperry/nerdycasper/releases) page.

&nbsp;

![screenshot-desktop](https://user-images.githubusercontent.com/353959/66987533-40eae100-f0c1-11e9-822e-cbaf38fb8e3f.png)

&nbsp;

# Template Layout

Ghost uses a simple templating language called [Handlebars](http://handlebarsjs.com/) for its themes.

This theme has lots of code comments to help explain what's going on just by reading the code. Once you feel comfortable with how everything works, we also have full [theme API documentation](https://ghost.org/docs/api/handlebars-themes/) which explains every possible Handlebars helper and template.

**The main files are:**

- `default.hbs` - The parent template file, which includes your global header/footer
- `index.hbs` - The main template to generate a list of posts, usually the home page
- `post.hbs` - The template used to render individual posts
- `page.hbs` - Used for individual pages
- `tag.hbs` - Used for tag archives, eg. "all posts tagged with `news`"
- `author.hbs` - Used for author archives, eg. "all posts written by Jamie"

One neat trick is that you can also create custom one-off templates by adding the slug of a page to a template file. For example:

- `page-about.hbs` - Custom template for an `/about/` page
- `tag-news.hbs` - Custom template for `/tag/news/` archive
- `author-ali.hbs` - Custom template for `/author/ali/` archive

# Code Layout

Require.js is used for dependency management and async module loading. There is a main `default.js` file which defines the configuration for requirejs and contains logic that is used site-wide.

The `require.js` and `default.js` scripts are loaded synchronously so that require and its config are guaranteed to be available to scripts loaded later.

Vendored library dependencies are contained in the `assets/js/lib` folder, and application logic files are contained in `assets/js/app`.

Each template which has unique logic has an AMD module file that contains its code, the template that uses the script contains an async script tag to load it. For example, `app/index.js` is loaded by `index.hbs`, and `app/page.js` is loaded by `page.hbs`.

Some functionality is rolled up into common modules, these are required as dependencies by the template-specific modules where they're used:

- `app/content-common.js` - Logic that is common to author-created content displayed by the Post and Page templates
- `app/lists-common.js` - Logic that is common to templates which display lists (index, tag, etc.)

The gulp build pipeline minifies the javascript sources using [terser](https://github.com/terser/terser) and puts them into `/assets/built/`.

NB: This setup is currently not terribly optimized as each dependency is loaded on-demand. A goal in future releases is to have a build step to optimize the number of scripts loaded from the server. This may not be terribly necessary with proper script caching and when served via HTTP/2 or QUIC. Currently dependencies managed by requirejs do not have any cache busting, so this makes indefinite caching of those dependencies more difficult, though any scripts loaded directly from a handlebar template do have cache busting hashes.


# Development

Casper styles are compiled using Gulp/PostCSS to polyfill future CSS spec. You'll need [Node](https://nodejs.org/) installed, after which, run from the theme's root directory:

```bash
$ npm install
$ npm run dev
```

Now you can edit `/assets/css/` files, which will be compiled to `/assets/built/` automatically.

The `zip` Gulp task packages the theme files into `dist/<theme-name>.zip`, which you can then upload to your site.

```bash
$ npm run zip
```

## Iterating with Docker

To quickly and easily iterate on changes to the template, ensure you have Docker and docker-compose installed and simply run `docker-compose up` from this directory. The template will be mounted into the new ghost container, and the default starter articles will be generated which eases manual testing. Navigate to `http://localhost:2368/` and the ghost site will be shown. As you make changes to the template, simply refresh to see them.

## Live Reload

Live reload support is integrated for changes to CSS, HBS, and JS files. Install the livereload plugin for your browser, run the ghost docker instance and the `npm run dev` command as shown above, and the browser should display in realtime any changes that are made to the theme.

# PostCSS Features Used

- Autoprefixer - Don't worry about writing browser prefixes of any kind, it's all done automatically with support for the latest 2 major versions of every browser.
- Variables - Simple pure CSS variables
- [Color Function](https://github.com/postcss/postcss-color-function)


# SVG Icons

nerdycasper uses inline SVG icons, included via Handlebars partials. You can find all icons inside `/partials/icons`. To use an icon just include the name of the relevant file, eg. To include the SVG icon in `/partials/icons/rss.hbs` - use `{{> "icons/rss"}}`.

You can add your own SVG icons in the same manner.


# Copyright & License

Original Casper Theme Copyright (c) 2013-2020 Ghost Foundation - Released under the [MIT license](LICENSE).
Modifications Copyright (c) 2020 Joshua Perry - Released under the [AGPL license](LICENSE).
