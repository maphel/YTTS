(() => {
  'use strict';

  // Theme: follows the system until the visitor chooses; the choice lasts for this page view.
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  document.querySelector('[data-toggle-theme]')?.addEventListener('click', () => {
    const current = root.dataset.theme || (system.matches ? 'dark' : 'light');
    root.dataset.theme = current === 'dark' ? 'light' : 'dark';
  });

  document.getElementById('language')?.addEventListener('change', (event) => {
    location.assign(event.target.value);
  });

  // Demo: the poster is a plain link to the video file; with JavaScript it plays in place.
  const demo = document.querySelector('[data-demo]');
  demo?.addEventListener('click', (event) => {
    event.preventDefault();
    const portrait = window.matchMedia('(max-width: 720px)').matches;
    const video = document.createElement('video');
    video.className = 'demo';
    video.id = 'demo-video';
    video.controls = true;
    video.playsInline = true;
    video.autoplay = true;
    video.poster = demo.querySelector('img').currentSrc;
    video.src = portrait ? demo.dataset.portrait : demo.href;
    video.setAttribute('aria-label', demo.getAttribute('aria-label'));
    demo.replaceWith(video);
    video.focus();
  });
})();
