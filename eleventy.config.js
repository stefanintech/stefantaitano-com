/**
 * Most adjustments must be made in `./src/_config/*`
 *
 * Hint VS Code for eleventyConfig autocompletion.
 * © Henry Desroches - https://gist.github.com/xdesro/69583b25d281d055cd12b144381123bf
 * @param {import("@11ty/eleventy/src/UserConfig")} eleventyConfig -
 * @returns {Object} -
 */

// register dotenv for process.env.* variables to pickup
import dotenv from 'dotenv';
dotenv.config();

// add yaml support
import yaml from 'js-yaml';

//  config import
import {getAllPosts, getAllTalks, getNowEntries, showInSitemap, tagList} from './src/_config/collections.js';
import events from './src/_config/events.js';
import filters from './src/_config/filters.js';
import plugins from './src/_config/plugins.js';
import shortcodes from './src/_config/shortcodes.js';

export default async function (eleventyConfig) {
  // --------------------- Events: before build
  eleventyConfig.on('eleventy.before', async () => {
    await events.buildAllCss();
    await events.buildAllJs();
  });

  // --------------------- custom wtach targets
  eleventyConfig.addWatchTarget('./src/assets/**/*.{css,js,svg,png,jpeg}');
  eleventyConfig.addWatchTarget('./src/_includes/**/*.{webc}');

  // --------------------- layout aliases
  eleventyConfig.addLayoutAlias('base', 'base.njk');
  eleventyConfig.addLayoutAlias('page', 'page.njk');
  eleventyConfig.addLayoutAlias('post', 'post.njk');
  eleventyConfig.addLayoutAlias('tags', 'tags.njk');

  //	---------------------  Collections
  eleventyConfig.addCollection('allPosts', getAllPosts);
  eleventyConfig.addCollection('allTalks', getAllTalks);
  eleventyConfig.addCollection('nowEntries', getNowEntries);
  eleventyConfig.addCollection('showInSitemap', showInSitemap);
  eleventyConfig.addCollection('tagList', tagList);

  // ---------------------  Plugins
  eleventyConfig.addPlugin(plugins.htmlConfig);
  eleventyConfig.addPlugin(plugins.drafts);

  eleventyConfig.addPlugin(plugins.EleventyRenderPlugin);
  eleventyConfig.addPlugin(plugins.rss);
  eleventyConfig.addPlugin(plugins.syntaxHighlight);

  eleventyConfig.addPlugin(plugins.webc, {
    components: ['./src/_includes/webc/**/*.webc'],
    useTransform: true
  });

  eleventyConfig.addPlugin(plugins.eleventyImageTransformPlugin, {
    formats: ['avif', 'webp', 'jpeg'],
    widths: [400, 800, 1200, 'auto'],
    svgShortCircuit: true,
    urlPath: '/img/',
    outputDir: './dist/img/',
    htmlOptions: {
      imgAttributes: {
        loading: 'lazy',
        decoding: 'async'
      },
      pictureAttributes: {}
    }
  });

  // ---------------------  bundle
  eleventyConfig.addBundle('css', {hoist: true});

  // 	--------------------- Library and Data
  eleventyConfig.setLibrary('md', plugins.markdownLib);
  eleventyConfig.addDataExtension('yaml', contents => yaml.load(contents));

  // --------------------- Filters
  eleventyConfig.addFilter('toIsoString', filters.toISOString);
  eleventyConfig.addFilter('formatDate', filters.formatDate);
  eleventyConfig.addFilter('formatDateUtc', filters.formatDateUtc);
  eleventyConfig.addFilter('markdownFormat', filters.markdownFormat);
  eleventyConfig.addFilter('splitlines', filters.splitlines);
  eleventyConfig.addFilter('striptags', filters.striptags);
  eleventyConfig.addFilter('shuffle', filters.shuffleArray);
  eleventyConfig.addFilter('alphabetic', filters.sortAlphabetically);
  eleventyConfig.addFilter('slugify', filters.slugifyString);

  // --------------------- Shortcodes
  eleventyConfig.addShortcode('svg', shortcodes.svgShortcode);
  eleventyConfig.addShortcode('image', shortcodes.imageShortcode);
  eleventyConfig.addShortcode('imageKeys', shortcodes.imageKeysShortcode);
  eleventyConfig.addShortcode('year', () => `${new Date().getFullYear()}`);

  // --------------------- Events: after build
  eleventyConfig.on('eleventy.after', events.svgToPng);

  // --------------------- Passthrough File Copy

  // -- same path
  ['src/assets/fonts/', 'src/assets/images/template', 'src/assets/images/stefan.png', 'src/assets/og-images'].forEach(path =>
    eleventyConfig.addPassthroughCopy(path)
  );

  eleventyConfig.addPassthroughCopy({
    // -- to root
    'src/assets/images/favicon/': '/',
    'src/assets/images/stefan.png': 'assets/images/stefan.png',

    // -- resume PDF at stable public URL
    'src/assets/documents/stefan-taitano-resume.pdf': 'resume/stefan-taitano-resume.pdf',

    // -- interactive RubyConf presentation at a stable public URL
    'src/assets/talks/rubyconf-2026/slides/': 'talks/rubyconf-2026/slides/',

    // -- node_modules
    'node_modules/lite-youtube-embed/src/lite-yt-embed.{css,js}': `assets/components/`
  });

  // ----------------------  ignore test files
  eleventyConfig.ignores.add('src/assets/talks/**/*.html');

  if (process.env.ELEVENTY_ENV != 'test') {
    eleventyConfig.ignores.add('src/common/pa11y.njk');
  }

  // Local --serve has no Netlify functions runtime. Proxy the status
  // function so the header script can hit the same path as production.
  eleventyConfig.setServerOptions({
    middleware: [
      async (req, res, next) => {
        if (req.url.split('?')[0] !== '/.netlify/functions/lichess-status') {
          next();
          return;
        }

        const mocks = {
          playing: {
            online: true,
            playing: true,
            gameId: 'lUktyqJt',
            detail: '15+10 vs opponent (940)'
          },
          online: {online: true, playing: false, gameId: null}
        };
        const mock = mocks[process.env.LICHESS_STATUS_MOCK];
        if (mock) {
          res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'});
          res.end(JSON.stringify(mock));
          return;
        }

        try {
          const {handler} = await import(new URL('./netlify/functions/lichess-status.js', import.meta.url).href);
          const result = await handler();
          res.writeHead(result.statusCode, result.headers);
          res.end(result.body);
        } catch (error) {
          console.error('[lichess-status] local proxy failed', error);
          res.writeHead(502, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'});
          res.end(JSON.stringify({online: false, playing: false, gameId: null}));
        }
      }
    ]
  });

  // --------------------- general config
  return {
    markdownTemplateEngine: 'njk',

    dir: {
      output: 'dist',
      input: 'src',
      includes: '_includes',
      layouts: '_layouts'
    }
  };
}
