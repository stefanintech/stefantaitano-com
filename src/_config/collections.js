import {CHECKINS_DIR, IMAGES_DIR, isPublished, validateCheckinImages, validateCheckins} from './utils/checkins.js';

/** All blog posts as a collection. */
export const getAllPosts = collection => {
  return collection.getFilteredByGlob('./src/posts/**/*.md').reverse();
};

/** All Now journal entries, newest first. */
export const getNowEntries = collection => {
  return collection.getFilteredByGlob('./src/now-entries/**/*.md').reverse();
};

/** Published check-ins, newest first. Fails the build on invalid front matter or images. */
export const createCheckinsCollection =
  ({dir = CHECKINS_DIR, imagesDir = IMAGES_DIR} = {}) =>
  async collection => {
    const publishAfterByPath = validateCheckins(dir);
    await validateCheckinImages(imagesDir);
    const now = Date.now();
    return collection
      .getFilteredByGlob(`${dir}/**/*.md`)
      .filter(item => isPublished(publishAfterByPath, item.inputPath, now))
      .reverse();
  };

export const getCheckins = createCheckinsCollection();

export const HOME_STREAM_LIMIT = 30;

const utcDay = date => new Date(date).toISOString().slice(0, 10);

/**
 * Posts, /now entries, and published check-ins in one newest-first list.
 * Sorted by calendar day in UTC, the same day `formatDateUtc` prints, so a
 * post's offset can't move it past a same-day check-in or /now entry.
 */
export const buildHomeStream = ({posts = [], nowEntries = [], checkins = []}, limit = HOME_STREAM_LIMIT) => {
  const items = [
    ...posts.map(item => ({type: 'post', item})),
    ...checkins.map(item => ({type: 'checkin', item})),
    ...nowEntries.map(item => ({type: 'now', item}))
  ].map(entry => ({...entry, day: utcDay(entry.item.date)}));

  const sorted = items.sort(
    (a, b) => b.day.localeCompare(a.day) || new Date(b.item.date) - new Date(a.item.date)
  );
  return {items: sorted.slice(0, limit), capped: sorted.length > limit};
};

/** The home stream. Check-ins come only from the filtered check-ins collection. */
export const createHomeStreamCollection =
  ({posts = getAllPosts, nowEntries = getNowEntries, checkins = getCheckins, limit} = {}) =>
  async collection =>
    buildHomeStream(
      {posts: posts(collection), nowEntries: nowEntries(collection), checkins: await checkins(collection)},
      limit
    );

export const getHomeStream = createHomeStreamCollection();

/** All talks, newest first. */
export const getAllTalks = collection => {
  return collection.getFilteredByGlob('./src/talks/**/*.md').reverse();
};

/** All relevant pages as a collection for sitemap.xml */
export const showInSitemap = collection => {
  return collection
    .getFilteredByGlob('./src/**/*.{md,njk}')
    .filter(item => !item.inputPath.startsWith(`${CHECKINS_DIR}/`));
};
