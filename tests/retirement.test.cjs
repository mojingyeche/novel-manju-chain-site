const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const load = name => JSON.parse(fs.readFileSync(path.join(root, 'data', name + '.json'), 'utf8'));
async function render(file, guide) {
  const map = new Map();
  const document = {body:{dataset:{guide}}, querySelectorAll:()=>[], addEventListener(){},
    querySelector(s){if(!map.has(s))map.set(s,{});return map.get(s);}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'assets',file),'utf8'),{document,URL,Intl,Date,
    fetch:async url=>({ok:true,json:async()=>load(path.basename(url,'.json'))})});
  await new Promise(resolve=>setImmediate(resolve));
  return map;
}
test('retired packages have no live data download URLs',()=>{
  const names = new Set(load('withdrawals').assets.map(a=>a.name));
  for(const name of ['latest','versions','downloads']) {
    const raw = JSON.stringify(load(name));
    for(const asset of names) assert.ok(!raw.includes('/'+asset+'"'), asset);
  }
  assert.ok(!fs.existsSync(path.join(root,'guides/manju-director-v5-2/index.html')));
  assert.ok(fs.existsSync(path.join(root,'guides/manju-creation-director/index.html')));
});
test('withdrawn versions render no old suite installation',async()=>{
  const home = await render('site.js');
  if (load('latest').withdrawn) assert.equal(home.get('#release-link').href,'#install');
  const guide = await render('guide.js','short-drama-write');
  for(const row of load('versions').versions.filter(v=>v.withdrawn)) {
    for(const html of [home.get('#version-downloads').innerHTML,guide.get('#guide-downloads').innerHTML]) {
      assert.ok(!html.includes('releases/download/'+row.version+'/novel-manju-chain-suite-'));
    }
  }
});
