const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('../frontend/node_modules/typescript');

function loadConfig(app, env) {
  const source = fs.readFileSync(path.join(__dirname, '..', app, 'src/api/config.ts'), 'utf8')
    .replaceAll('import.meta.env', 'env');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const exports = {};
  new Function('exports', 'env', outputText)(exports, env);
  return exports;
}

for (const app of ['frontend', 'admin']) {
  test(`${app}: configured API/media URLs preserve existing record paths on writes`, () => {
    const config = loadConfig(app, { VITE_API_BASE_URL: 'https://api.example.com/api/' });
    assert.equal(config.apiBaseUrl, 'https://api.example.com/api');
    const record = { books: [{ coverImage: '/uploads/covers/a.jpg' }], image: '/images/a.jpg', avatar: 'https://elsewhere.example/a.jpg' };
    const display = config.resolveUploadUrls(record);
    assert.equal(display.books[0].coverImage, 'https://api.example.com/uploads/covers/a.jpg');
    assert.equal(display.image, '/images/a.jpg');
    assert.equal(display.avatar, record.avatar);
    assert.deepEqual(config.restoreUploadUrls(display), record);
    const form = new FormData();
    form.append('coverImage', display.books[0].coverImage);
    const blob = new Blob(['file']);
    form.append('file', blob, 'cover.png');
    const restored = config.restoreUploadUrls(form);
    assert.equal(restored.get('coverImage'), '/uploads/covers/a.jpg');
    assert.equal(restored.get('file').name, 'cover.png');
    assert.equal(restored.get('file').size, blob.size);
  });
  test(`${app}: local proxy and optional CDN defaults`, () => {
    const local = loadConfig(app, {});
    assert.equal(local.apiBaseUrl, '/api');
    assert.equal(local.resolveUploadUrls('/uploads/a.jpg'), '/uploads/a.jpg');
    const cdn = loadConfig(app, { VITE_MEDIA_BASE_URL: 'https://cdn.example.com/' });
    assert.equal(cdn.resolveUploadUrls('/uploads/a.jpg'), 'https://cdn.example.com/uploads/a.jpg');
  });
  test(`${app}: native SPA fallback preserves static asset routing`, () => {
    const base = path.join(__dirname, '..', app);
    assert.equal(fs.existsSync(path.join(base, 'public/404.html')), false);
    assert.equal(fs.existsSync(path.join(base, 'public/_redirects')), false);
    const config = JSON.parse(fs.readFileSync(path.join(base, 'wrangler.jsonc'), 'utf8'));
    assert.equal(config.assets.directory, './dist');
    assert.equal(config.assets.not_found_handling, 'single-page-application');
  });
}
