const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const load = name => JSON.parse(fs.readFileSync(path.join(root, 'data', name + '.json'), 'utf8'));

const guides = ['agent', 'short-drama-write', 'manju-director-v5-2', 'manju-asset-image-pipeline'];
async function renderGuide(id, overrides = {}) {
  const elements = new Map();
  const document = {
    body: {dataset: {guide: id}},
    querySelectorAll: () => [],
    querySelector: selector => {
      if (!elements.has(selector)) elements.set(selector, {textContent: '', innerHTML: ''});
      return elements.get(selector);
    }
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/guide.js'), 'utf8'), {
    document, URL,
    fetch: async url => {
      const name = path.basename(url, '.json');
      const data = Object.hasOwn(overrides, name) ? overrides[name] : load(name);
      return data === null ? {ok: false, status: 503} : {ok: true, json: async () => data};
    }
  });
  await new Promise(resolve => setImmediate(resolve));
  return elements;
}

test('all guides have complete sections and resolvable local links', () => {
  const files = ['index.html', ...guides.map(id => `guides/${id}/index.html`)];
  for (const relative of files) {
    const file = path.join(root, relative);
    const html = fs.readFileSync(file, 'utf8');
    assert.ok(!html.includes('锟斤拷') && !html.includes('????'));
    if (relative !== 'index.html') {
      for (const id of ['capabilities','install','workflow','examples','boundaries','download','history']) assert.ok(html.includes(`id="${id}"`), `${relative}: ${id}`);
      assert.ok(html.includes('data-copy='));
    }
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const href = match[1];
      if (/^https?:/.test(href)) continue;
      const [local, anchor] = href.split('#');
      let target = local ? path.resolve(path.dirname(file), local) : file;
      if (fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
      assert.ok(fs.existsSync(target), `${relative}: ${href}`);
      if (anchor) assert.ok(fs.readFileSync(target, 'utf8').includes(`id="${anchor}"`), `${relative}: ${href}`);
    }
  }
  assert.match(fs.readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8'), /cp -r assets data guides _site\//);
});

test('each guide filters unified history by exact component', async () => {
  for (const id of ['novel-manju-chain-agent', ...guides.slice(1)]) {
    const history = load('update-history');
    history.releases[0].components.push({id:'unrelated', name:'UNRELATED_MARKER', summary:'not this skill'});
    const view = await renderGuide(id, {'update-history':history});
    assert.ok(!view.get('#guide-history').innerHTML.includes('UNRELATED_MARKER'));
    const component = history.releases.flatMap(release => release.components).find(c => c.id === id);
    assert.ok(view.get('#guide-history').innerHTML.includes(component.summary));
    const downloads = view.get('#guide-downloads').innerHTML;
    const displayed = load('versions').versions;
    for (const record of displayed) assert.ok(downloads.includes(record.release_asset));
    for (const record of load('downloads').releases) {
      if (!displayed.some(item => item.version === record.version)) assert.ok(!downloads.includes(record.release_asset));
    }
  }
});

test('guide history failure preserves download list', async () => {
  const view = await renderGuide('short-drama-write', {'update-history':null});
  assert.match(view.get('#guide-history').textContent, /HTTP 503/);
  assert.match(view.get('#guide-downloads').innerHTML, /下载完整套件/);
});

test('standalone packages expose own hashes and dependencies', async () => {
  for (const id of guides.slice(1)) {
    const data = load('versions');
    const asset = data.versions[0].component_assets[id];
    const view = await renderGuide(id);
    assert.ok(view.get('#guide-downloads').innerHTML.includes(asset.release_asset));
    assert.ok(view.get('#guide-downloads').innerHTML.includes(asset.release_sha256));
    for (const skill of asset.included_skills) assert.ok(view.get('#guide-downloads').innerHTML.includes(skill));
    asset.download_url = 'https://evil.example/x';
    const unsafe = await renderGuide(id, {versions:data});
    assert.match(unsafe.get('#guide-downloads').textContent, /不可信/);
  }
});

test('guide rejects unsafe links and escapes component text', async () => {
  const versions = load('versions');
  versions.versions[0].download_url = 'https://evil.example/download';
  const history = load('update-history');
  history.releases.flatMap(release => release.components).find(component => component.id === 'short-drama-write').summary = '<img src=x onerror=alert(1)>';
  const view = await renderGuide('short-drama-write', {versions, 'update-history':history});
  assert.match(view.get('#guide-downloads').textContent, /不可信/);
  assert.ok(!view.get('#guide-history').innerHTML.includes('<img'));
  assert.match(view.get('#guide-history').innerHTML, /&lt;img/);
});

async function render(overrides = {}) {
  const elements = new Map();
  const document = {
    querySelectorAll: () => [],
    querySelector: selector => {
      if (!elements.has(selector)) elements.set(selector, {textContent:'', innerHTML:'', href:''});
      return elements.get(selector);
    }
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/site.js'), 'utf8'), {
    document, Intl, Date, URL,
    fetch: async url => {
      const name = path.basename(url, '.json');
      const data = Object.hasOwn(overrides, name) ? overrides[name] : load(name);
      if (data === null) return {ok:false, status:503};
      return {ok:true, json:async()=>data};
    }
  });
  await new Promise(resolve => setImmediate(resolve));
  return elements;
}

