# 🔍 SEO Audit Tool - Free Website Analyzer

> 输入任何URL，秒出完整SEO审计报告。适合按次收费或订阅制变现。

## 🚀 功能特性

- **26项SEO检查**: Meta标签、标题结构、图片、链接、内容质量
- **性能分析**: 加载时间、页面大小、脚本/样式统计
- **移动端检测**: 响应式配置、viewport检查
- **结构化数据**: JSON-LD、Open Graph、Twitter Card
- **安全检测**: HTTPS、HSTS、CSP
- **无障碍检查**: 语言、ARIA地标
- **技术SEO**: Sitemap、Favicon、缓存头
- **评分系统**: A-F评分，直观展示SEO健康度

## 📡 API

```bash
curl -X POST http://localhost:3457/api/audit \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

## 💰 变现策略

| 方案 | 价格 | 内容 |
|------|------|------|
| 免费版 | ¥0 | 基础扫描，概要评分 |
| 单次报告 | ¥19.9 | 完整PDF报告 |
| 月度订阅 | ¥99/月 | 无限扫描 + 竞品对比 |
| 年度订阅 | ¥899/年 | 全部功能 + API |

## 🚀 部署

```bash
npm install
npm start
# 访问 http://localhost:3457
```
