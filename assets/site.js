const formatTime = value => new Intl.DateTimeFormat('zh-CN',{dateStyle:'long',timeStyle:'short',timeZone:'Asia/Shanghai'}).format(new Date(value));

document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{
  await navigator.clipboard.writeText(button.dataset.copy);
  const toast=document.querySelector('#toast');toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1300);
}));

Promise.all([fetch('data/latest.json').then(r=>r.json()),fetch('data/update-history.json').then(r=>r.json())]).then(([latest,history])=>{
  document.querySelector('#latest-version').textContent=`v${latest.suite_version}`;
  document.querySelector('#latest-time').textContent=formatTime(latest.published_at);
  document.querySelector('#latest-asset').textContent=latest.release_asset;
  document.querySelector('#release-link').href=latest.release_url;
  document.querySelector('#update-list').innerHTML=history.releases.map(release=>`<article class="update">
    <div class="update-head"><div><h3>v${release.version} · ${release.title}</h3><time>${formatTime(release.published_at)}</time></div><strong>${release.compatibility}</strong></div>
    <div class="update-summary">${release.summary}</div>
    ${release.components.map(item=>`<div class="component"><code>${item.id}</code><span class="change">${item.change_type}</span><span>${item.summary}</span></div>`).join('')}
  </article>`).join('');
}).catch(error=>{
  document.querySelector('#update-list').innerHTML=`<p class="notice">更新数据暂时无法读取：${error.message}</p>`;
});
