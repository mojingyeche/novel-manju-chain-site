const formatTime = value => new Intl.DateTimeFormat('zh-CN',{dateStyle:'long',timeStyle:'short',timeZone:'Asia/Shanghai'}).format(new Date(value));
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const releaseURL = value => {
  const url = new URL(value);
  if (url.origin !== 'https://github.com' || !url.pathname.startsWith('/mojingyeche/novel-manju-chain-suite/releases/') || url.username || url.password) throw new Error('下载地址不可信');
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

document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{
  try { await navigator.clipboard.writeText(button.dataset.copy); document.querySelector('#toast').textContent='已复制'; }
  catch { document.querySelector('#toast').textContent='复制失败，请手动复制命令'; }
  const toast=document.querySelector('#toast');toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1300);
}));

readData('latest').then(latest=>{
  document.querySelector('#latest-version').textContent=`v${latest.suite_version}`;
  document.querySelector('#latest-time').textContent=formatTime(latest.published_at);
  document.querySelector('#latest-asset').textContent=latest.release_asset;
  document.querySelector('#release-link').href=releaseURL(latest.release_url);
}).catch(error=>failure('#latest-version', error));
readData('versions').then(versions=>{
  document.querySelector('#version-downloads').innerHTML=versions.versions.map((release,index)=>`<article class="version-card">
    <div class="version-title"><div><span>${index===0?'当前稳定版':'历史稳定版'}</span><h4>v${escapeHTML(release.version)}</h4></div><time>${formatTime(release.published_at)}</time></div>
    <p>${escapeHTML(release.title)} · ${escapeHTML(release.summary)}</p>
    <code>SHA256 ${escapeHTML(release.release_sha256)}</code>
    <div class="version-actions"><a class="download-button" href="${releaseURL(release.download_url)}">下载 v${escapeHTML(release.version)}</a><a href="${releaseURL(release.release_url)}">查看更新说明</a></div>
  </article>`).join('');
}).catch(error=>failure('#version-downloads', error));
readData('update-history').then(history=>{
  document.querySelector('#update-list').innerHTML=history.releases.map(release=>`<article class="update">
    <div class="update-head"><div><h3>v${escapeHTML(release.version)} · ${escapeHTML(release.title)}</h3><time>${formatTime(release.published_at)}</time></div><strong>${escapeHTML(release.compatibility)}</strong></div>
    <div class="update-summary">${escapeHTML(release.summary)}</div>
    ${release.components.map(item=>`<div class="component"><code>${escapeHTML(item.id)}</code><span class="change">${escapeHTML(item.change_type)}</span><span>${escapeHTML(item.summary)}</span></div>`).join('')}
  </article>`).join('');
}).catch(error=>failure('#update-list', error));
