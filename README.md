# 联邦学习图像识别评估平台

这是一个基于 Vue 3 + TypeScript + Vite 开发的联邦学习图像识别评估平台的前端项目。该平台提供了模型性能评估、推理结果展示等功能。

## 主要功能

1. **模型性能分析**

   - 支持上传训练历史文件（JSON格式）
   - 可视化展示联邦学习与集中式学习的性能对比
   - 展示准确率和损失值的变化趋势
   - 显示训练总时长等关键指标
2. **推理功能**

   - 支持上传图片进行识别
   - 展示推理结果和置信度
   - 支持多个预训练模型的选择

## 技术栈

- Vue 3 (使用 `<script setup>` 语法)
- TypeScript
- Vite
- Element Plus UI 组件库
- ECharts 图表库
- Pinia 状态管理

## 开发环境设置

1. 安装依赖：

```bash
npm install
```

2. 启动开发服务器：

```bash
npm run dev
```

3. 构建生产版本：

```bash
npm run build
```

## 项目结构

```
src/
├── components/     # 组件目录
├── pages/         # 页面组件
├── services/      # API 服务
├── stores/        # Pinia 状态管理
└── router/        # 路由配置
```

## 数据格式说明

详见public/mock里的json文件
