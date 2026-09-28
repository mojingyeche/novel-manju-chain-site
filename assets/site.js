const formatTime = value => new Intl.DateTimeFormat('zh-CN',{dateStyle:'long',timeStyle:'short',timeZone:'Asia/Shanghai'}).format(new Date(value));
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const releaseURL = value => {
  const url = new URL(value);
  if (url.origin !== 'https://github.com' || !['/mojingyeche/novel-manju-chain-suite/releases/', '/mojingyeche/novel-manju-chain-site/releases/'].some(prefix => url.pathname.startsWith(prefix)) || url.username || url.password) throw new Error('下载地址不可信');
  return escapeHTML(url.href);
};
async function readData(name) {
  const response = await fetch(`data/${name}.json`, {cache:'no-cache'});
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
function failure(selector, error) {
  document.querySelector(selector).textContent = `数据暂时无法读取：${error.message}。请刷新重试。`;
}
function workflowCard(release, index) {
  const labels = {suite:'套件更新包', skill:'独立 Skill 包', workbuddy:'WorkBuddy 包'};
  if (!release.assets || Object.keys(release.assets).length === 0) throw new Error('发行清单缺少安装包');
  const links = Object.entries(release.assets).map(([role, asset])=>{
    if (!/^[0-9a-f]{64}$/i.test(asset.sha256)) throw new Error('安装包校验值无效');
    return `<p><a class="download-button" href="${releaseURL(asset.url)}">${escapeHTML(labels[role] || role)}</a></p><code>${escapeHTML(asset.name)} · SHA256 ${escapeHTML(asset.sha256)}</code>`;
  }).join('');
  return `<article class="version-card"><div class="version-title"><div><span>${index===0?'当前发行版':'历史发行版'}</span><h4>v${escapeHTML(release.version)}</h4></div><time>${formatTime(release.published_at)}</time></div><p>${escapeHTML(release.title)} · ${escapeHTML(release.summary)}</p><p>统一入口：manju-creation-director。双端业务文件一致；安装后需重新加载并验证。</p>${links}<p><a href="${releaseURL(release.release_url)}">查看更新说明</a></p></article>`;
}

document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{
  try { await navigator.clipboard.writeText(button.dataset.copy); document.querySelector('#toast').textContent='已复制'; }
  catch { document.querySelector('#toast').textContent='复制失败，请手动复制命令'; }
  const toast=document.querySelector('#toast');toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1300);
}));

readData('latest').then(latest=>{
  if (latest.withdrawn) {
    document.querySelector('#latest-version').textContent='迁移中';
    document.querySelector('#latest-time').textContent=formatTime(latest.withdrawn_at);
    document.querySelector('#latest-asset').textContent='旧套件已下架；新工作流尚未发布';
    document.querySelector('#release-link').href='#install';
    document.querySelector('#release-link').textContent='查看仍可用的独立包';
    return;
  }
  document.querySelector('#latest-version').textContent=`v${latest.suite_version}`;
  document.querySelector('#latest-time').textContent=formatTime(latest.published_at);
  document.querySelector('#latest-asset').textContent=latest.release_asset;
  document.querySelector('#release-link').href=releaseURL(latest.download_url);
}).catch(error=>failure('#latest-version', error));
readData('versions').then(versions=>{
  document.querySelector('#version-downloads').innerHTML=versions.versions.map((release,index)=>release.distribution_schema === 'MCD-DISTRIBUTION-1' ? workflowCard(release,index) : release.withdrawn ? `<article class="version-card"><h4>v${escapeHTML(release.version)} · 套件已下架</h4><p>包含退役组件的套件与 WorkBuddy 包停止分发。以下为仍保留的历史独立包，不属于新版工作流安装入口。</p>${Object.values(release.component_assets || {}).map(asset=>`<p><a class="download-button" href="${releaseURL(asset.download_url)}">${escapeHTML(asset.release_asset)}</a></p><code>SHA256 ${escapeHTML(asset.release_sha256)}</code>`).join('')}</article>` : `<article class="version-card">
    <div class="version-title"><div><span>${index===0?'当前稳定版':'历史稳定版'}</span><h4>v${escapeHTML(release.version)}</h4></div><time>${formatTime(release.published_at)}</time></div>
    <p>${escapeHTML(release.title)} · ${escapeHTML(release.summary)}</p>
    <p>${release.private_download ? '旧版私有存档：需仓库权限并登录 GitHub' : '公开下载：无需 GitHub 账号或登录'}</p>
    <code>SHA256 ${escapeHTML(release.release_sha256)}</code>
    <div class="version-actions"><a class="download-button" href="${releaseURL(release.download_url)}">Codex 套件 v${escapeHTML(release.version)}</a><a href="${releaseURL(release.release_url)}">查看更新说明</a></div>
    ${release.workbuddy ? `<p>WorkBuddy 同版本安装与维护包（含六个 Skill、专家指令及中文说明）</p><code>SHA256 ${escapeHTML(release.workbuddy.sha256)}</code><div class="version-actions"><a class="download-button" href="${releaseURL(release.workbuddy.download_url)}">WorkBuddy v${escapeHTML(release.version)}</a></div>` : '<p>此历史版本未登记正式 WorkBuddy 安装包。</p>'}
  </article>`).join('');
}).catch(error=>failure('#version-downloads', error));
readData('update-history').then(history=>{
  document.querySelector('#update-list').innerHTML=history.releases.map(release=>`<article class="update">
    <div class="update-head"><div><h3>v${escapeHTML(release.version)} · ${escapeHTML(release.title)}</h3><time>${formatTime(release.published_at)}</time></div><strong>${escapeHTML(release.compatibility)}</strong></div>
    <div class="update-summary">${escapeHTML(release.summary)}</div>
    ${release.components.map(item=>`<div class="component"><code>${escapeHTML(item.id)}</code><span class="change">${escapeHTML(item.change_type)}</span><span>${escapeHTML(item.summary)}</span></div>`).join('')}
  </article>`).join('');
}).catch(error=>failure('#update-list', error));
