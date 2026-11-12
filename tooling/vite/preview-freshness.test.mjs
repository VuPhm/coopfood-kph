import { test } from 'node:test';
import assert from 'node:assert/strict';
import { previewFreshness } from './preview-freshness.mjs';

test('worker recovery never intercepts business API requests', () => {
  let middleware;
  previewFreshness().configureServer({ middlewares: { use(handler) { middleware = handler; } } });
  for (const url of ['/api', '/api/v1/auth/session', '/api/v1/stores/synthetic/kph']) {
    let forwarded = false;
    middleware({ url, method: 'GET', headers: { 'service-worker': 'script' } }, {}, () => { forwarded = true; });
    assert.equal(forwarded, true);
  }
});

test('local preview bootstrap is absent from production HTML', () => {
  const plugin = previewFreshness();
  const html = '<!doctype html><html><head></head><body></body></html>';
  plugin.configResolved({ command: 'build' });
  assert.equal(plugin.transformIndexHtml(html), html);
  plugin.configResolved({ command: 'serve' });
  assert.match(plugin.transformIndexHtml(html), /coopfood-local-preview/);
  assert.doesNotMatch(plugin.transformIndexHtml(html), /caches\.delete|indexedDB\.deleteDatabase|localStorage\.clear|Clear-Site-Data/);
});
