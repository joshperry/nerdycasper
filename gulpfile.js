const beeper = require('beeper')
const fs = require('fs')
const through = require('through2')
const merge = require('merge-stream')

// gulp plugins and utils
const { series, watch, src, dest, parallel} = require('gulp')
const Vinyl = require('vinyl')
const pump = require('pump')
const concat = require('gulp-concat')
const hash = require('gulp-hash')
const livereload = require('gulp-livereload')
const postcss = require('gulp-postcss')
const terser = require('gulp-terser')
const zip = require('gulp-zip')
const PluginError = require('plugin-error');

const Terser = require('terser')

// postcss plugins
const autoprefixer = require('autoprefixer')
const colorFunction = require('postcss-color-function')
const cssnano = require('cssnano')
const customProperties = require('postcss-custom-properties')
const easyimport = require('postcss-easy-import')

function serve(done) {
  livereload.listen()
  done()
}

const handleError = (done) => {
  return function (err) {
    if (err) {
      beeper()
    }
    return done(err)
  }
}

const hbs = done =>
  pump(
    src(['*.hbs', 'partials/**/*.hbs'], {base: './'}),
    // Replace src/href/etc refs to hashed files with the latest
    fixuprefs('assets/built/assetmap.json'),
    dest('./'),
    livereload(),
    handleError(done)
  )

const css = done => {
  const processors = [
    easyimport,
    customProperties({preserve: false}),
    colorFunction(),
    autoprefixer(),
    cssnano()
  ]

  pump(
    src(['assets/css/**/*.css'], {sourcemaps: true}),
    postcss(processors),
    concat('nerdycasper.css'),
    hash(),
    dest('assets/built', {sourcemaps: '.'}),
    hash.manifest('assets/built/assetmap.json', { deleteOld: true, sourceDir: `${__dirname}/assets/built` }),
    dest('.'),
    livereload(),
    handleError(done)
  )
}

/**
 * A transformer plugin to fixup references to gulp-hashed assets in hbs files
 */
const fixuprefs = (manifestpath) => {
  const PREFIX = 'built/'

  let cache = []

  return through.obj(function collect(file, encoding, cb) {
    if (file.isNull()) {
      this.push(file)
      return cb()
    }

    if (file.isStream()) {
      this.emit('error', new PluginError('fixuprefs', 'Streaming not supported'))
      return cb()
    }

    // only hbs files should be searched for replaces
    if (file.path.endsWith('.hbs')) {
      cache.push(file)
    } else {
      // no interest in this file
      this.push(file)
    }

    // map done
    cb()
  }, function fixup(cb) {
    stream = this

    // Load module name to script manifest created by gulp-hash
    // and mutate it to be a regex to hashed filename mapping.
    // The goal is that the regex matches with/without PREFIX, and with/without the hash.
    // Hashed version of `default.js` looks like `${PREFIX}default-abcdef01.js`
    const modmap = Object.fromEntries(
      Object.entries(JSON.parse(fs.readFileSync(manifestpath, 'utf8'))).map(([k, v]) => [
        k,
        {
          regex: new RegExp(
            // Potentially prefixed already
            `(${PREFIX})?${k}`
              // Escape . and / (including in prefix)
              .replace(/(\.|\/){1}/g, '\\$1')
              // Make regex that can match hashed and unhashed version of the filename
              .replace(/(.*)(\\\.[^\.]+)$/, `"$1[-0-9a-f]{9}?$2"`),
            // All finds, and all lines
            'mg'
          ),
          target: `"${PREFIX}${v}"`
        }
      ])
    )

    // For each collected file
    for (const file of cache) {
      let contents = file.contents.toString('utf8')

      // Replace any matches from the module map
      for (const [_, v] of Object.entries(modmap)) {
        contents = contents.replace(v.regex, v.target)
      }

      // Update the vinyl file contents
      file.contents = Buffer.from(contents, 'utf8')

      // Push it onto the output
      stream.push(file)
    }

    // reduce done
    cb()
  })
}


/**
 * A javascript transformer that takes a javascript file that defines
 * a requirejs configuration and merges a module-name to hashed-filename `path` set
 * from a manifest created by gulp-hash.
 *
 * The path mapping entries will appended to an existing `path` property on the
 * config, or a new one will be created.
 *
 * This is so that AMD modules loaded by requirejs can be indefinitely
 * cached until they're modified and the filename takes on a new hash.
 *
 * Ghost usually handles this by adding a `?v=<hash>` to an asset file, however
 * assets loaded by the client don't have this logic available. Storing the hash
 * in the filename is the only way for the client to know if its asset cache is
 * invalid without a server roundtrip (which is what we're attempting to elide).
 */
