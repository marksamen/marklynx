/* REV43 — TEST SITE ONLY
   Inject permanent unlisted test media into the same data responses used by
   Main Guides and Recent Uploads. Production JSON files remain untouched.
   This file must load before the normal site loader. */
(() => {
  'use strict';

  const TEST_GUIDE = {
    n: 'TEST',
    p: 'TEST',
    g: 'TEST',
    t: 'TEST',
    ty: 'TEST',
    q: '4K',
    df: 'Easy',
    pl: 'PLW8_g7jLVHB0'
  };

  const TEST_RECENT = [
    {
      id: 'HRtSmycjwN8',
      title: '1 - TEST',
      thumbnail: 'https://i.ytimg.com/vi/HRtSmycjwN8/hqdefault.jpg'
    },
    {
      id: 'HRtSmycjwN8',
      title: 'TEST',
      thumbnail: 'https://i.ytimg.com/vi/HRtSmycjwN8/hqdefault.jpg',
      testPlaylistId: 'PLW8_g7jLVHB0'
    }
  ];

  const nativeFetch = window.fetch.bind(window);

  const requestUrl = input => {
    if (typeof input === 'string') return input;
    if (input && typeof input.url === 'string') return input.url;
    return '';
  };

  const isPath = (url, path) => {
    try {
      return new URL(url, location.href).pathname.endsWith(path);
    } catch (_) {
      return url.includes(path);
    }
  };

  const jsonResponse = (payload, original) => {
    const headers = new Headers(original.headers);
    headers.set('content-type', 'application/json; charset=utf-8');
    headers.delete('content-length');
    return new Response(JSON.stringify(payload), {
      status: original.status,
      statusText: original.statusText,
      headers
    });
  };

  window.fetch = async function(input, init) {
    const url = requestUrl(input);
    const response = await nativeFetch(input, init);
    if (!response.ok) return response;

    if (isPath(url, 'data/games.json')) {
      const data = await response.clone().json();
      if (Array.isArray(data) && !data.some(game => game && game.n === 'TEST')) {
        data.push(TEST_GUIDE);
      }
      return jsonResponse(data, response);
    }

    if (isPath(url, 'data/recent.json')) {
      const data = await response.clone().json();
      if (data && Array.isArray(data.videos)) {
        const production = data.videos.filter(video =>
          video && video.id !== 'HRtSmycjwN8' && video.title !== 'TEST'
        );
        data.videos = [...TEST_RECENT, ...production];
      }
      return jsonResponse(data, response);
    }

    return response;
  };
})();
