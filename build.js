#!/usr/bin/env node

// 简单的构建脚本 - 用于Cloudflare部署
// 由于我们使用的是静态文件，不需要复杂的构建过程

const fs = require('fs');
const path = require('path');

console.log('🚀 开始构建微信文件传输助手...');

// 检查必要的文件是否存在
const requiredFiles = [
    'public/index.html',
    'public/login.html',
    'public/manifest.json',
    'public/sw.js',
    'public/css/variables.css',
    'public/css/base.css',
    'public/css/layout.css',
    'public/css/messages.css',
    'public/css/input.css',
    'public/css/ai-chat.css',
    'public/css/modals.css',
    'public/css/auth-page.css',
    'public/css/mobile.css',
    'public/js/config.js',
    'public/js/utils.js',
    'public/js/auth.js',
    'public/js/api.js',
    'public/js/ui.js',
    'public/js/fileUpload.js',
    'public/js/messageHandler.js',
    'public/js/realtime.js',
    'public/js/pwa.js',
    'public/js/app.js',
    'worker/index.js'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
        console.error(`❌ 缺少必要文件: ${file}`);
        allFilesExist = false;
    } else {
        console.log(`✅ 文件检查通过: ${file}`);
    }
});

if (!allFilesExist) {
    console.error('❌ 构建失败：缺少必要文件');
    process.exit(1);
}

// 检查package.json
if (!fs.existsSync('package.json')) {
    console.error('❌ 缺少 package.json 文件');
    process.exit(1);
}

// 检查wrangler.toml
if (!fs.existsSync('wrangler.toml')) {
    console.error('❌ 缺少 wrangler.toml 文件');
    process.exit(1);
}

console.log('✅ 所有文件检查完成');
console.log('📦 静态文件构建完成 - 无需额外处理');
console.log('🎉 构建成功！准备部署到Cloudflare Workers');

// 输出项目信息
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
console.log(`📋 项目名称: ${packageJson.name}`);
console.log(`📋 项目版本: ${packageJson.version}`);
console.log(`📋 项目描述: ${packageJson.description}`);

console.log('🚀 构建完成，可以进行部署！');
