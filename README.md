# Image Bianji - 图片编辑工具

一键智能抠图，基于腾讯云 COS 数据万象 `aiPicMatting` 接口。

GitHub: https://github.com/hanbao0707/image-bianji

## 功能

- 📤 拖拽或点击上传图片
- 🎨 AI 自动移除背景
- ⬇️ 下载透明背景 PNG
- 📱 响应式设计，支持手机

## 快速开始

### 1. 安装依赖

```bash
cd projects/bg-remover
npm install
```

### 2. 配置腾讯云凭证

复制 `.env.example` 为 `.env`，填入你的腾讯云信息：

```bash
cp .env.example .env
```

编辑 `.env`：

```
TENCENT_COS_SECRET_ID=你的SecretId
TENCENT_COS_SECRET_KEY=你的SecretKey
TENCENT_COS_REGION=ap-guangzhou
TENCENT_COS_BUCKET=your-bucket-name-1234567890
```

**获取方式**：
- 密钥：[腾讯云控制台 > 访问管理 > API密钥管理](https://console.cloud.tencent.com/cam/capi)
- 存储桶：[COS 控制台](https://console.cloud.tencent.com/cos/bucket)

### 3. 启动服务

```bash
npm start
```

访问 http://localhost:3000

## 开发模式

```bash
npm run dev
```

## 项目结构

```
bg-remover/
├── public/
│   └── index.html      # 前端页面
├── src/
│   └── server.js       # 后端 API
├── .env.example        # 环境变量模板
├── package.json
└── README.md
```

## API 接口

### POST /api/remove-bg

上传图片并移除背景。

**请求**：`multipart/form-data`
- `image`: 图片文件

**响应**：
```json
{
  "success": true,
  "originalUrl": "原图 URL",
  "resultUrl": "抠图结果 URL（带签名）"
}
```

### GET /api/health

健康检查。

## 费用说明

腾讯云数据万象 AI 抠图按调用次数计费，详见：
https://cloud.tencent.com/document/product/460/6970

## License

MIT
