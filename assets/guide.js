'use strict';
const guideId = document.body.dataset.guide;
const escapeText = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function trustedRelease(value) {
  const url = new URL(value);
  if (url.origin !== 'https://github.com' || url.username || url.password || !['/mojingyeche/novel-manju-chain-suite/releases/', '/mojingyeche/novel-manju-chain-site/releases/'].some(prefix => url.pathname.startsWith(prefix))) throw new Error('不可信的发行链接');
  return escapeText(url.href);
}
async function readGuideData(name) {
  const response = await fetch('../../data/' + name + '.json', {cache:'no-cache'});
  if (!response.ok) throw new Error('HTTP ' + response.status);
  return response.json();
}
const skillNames = [
  ['novel-manju-chain-agent', '小说漫剧链式助手'],
  ['short-drama-write', '短剧剧本创作'],
  ['manju-asset-image-pipeline', '漫剧资产总控'],
  ['manju-character-card', '漫剧人物卡'],
  ['manju-scene-grid', '漫剧场景九宫格']
];
function installPrompt(v, host) {
  if (v.withdrawn) throw new Error('该套件已下架，不得继续安装');
  if (v.distribution_schema === 'MCD-DISTRIBUTION-1') {
    const asset = v.assets[host === 'WorkBuddy' ? 'workbuddy' : 'suite'];
    trustedRelease(asset.url);
    if (!/^[0-9a-f]{64}$/i.test(asset.sha256)) throw new Error('安装包校验值无效');
    return `请在当前 ${host} 安装漫剧创作工作流 ${v.version}，唯一入口 manju-creation-director。本次只安装验收，不启动创作或媒体模型。
下载：${asset.url}
SHA256：${asset.sha256}
核对真实宿主与技能安装目录。下载校验后解压到新暂存目录，阅读包内 manifest.json 和 workflow_distribution.py --help。先 verify，再 plan；检查旧组件清单及同名目录，本地修改或冲突未解决时停止对应迁移，不以当前文件临时生成“可信基线”绕过校验。
保留项目原文件、版本绑定与外部技能自身规则。旧入口仅在依赖已核查、差异已解决并保存可验证备份后退出扫描目录；不要清理无关技能或重新上架已撤回包。安装器只安装清单中的新组件，不会自动完成外部路由或旧组件退役。
确认计划后用 install --package <包路径> --sha256 <上述哈希> --target <核实的技能根> --recovery <扫描范围外的同盘备份目录> --plan-sha256 <plan返回值> --confirmed 安装。需要可信旧版基线时必须从已核验发行包或维护快照取得并审查差异，不盲目覆盖。
分别报告文件核验、旧入口退役、外部依赖和客户端加载状态。新开聊天实际读取入口、业务 VERSION、知识版本；未实测时明确未验证，不承诺旧聊天热重载。调用：使用 manju-creation-director（漫剧创作工作流），先读取真实 SKILL.md，再处理我指定的阶段。`;
  }
  const wb = host === 'WorkBuddy';
  const url = wb ? v.workbuddy.download_url : v.download_url;
  trustedRelease(url);
  return `请在当前 ${host} 中安装小说/漫剧完整套件 ${v.version}，共六个 Skill。本次仅安装、设置中文调用映射并验收，不启动创作或付费模型调用。
下载地址：${url}
SHA256：${wb ? v.workbuddy.sha256 : v.release_sha256}
先核对当前宿主、系统和真实配置位置，下载后校验上述 SHA256；不一致立即停止。解压到新的临时目录，先阅读包内 README 和安装说明。发现同名技能先备份并检查本地改动，有冲突时报告并询问，不覆盖未确认的差异。
${wb ? '这是 WorkBuddy 专用交接包，不要执行 provenance 中的 Codex install.py，也不要安装到 .codex。先运行包内 python tools/verify_handoff.py .；按 docs/安装与验收.md 安装 packages/ 下六个技能 ZIP。只有已核实真实安装路径且具备权限时才使用包内安装工具；否则指导我通过客户端添加技能/上传本地技能包。需我操作时列出明确步骤，不声称已导入。按 专家配置.md 指导创建或更新专家，保留已有自定义指令；不要将 Codex TOML 当作 WorkBuddy 专家配置。' : '这是 Codex 完整套件。在解压后的 novel-manju-chain-suite 目录先阅读 install.py 的用法，再使用 python install.py --codex-home <已核实的当前用户 Codex 配置目录> 安装。不要照抄他人电脑路径，不以 ZIP 已下载代替安装成功；Agent 配置是否实际加载须另外核验。'}
保留原 Skill ID、目录名和业务正文，不为中文调用改写 SKILL.md。建立以下完整中文调用映射：
${skillNames.map(([id, name]) => `${name} → ${id}`).join('\n')}
请将映射追加到本宿主实际支持、会被后续任务读取的用户指令或专家指令中，保留已有规则并告诉我保存位置和作用范围；映射只用于定位并读取原 Skill，不替代原规则。如果不能持久保存，明确说明并提供我可粘贴的完整映射，不要虚报已生效。
安装完成后逐项报告六个 Skill 的中文名、原 ID、真实入口、版本、安装与加载验证状态；提示是否需要重新加载或新开任务。列出每个 Skill 可直接复制的调用句：调用「中文名」（原 ID），先读取对应 SKILL.md，说明所需输入，暂不执行创作。中文名无法识别时使用原 ID 定位，找不到就报告。
旧包更新器可能仍访问私有仓库；检查失败须说明并询问是否离线使用已校验版本，不要求我提供密钥，也不绕过校验。缺少 Python、宿主权限或必需工具时明确停在哪一步，不擅自安装其他软件。`;
}
function hostPanel(v, host, index) {
  const wb = host === 'WorkBuddy';
  const key = wb ? 'workbuddy' : 'codex';
  const available = !wb || v.workbuddy;
  const asset = !wb && v.component_assets?.[guideId];
  const calls = skillNames.map(([id, name]) => `调用「${name}」（${id}），先读取对应 SKILL.md，说明所需输入，暂不执行创作。`).join('\n');
  return `<div id="${key}-panel-${index}" role="tabpanel" aria-labelledby="${key}-tab-${index}" ${wb ? 'hidden' : ''}>
    <div class="package-heading"><h4>${host} 版 <span>v${escapeText(v.version)}</span></h4><p>${wb ? '专用交接包 · 六个 Skill ZIP + 专家配置' : '完整套件 · 六个 Skill + Codex 安装器'}</p></div>
    ${available ? `<div class="package-actions"><a class="package-download" href="${trustedRelease(wb ? v.workbuddy.download_url : v.download_url)}">下载 ${host} 完整套件</a><button type="button" class="copy-install" data-copy="${escapeText(installPrompt(v, host))}">复制 ${host} 安装指令</button></div>
    <p class="package-hint">先复制指令，粘贴到 ${host} 的新任务中发送。它会校验安装包、安装六个技能，并设置中文调用映射。</p>
    <details><summary>查看安装指令</summary><pre>${escapeText(installPrompt(v, host))}</pre></details>
    <details><summary>安装后怎么调用？六个中文调用示例</summary><p>安装端须报告映射保存位置；未持久生效时，使用括号中的原 ID 定位。</p><pre>${escapeText(calls)}</pre><button type="button" data-copy="${escapeText(calls)}">复制六个调用示例</button></details>
    <details><summary>校验值${asset ? '与单独安装' : '与发行详情'}</summary><p class="hash">${host} SHA256：${escapeText(wb ? v.workbuddy.sha256 : v.release_sha256)}</p>${asset ? `<p><a href="${trustedRelease(asset.download_url)}">仅下载本 Skill 独立包</a>（不含完整六技能与上述完整安装流程）</p><p>包含：${escapeText(asset.included_skills.join('、'))}</p><p class="hash">独立包 SHA256：${escapeText(asset.release_sha256)}</p>` : ''}<a href="${trustedRelease(v.release_url)}">查看发行详情</a></details>` : '<p>此版本未登记正式 WorkBuddy 包，请选择有专用交接包的版本。</p>'}
  </div>`;
}
function versionCard(v, index) {
  if (v.distribution_schema === 'MCD-DISTRIBUTION-1') {
    return `<article class="package-card"><h3>漫剧创作工作流 v${escapeText(v.version)}</h3><p>${escapeText(v.summary)}</p><p>新版唯一入口为 manju-creation-director；本页历史入口不再随新版发行。</p>${['Codex','WorkBuddy'].map(host=>{const asset=v.assets[host==='WorkBuddy'?'workbuddy':'suite'];const prompt=installPrompt(v,host);return `<h4>${host}</h4><p><a class="package-download" href="${trustedRelease(asset.url)}">下载 ${host} 包</a> <button data-copy="${escapeText(prompt)}">复制 ${host} 安装指令</button></p><p class="hash">SHA256：${escapeText(asset.sha256)}</p><details><summary>查看安装指令</summary><pre>${escapeText(prompt)}</pre></details>`;}).join('')}<p>${escapeText(v.compatibility)}</p></article>`;
  }
  if (v.withdrawn) {
    const asset = v.component_assets?.[guideId];
    return `<article class="package-card"><h3>v${escapeText(v.version)} · 套件已下架</h3><p>旧套件及 WorkBuddy 包已停止分发；不得使用旧安装指令。新工作流是否已发布以官网最新清单为准。</p>${asset ? `<p><a class="package-download" href="${trustedRelease(asset.download_url)}">下载不含退役组件的历史独立包</a></p><p>${escapeText(asset.release_asset)}</p><p>包含：${escapeText(asset.included_skills.join('、'))}</p><p class="hash">SHA256：${escapeText(asset.release_sha256)}</p>` : '<p>此历史入口暂无可用安装包。</p>'}</article>`;
  }
  return `<article class="package-card"><div class="package-version"><span class="version-badge">${index ? '历史版本' : '当前稳定版'}</span><h3>v${escapeText(v.version)}</h3></div><p class="meta">${escapeText(v.published_at)} · ${escapeText(v.title)}</p><p class="package-access">${v.private_download ? '旧版私有存档：需仓库权限并登录 GitHub；建议使用当前公开稳定版。' : '公开下载 · 无需 GitHub 账号或登录'}</p><div class="host-tabs" role="tablist" aria-label="选择 ${escapeText(v.version)} 安装平台">${['Codex','WorkBuddy'].map((host, i) => { const key = host.toLowerCase(); return `<button type="button" role="tab" id="${key}-tab-${index}" aria-controls="${key}-panel-${index}" aria-selected="${!i}" tabindex="${i ? '-1' : '0'}" data-host-tab>${host} 版</button>`; }).join('')}</div>${hostPanel(v, 'Codex', index)}${hostPanel(v, 'WorkBuddy', index)}<details class="compatibility"><summary>版本兼容说明</summary><p>${escapeText(v.compatibility)}</p></details></article>`;
}
readGuideData('versions').then(data => {
  const versions = data.versions.slice(0, 3);
  if (!versions.length) throw new Error('尚无稳定发行版');
  document.querySelector('#guide-downloads').innerHTML = versions.map(versionCard).join('');
}).catch(error => { document.querySelector('#guide-downloads').textContent = '下载记录读取失败：' + error.message + '。请返回首页或稍后重试。'; });
readGuideData('update-history').then(data => {
  const records = data.releases.filter(v => v.components.some(c => c.id === guideId));
  document.querySelector('#guide-history').innerHTML = records.length ? records.map(v => '<article><h3>套件 ' + escapeText(v.version) + ' · ' + escapeText(v.title) + '</h3><p class="meta">北京时间：' + escapeText(v.published_at) + '</p>' + v.components.filter(c => c.id === guideId).map(c => '<p><strong>' + escapeText(c.name) + '</strong> · ' + escapeText(c.change_type) + '</p><p>' + escapeText(c.summary) + '</p>').join('') + '<p>兼容性：' + escapeText(v.compatibility) + '</p></article>').join('') : '<p>统一历史中尚无此组件的变化记录；不将其他组件更新记为本组件更新。</p>';
}).catch(error => { document.querySelector('#guide-history').textContent = '更新历史读取失败：' + error.message + '。下载区独立加载，不受此错误影响。'; });
function selectHost(tab) {
  const card = tab.closest('.package-card');
  card.querySelectorAll('[role="tab"]').forEach(button => {
    const selected = button === tab;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
    document.getElementById(button.getAttribute('aria-controls')).hidden = !selected;
  });
}
document.addEventListener('keydown', event => {
  const tab = event.target.closest('[data-host-tab]');
  if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const tabs = [...tab.parentElement.querySelectorAll('[role="tab"]')];
  const next = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs[tabs.length - 1] : tabs[(tabs.indexOf(tab) + 1) % tabs.length];
  selectHost(next);
  next.focus();
});
document.addEventListener('click', async event => {
  const tab = event.target.closest('[data-host-tab]');
  if (tab) selectHost(tab);
  const button = event.target.closest('[data-copy]');
  if (!button) return;
  const toast = document.querySelector('#toast');
  try { await navigator.clipboard.writeText(button.dataset.copy); toast.textContent = '已复制'; }
  catch { toast.textContent = '复制失败，请手动选择上方提示词'; }
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
});
