# 小说/漫剧链式 Agent 官方中文指南

这是 `novel-manju-chain-suite` 的公开说明网站源码。网站只发布经过清理的中文说明和版本元数据，不包含私有 Skill 正文或安装包。

更新数据来自私有仓库唯一数据源 `release/update-history.json`，由同步脚本复制生成，不在网站仓库手工维护第二份更新文案。

官网通过 `data/versions.json` 展示最近 3 个稳定版本的独立下载链接、发布时间、SHA256 与更新说明。安装包仍位于私有 GitHub Release，访问者必须拥有仓库权限。

## 页面结构

- `guides/agent/`：Agent 完整手册，包含小说/剧本入口、审查、定向修订、冻结、资产、分镜、续作及更新回退。
- `guides/short-drama-write/`：剧本 Skill 独立指南。
- `guides/manju-director-v5-2/`：导演 Skill 独立指南。
- `guides/manju-asset-image-pipeline/`：资产总控独立指南。

每页都有能力、安装、机制、可复制用法、边界、下载和组件历史。`assets/guide.js` 按组件 ID 从统一历史筛选，不另维护 Skill 版本记录。下载列表来自 `data/versions.json`；0.2.0 起提供三个独立包，0.1.0 仍只提供原套件。完整校验目录 `data/downloads.json` 支持指定历史版本更新，不限制到网页展示的最近三版。

指南内容需要在对应功能变化时一并维护；数据自动同步不等于自动重写用法说明。Pages 部署需包含 `guides/`。本地验证：`node tests/site.test.cjs`、`node --check assets/guide.js`、`git diff --check`。这些不代替实际浏览器显示、私有权限下载或上线验证。
