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
test('retirement renders retained independent packages but no suite installation',async()=>{
  const home = await render('site.js');
  assert.equal(home.get('#release-link').href,'#install');
  assert.match(home.get('#version-downloads').innerHTML,/short-drama-write/);
  assert.doesNotMatch(home.get('#version-downloads').innerHTML,/href="[^"]*novel-manju-chain-suite-[^\"]*zip/);
  const guide = await render('guide.js','short-drama-write');
  assert.match(guide.get('#guide-downloads').innerHTML,/独立包/);
  assert.doesNotMatch(guide.get('#guide-downloads').innerHTML,/复制.*安装指令/);
});
