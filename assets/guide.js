'use strict';
const guideId = document.body.dataset.guide;
const escapeText = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function trustedRelease(value) {
  const url = new URL(value);
  if (url.origin !== 'https://github.com' || url.username || url.password || !url.pathname.startsWith('/mojingyeche/novel-manju-chain-suite/releases/')) throw new Error('不可信的发行链接');
  return escapeText(url.href);
}
async function readGuideData(name) {
  const response = await fetch('../../data/' + name + '.json', {cache:'no-cache'});
  if (!response.ok) throw new Error('HTTP ' + response.status);
  return response.json();
}
readGuideData('versions').then(data => {
  const versions = data.versions.slice(0, 3);
  if (!versions.length) throw new Error('尚无稳定发行版');
  document.querySelector('#guide-downloads').innerHTML = versions.map((v, i) => {
    const asset = v.component_assets?.[guideId];
    const standalone = asset ? '<p><a href="' + trustedRelease(asset.download_url) + '">下载本 Skill 独立包 ' + escapeText(v.version) + '</a></p><p>包含目录：' + escapeText(asset.included_skills.join('、')) + '</p><p class="hash">独立包 SHA256：' + escapeText(asset.release_sha256) + '</p>' : (guideId === 'novel-manju-chain-agent' ? '' : '<p>此历史版本没有独立包，可从完整套件提取。</p>');
    return '<article><h3>' + (i ? '历史套件版 ' : '当前套件版 ') + escapeText(v.version) + '</h3><p class="meta">北京时间：' + escapeText(v.published_at) + '</p><p>' + escapeText(v.title) + '</p>' + standalone + '<p><a href="' + trustedRelease(v.download_url) + '">下载完整套件 ' + escapeText(v.version) + '</a> · <a href="' + trustedRelease(v.release_url) + '">发行详情</a></p><p class="hash">套件 SHA256：' + escapeText(v.release_sha256) + '</p><p>' + escapeText(v.compatibility) + '</p></article>';
  }).join('');
}).catch(error => { document.querySelector('#guide-downloads').textContent = '下载记录读取失败：' + error.message + '。请返回首页或稍后重试。'; });
readGuideData('update-history').then(data => {
  const records = data.releases.filter(v => v.components.some(c => c.id === guideId));
  document.querySelector('#guide-history').innerHTML = records.length ? records.map(v => '<article><h3>套件 ' + escapeText(v.version) + ' · ' + escapeText(v.title) + '</h3><p class="meta">北京时间：' + escapeText(v.published_at) + '</p>' + v.components.filter(c => c.id === guideId).map(c => '<p><strong>' + escapeText(c.name) + '</strong> · ' + escapeText(c.change_type) + '</p><p>' + escapeText(c.summary) + '</p>').join('') + '<p>兼容性：' + escapeText(v.compatibility) + '</p></article>').join('') : '<p>统一历史中尚无此组件的变化记录；不将其他组件更新记为本组件更新。</p>';
}).catch(error => { document.querySelector('#guide-history').textContent = '更新历史读取失败：' + error.message + '。下载区独立加载，不受此错误影响。'; });
document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
  const toast = document.querySelector('#toast');
  try { await navigator.clipboard.writeText(button.dataset.copy); toast.textContent = '已复制'; }
  catch { toast.textContent = '复制失败，请手动选择上方提示词'; }
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}));
