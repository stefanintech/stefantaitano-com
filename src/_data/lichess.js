import EleventyFetch from '@11ty/eleventy-fetch';

export default async function () {
  return EleventyFetch('https://lichess.org/api/user/Late2TheBoard', {
    duration: '6h',
    type: 'json'
  });
}
