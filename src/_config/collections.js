import {CHECKINS_DIR, isPublished, validateCheckinImages, validateCheckins} from './utils/checkins.js';

/** All blog posts as a collection. */
export const getAllPosts = collection => {
  return collection.getFilteredByGlob('./src/posts/**/*.md').reverse();
};

/** All Now journal entries, newest first. */
export const getNowEntries = collection => {
  return collection.getFilteredByGlob('./src/now-entries/**/*.md').reverse();
};

/** Published check-ins, newest first. Fails the build on invalid front matter or images. */
export const getCheckins = async collection => {
  const publishAfterByPath = validateCheckins();
  await validateCheckinImages();
  const now = Date.now();
  return collection
    .getFilteredByGlob(`${CHECKINS_DIR}/**/*.md`)
    .filter(item => isPublished(publishAfterByPath, item.inputPath, now))
    .reverse();
};

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

/** All tags from all posts as a collection - excluding custom collections */
export const tagList = collection => {
  const tagsSet = new Set();
  collection.getAll().forEach(item => {
    if (!item.data.tags) return;
    item.data.tags.filter(tag => !['posts', 'docs', 'all'].includes(tag)).forEach(tag => tagsSet.add(tag));
  });
  return Array.from(tagsSet).sort();
};