test('failed history request does not hide version downloads', async () => {
  const view = await render({'update-history':null});
  assert.match(view.get('#version-downloads').innerHTML, /download-button/);
  assert.match(view.get('#update-list').textContent, /HTTP 503/);
});

test('untrusted release text is escaped', async () => {
  const data = load('versions');
  data.versions[0].title = '<img src=x onerror=alert(1)>';
  const view = await render({versions:data});
  assert.ok(!view.get('#version-downloads').innerHTML.includes('<img'));
  assert.match(view.get('#version-downloads').innerHTML, /&lt;img/);
});

test('untrusted download URL is rejected', async () => {
  const data = load('versions');
  data.versions[0].download_url = 'javascript:alert(1)';
  const view = await render({versions:data});
  assert.match(view.get('#version-downloads').textContent, /不可信/);
});

test('WorkBuddy links use same version and reject unsafe destinations', async () => {
  const data = load('versions');
  const first = data.versions[0];
  first.workbuddy = {sha256: 'a'.repeat(64), download_url: `https://github.com/mojingyeche/novel-manju-chain-suite/releases/download/${first.version}/novel-manju-chain-suite-${first.version}-workbuddy.zip`};
  const view = await render({versions:data});
  assert.ok(view.get('#version-downloads').innerHTML.includes(first.workbuddy.download_url));
  for (const id of ['novel-manju-chain-agent', ...guides.slice(1)]) {
    const guide = await renderGuide(id, {versions:data});
    assert.ok(guide.get('#guide-downloads').innerHTML.includes(first.workbuddy.download_url));
  }
  first.workbuddy.download_url = 'https://evil.example/package.zip';
  assert.match((await render({versions:data})).get('#version-downloads').textContent, /不可信/);
  assert.match((await renderGuide('novel-manju-chain-agent', {versions:data})).get('#guide-downloads').textContent, /不可信/);
});

test('published data agrees across all three manifests', () => {
  const latest = load('latest');
  const history = load('update-history').releases;
  const versions = load('versions').versions;
  assert.ok(versions.length > 0 && versions.length <= 3);
  assert.equal(latest.suite_version, history[0].version);
  assert.equal(latest.suite_version, versions[0].version);
  assert.equal(latest.release_sha256, versions[0].release_sha256);
  assert.equal(latest.published_at, history[0].published_at);
  assert.equal(new Set(versions.map(v=>v.version)).size, versions.length);
  const numeric = value => value.split('.').map(Number);
  const compare = (a,b) => { const x=numeric(a.version), y=numeric(b.version); return x[0]-y[0] || x[1]-y[1] || x[2]-y[2]; };
  assert.deepEqual(versions.map(v=>v.version), [...versions].sort((a,b)=>compare(b,a)).map(v=>v.version));
  for (const record of versions) {
    assert.match(record.version, /^\d+\.\d+\.\d+$/);
    assert.match(record.release_sha256, /^[a-f0-9]{64}$/);
    const note = history.find(note=>note.version===record.version);
    assert.ok(note);
    for (const key of ['published_at','title','summary','compatibility']) assert.equal(record[key], note[key]);
    const base = 'https://github.com/mojingyeche/novel-manju-chain-suite/releases';
    assert.equal(record.release_url, `${base}/tag/${record.version}`);
    assert.equal(record.download_url, `${base}/download/${record.version}/novel-manju-chain-suite-${record.version}.zip`);
  }
});
