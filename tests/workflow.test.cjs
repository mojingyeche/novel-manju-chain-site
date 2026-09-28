const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
function record() {
  const base = 'https://github.com/mojingyeche/novel-manju-chain-site/releases/';
  return {distribution_schema:'MCD-DISTRIBUTION-1', version:'0.4.0',
    published_at:'2026-09-28T16:00:00+08:00', title:'workflow', summary:'single entry',
    compatibility:'separate project migration', release_url:base+'tag/0.4.0',
    assets:Object.fromEntries(['suite','skill','workbuddy'].map(role=>[role,
      {name:role+'.zip', url:base+'download/0.4.0/'+role+'.zip', sha256:'a'.repeat(64)}]))};
}
function context(file, row) {
  const context = {document:{body:{dataset:{guide:'manju-creation-director'}},
    querySelectorAll:()=>[],addEventListener(){},querySelector:()=>({})},
    URL,Intl,Date,fetch:async()=>({ok:false,status:503}),row};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root,'assets',file),'utf8'), context);
  return context;
}
test('new homepage derives exactly three package links from manifest',()=>{
  const row=record(), ctx=context('site.js',row);
  const html=vm.runInContext('workflowCard(row,0)',ctx);
  for(const asset of Object.values(row.assets)) assert.ok(html.includes(asset.url));
  assert.equal((html.match(/class="download-button"/g)||[]).length,3);
  assert.doesNotMatch(html,/六个|novel-manju-chain-agent|manju-character-card/);
});
test('both host instructions preserve migration and loading boundaries',()=>{
  const row=record(),ctx=context('guide.js',row);
  for(const host of ['Codex','WorkBuddy']) {
    ctx.host=host;
    const prompt=vm.runInContext('installPrompt(row,host)',ctx);
    assert.match(prompt,/manju-creation-director/);
    assert.match(prompt,/不会自动完成外部路由或旧组件退役/);
    assert.match(prompt,/不承诺旧聊天热重载/);
    assert.match(prompt,/不以当前文件临时生成/);
    assert.ok(prompt.includes(row.assets[host==='Codex'?'suite':'workbuddy'].url));
    assert.doesNotMatch(prompt,/六个 Skill|--codex-home/);
  }
});
test('new cards reject untrusted destinations and invalid checksums',()=>{
  for(const bad of ['url','sha256']) {
    const row=record(); row.assets.suite[bad]=bad==='url'?'https://evil.example/x':'abc';
    assert.throws(()=>vm.runInContext('workflowCard(row,0)',context('site.js',row)));
    assert.throws(()=>vm.runInContext('installPrompt(row,"Codex")',context('guide.js',row)));
  }
});
test('new card text is escaped and withdrawn packages refuse installation',()=>{
  const row=record();row.title='<img src=x>';row.summary='<script>x</script>';
  const html=vm.runInContext('workflowCard(row,0)',context('site.js',row));
  assert.doesNotMatch(html,/<img|<script/);
  row.withdrawn=true;
  assert.throws(()=>vm.runInContext('installPrompt(row,"Codex")',context('guide.js',row)));
});
