/**
 * 图片背景移除服务 - 后端 API
 * 使用腾讯云 COS 数据万象 aiPicMatting 接口
 */

require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const COS = require('cos-nodejs-sdk-v5');

const app = express();
const PORT = process.env.PORT || 3000;

// 配置 multer 用于文件上传（内存存储）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 限制 10MB
});

// 初始化 COS 客户端
let cosClient = null;

function initCOS() {
  const { TENCENT_COS_SECRET_ID, TENCENT_COS_SECRET_KEY, TENCENT_COS_REGION, TENCENT_COS_BUCKET } = process.env;

  if (!TENCENT_COS_SECRET_ID || !TENCENT_COS_SECRET_KEY || !TENCENT_COS_REGION || !TENCENT_COS_BUCKET) {
    console.error('❌ 缺少 COS 凭证配置，请检查 .env 文件');
    return false;
  }

  cosClient = new COS({
    SecretId: TENCENT_COS_SECRET_ID,
    SecretKey: TENCENT_COS_SECRET_KEY
  });

  console.log('✅ COS 客户端初始化成功');
  return true;
}

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    cosConfigured: cosClient !== null,
    bucket: process.env.TENCENT_COS_BUCKET || '未配置',
    region: process.env.TENCENT_COS_REGION || '未配置'
  });
});

/**
 * 上传图片并返回抠图结果
 * POST /api/remove-bg
 * body: FormData with 'image' file
 */
app.post('/api/remove-bg', upload.single('image'), async (req, res) => {
  if (!cosClient) {
    return res.status(500).json({ error: 'COS 未配置，请检查服务器环境变量' });
  }

  if (!req.file) {
    return res.status(400).json({ error: '请上传图片文件' });
  }

  const bucket = process.env.TENCENT_COS_BUCKET;
  const region = process.env.TENCENT_COS_REGION;
  const key = `uploads/${Date.now()}_${req.file.originalname}`;

  try {
    // 步骤 1: 上传原图到 COS
    console.log(`📤 上传图片: ${key}`);

    await new Promise((resolve, reject) => {
      cosClient.putObject({
        Bucket: bucket,
        Region: region,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    // 步骤 2: 调用数据万象 AI 抠图
    console.log(`🎨 执行 AI 抠图: ${key}`);

    // 获取签名 URL 供前端访问（带 AI 抠图处理）
    const signedUrl = cosClient.getObjectUrl({
      Bucket: bucket,
      Region: region,
      Key: key,
      Query: { 'ci-process': 'ai-image-matting' },
      Sign: true,
      Expires: 3600
    });

    console.log(`✅ 抠图 URL 已生成`);

    res.json({
      success: true,
      originalUrl: `https://${bucket}.cos.${region}.myqcloud.com/${key}`,
      resultUrl: signedUrl,
      message: '背景移除成功'
    });

  } catch (error) {
    console.error('❌ 处理失败:', error);
    res.status(500).json({
      error: '图片处理失败',
      details: error.message
    });
  }
});

/**
 * 仅上传图片（不抠图）
 * POST /api/upload
 */
app.post('/api/upload', upload.single('image'), async (req, res) => {
  if (!cosClient) {
    return res.status(500).json({ error: 'COS 未配置' });
  }

  if (!req.file) {
    return res.status(400).json({ error: '请上传图片文件' });
  }

  const bucket = process.env.TENCENT_COS_BUCKET;
  const region = process.env.TENCENT_COS_REGION;
  const key = `uploads/${Date.now()}_${req.file.originalname}`;

  try {
    await new Promise((resolve, reject) => {
      cosClient.putObject({
        Bucket: bucket,
        Region: region,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    const url = `https://${bucket}.cos.${region}.myqcloud.com/${key}`;
    res.json({ success: true, url, key });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 服务已启动: http://localhost:${PORT}`);
  initCOS();
});