const util = require('util')
const requireconf = (manifestpath) =>
  through.obj((file, encoding, cb) => {

    // Terser transform that adds module map entries to require.conf object definition
    const xformer = new Terser.TreeTransformer((node, descend) => {
      // Find `require.config({...})` statement
      if(
        node instanceof Terser.AST_Call &&
        node.expression instanceof Terser.AST_Dot && node.expression.property == 'config' &&
        node.expression.expression instanceof Terser.AST_SymbolRef && node.expression.expression.name == 'require'
      ) {
        // Modify the call arg object to add the `map: { '*':  }` property
        const conf = node.args[0]
        if(conf) {
          // Function to recursively convert a simple POJO to Terser AST
          // Only supports object and string property values
          function obj2ast(obj) {
            return new Terser.AST_Object({
              properties: Object.entries(obj).map(([key, value]) => new Terser.AST_ObjectKeyVal({
                key,
                quote: '"',
                value: typeof value == 'object' ? obj2ast(value) : new Terser.AST_String({ value, quote: '"' })
              }))
            })
          }

          // Load module name to script manifest created by gulp-hash
          const modmap = JSON.parse(fs.readFileSync(manifestpath, 'utf8'))

          // Create the module map config properties from the manifest
          const groom = s => s.replace('lib/', '').replace('.js', '')
          const mapprops = {
            // Groom the modmap entries for js files
            ...Object.entries(modmap)
              .filter(([key, ]) => key.endsWith('.js') && key !== 'default.js')
              .map(([key, value]) => [groom(key), groom(value)])
              .reduce((a, [key, value]) => ({ ...a, [key]: value.replace('app/', '../app/') }), {})
          }

          // See if there's an existing `paths` property on the config
          const pathsprop = conf.properties.find(okv => okv.key.toLowerCase() == 'paths')

          // Ensure the paths property is an object if it exists
          if(pathsprop && !pathsprop.value instanceof Terser.AST_Object) {
            return cb(new Error('Existing `paths` config entry is not an object'))
          }

          // Merge the paths mapping properties with the existing config
          if(pathsprop) {
            // Append the mapping properties to existing `path` object
            pathsprop.value.properties = [
              ...pathsprop.value.properties,
              ...obj2ast(mapprops).properties,
            ]
          } else {
            // Add a new `paths` object property to the configuration obj
            conf.properties = [
              ...conf.properties,
              ...obj2ast({ paths: mapprops }).properties,
            ]
          }

          /*
          const out = Terser.OutputStream({ beautify: true })
          conf.print(out)
          console.log(out.toString()) */
        }
      }

    })

    // Use Terser to parse and transform the config
    const ast = Terser.parse(file.contents.toString('utf-8')).transform(xformer)
    file.contents = Buffer.from(Terser.minify(ast).code)

    // Push the code for the modified config file onto the stream
    cb(null, file)
  })

const appjs = done =>
  pump(
    // Optimize and hash all dependent scripts
    src(['assets/js/{app,lib}/**/*.js'], { sourcemaps: true }),
    terser(),
    hash(),
    dest('assets/built', {sourcemaps: '.'}),
    hash.manifest('assets/built/assetmap.json', { deleteOld: true, sourceDir: `${__dirname}/assets/built` }),
    dest('.'),
    handleError(done)
  )

const rootjs = done =>
  pump(
    // Prepend `require.js` contents to the built `default.js`
    merge(
      src(['assets/js/require.js']),
      src(['assets/js/default.js'])
        .pipe(requireconf('assets/built/assetmap.json')),
    ),
    concat('default.js'),
    hash(),
    dest('assets/built', {sourcemaps: '.'}),
    hash.manifest('assets/built/assetmap.json', { deleteOld: true, sourceDir: `${__dirname}/assets/built` }),
    dest('.'),
    livereload(),
    handleError(done)
  )

const js = series(appjs, rootjs)

const zipper = done => {
  const themeName = require('./package.json').name
  const filename = themeName + '.zip'

  pump(
    src([
      'package.json',
      'LICENSE',
      'README.md',
      '*.hbs',
      'assets/built/**/*',
      'partials/**/*.hbs',
    ], { base: '.' }),
    zip(filename),
    dest('dist'),
    handleError(done)
  )
}

const publish = async () => {
  // The admin API client is the easiest way to use the API
  const GhostAdminAPI = require('@tryghost/admin-api');

  if(!process.env.GHOST_TOKEN)
    throw new Error(`Cannot publish without GHOST_TOKEN set in your environment`)

  // Configure the ghost client
  const api = new GhostAdminAPI({
    url: 'https://curiouslynerdy.com',
    key: process.env.GHOST_TOKEN,
    version: 'v5.0'
  });

  // Publish the built zipfile to the live site
  await api.themes.upload({file: 'dist/nerdycasper.zip'})
}

const cssWatcher = () => watch('assets/css/**', css)
const hbsWatcher = () => watch(['*.hbs', 'partials/**/*.hbs'], hbs)
const jsWatcher = () => watch(['assets/js/**/*.js'], js)
const watcher = parallel(cssWatcher, hbsWatcher, jsWatcher)
const build = series(parallel(css, js), hbs)
const dev = series(build, serve, watcher)

exports.build = build
exports.zip = series(build, zipper)
exports.default = dev
exports.hbs = hbs
exports.publish = series(exports.zip, publish)
