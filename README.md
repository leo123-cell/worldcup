# World Cup Betting Tracker

朋友局世界杯竞猜统计工具。

## Features

- 上传体彩票据图片，并通过大模型 OCR 提取字段化投注项
- 预置 2026 世界杯小组赛中文赛程
- 支持胜平负、让球胜平负、比分、总进球自动结算
- 多串 1 等所有关联比赛确认比分后再结算
- 按收益率和投入权重计算排行榜

## Local Development

```bash
npm install
npm run dev
```

默认地址：

```text
http://localhost:5174
```

## Environment Variables

复制 `.env.example` 为 `.env`，填入自己的 API key。

推荐 Qwen VL OCR：

```env
AI_PROVIDER=qwen
DASHSCOPE_API_KEY=your-key
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen-vl-ocr-latest
```

`.env` 已加入 `.gitignore`，不要提交真实密钥。

## Build

```bash
npm run build
npm run start
```

## Deploy To Netlify

This repo includes `netlify.toml` and a Netlify Function for:

```text
/api/recognize-ticket
```

Netlify build settings:

```text
Build command: npm run build
Publish directory: dist
Functions directory: netlify/functions
```

Set these environment variables in Netlify:

```env
AI_PROVIDER=qwen
DASHSCOPE_API_KEY=your-key
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen-vl-ocr-latest
```

Do not put real API keys in GitHub.

## Current Data Model

当前版本使用浏览器 `localStorage` 保存数据。部署后每个浏览器的数据相互独立。

如果需要所有参与者共享同一份票据、比分和排行榜，下一步需要接入云端数据库。
