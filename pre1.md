## 联邦学习图像识别效果评估平台 - 前后端设计 (Vite + Vue 3 + TS + Element Plus + ECharts / Python + Django)

**核心目标:** **加载并评估****预先训练好**的联邦学习模型在图像识别任务上的效果，包括单张图片预测和训练过程指标（准确率、损失）的可视化展示。本系统不包含联邦学习训练过程本身。


### 第一部分：前端设计 (Vite + Vue 3 + TypeScript + Element Plus + ECharts)

**1. 技术栈:**

* **构建工具:** **Vite**
* **框架:** **Vue 3 (Composition API)**
* **语言:** **TypeScript**
* **UI 库:** **Element Plus (提供预制组件，简化开发)**
* **图表库:** **ECharts (通过** **vue-echarts** **或类似库集成)**
* **HTTP 请求:** **Axios**
* **状态管理:** **Pinia**
* **路由:** **Vue Router**


**2. 项目初始化 (使用 Vite):**

```
# 使用 npm
npm create vite@latest frontend --template vue-ts
# 或使用 yarn
# yarn create vite frontend --template vue-ts

cd frontend
npm install
npm install element-plus axios pinia vue-router echarts vue-echarts
```


**3. 项目结构 (Vite + Vue + TS):**


```
frontend/
├── index.html          # Vite 入口 HTML (位于根目录)
├── public/             # 静态资源 (不会被处理)
├── src/
│   ├── assets/         # 项目资源 (会被处理, 如 CSS, 图片)
│   │   └── main.css    # (可选) 全局样式
│   ├── components/     # 可复用 Vue 组件
│   │   ├── PredictionChart.vue
│   │   └── TrainingHistoryChart.vue
│   ├── layouts/        # 页面布局
│   │   └── DefaultLayout.vue
│   ├── pages/          # 页面级组件
│   │   ├── HomePage.vue
│   │   ├── InferencePage.vue
│   │   └── PerformancePage.vue
│   ├── router/         # Vue Router 配置 (index.ts)
│   ├── services/       # API 请求服务 (api.ts)
│   ├── store/          # Pinia 状态管理 (index.ts, modules/*.ts)
│   ├── types/          # TypeScript 类型定义
│   │   └── api.ts      # API 相关类型
│   │   └── index.ts    # 其他类型
│   ├── App.vue         # 根组件
│   └── main.ts         # 应用入口 (引入 Vue, Router, Pinia, Element Plus)
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts      # Vite 配置文件 (重要!)
```



**4. 页面设计 (使用 Element Plus 组件):**

* **main.ts** **(入口文件):**

  * **引入** **createApp** **from 'vue'**
  * **引入** **App** **from './App.vue'**
  * **引入** **router** **from './router'**
  * **引入** **pinia** **from './store'**
  * **引入** **ElementPlus** **from 'element-plus'**
  * **引入** **import 'element-plus/dist/index.css'** **(Element Plus 样式)**
  * **引入 ECharts 相关 (如果需要全局注册)**
  * **创建 Vue 应用:** **const app = createApp(App)**
  * **使用插件:** **app.use(pinia)**, **app.use(router)**, **app.use(ElementPlus)**
  * **挂载应用:** **app.mount('#app')**
* **DefaultLayout.vue** **(布局):**

  * **使用** **`<el-container direction="horizontal">`**。
  * **侧边栏:** **`<el-aside width="200px">`** **内含** **`<el-menu :default-active="$route.path" router>`**，包含指向各页面的 **`<el-menu-item>`**。
  * **主区域:** **`<el-container direction="vertical">`** **包含可选的** **`<el-header>`** **和** **`<el-main>`**。**`<el-main>`** **内放置** **`<router-view />`**。
* **HomePage.vue** **(主页面):**

  * **使用** **`<el-card>`** **包裹内容。**
  * **显著展示系统名称，例如使用** **`<h1>`** **或** **`<p style="font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0;">`联邦学习图像识别效果评估平台`</p>`**。
  * **添加简短的系统介绍文本** **`<p>`本平台用于加载和可视化展示预训练联邦学习模型的图像识别效果。`</p>`**。
* **InferencePage.vue** **(模型效果页面):**

  * **布局:** **可用** **`<el-row :gutter="20">`** **和** **`<el-col :span="10">`** **(左侧控制) 与** **`<el-col :span="14">`** **(右侧结果)。**
  * **左侧控制区 (**`<el-col :span="10">`**):**

    * **使用** **`<el-card header="模型与图像选择">`**。
    * **模型选择:** **`<el-form-item label="选择模型"><el-select v-model="selectedModelId" placeholder="请选择模型">`<el-option v-for="model in availableModels" ... />`</el-select></el-form-item>`**。
    * **图片上传:** **`<el-form-item label="上传图片"><el-upload action="#" :auto-upload="false" :on-change="handleFileChange" list-type="picture-card" :limit="1">``<el-icon><Plus />``</el-icon></el-upload>``</el-form-item>`**。 (需要导入 **Plus** **图标)。预览逻辑在** **handleFileChange** **中处理。**
    * **预测按钮:** **<el-button type="primary" @click="handlePredict" :loading="isLoadingPrediction">开始预测`</el-button>`**。
  * **右侧结果区 (**`<el-col :span="14">`**):**

    * **使用** **`<el-card header="预测结果">`**。
    * **加载状态:** **`<el-skeleton v-if="isLoadingPrediction" :rows="5" animated />`**。
    * **空状态:** **`<el-empty v-if="!predictionResult && !isLoadingPrediction" description="等待预测"></el-empty>`**。
    * **结果图表:** **`<PredictionChart v-if="predictionResult" :data="predictionResult" />`** **(自定义组件，封装 ECharts 柱状图)。**
    * **错误提示:** **`<el-alert v-if="predictionError" :title="predictionError" type="error" show-icon :closable="false"></el-alert>`**。
* **PerformancePage.vue** **(模型综合效果页面):**

  * **布局:** **可用一个** **`<el-card>`** **放选择器/上传，另一个** **`<el-card>`** **放图表。**
  * **数据源选择区:**

    * **(方案一: 后端管理)** **`<el-form-item label="选择模型">`<el-select v-model="selectedHistoryModelId" @change="loadHistoryData" placeholder="选择模型查看历史"><el-option ... />`</el-select></el-form-item>`**。
    * **(方案二: 用户上传)** **`<el-upload action="#" :auto-upload="false" :on-change="handleHistoryFileChange" :limit="1" accept=".json"><el-button type="success">`上传训练历史文件 (.json)`</el-button></el-upload>`**。
  * **图表展示区 (**`<el-card header="训练过程可视化">`**):**

    * **加载状态:** **`<el-skeleton v-if="isLoadingHistory" :rows="6" animated />`**。
    * **空状态:** **`<el-empty v-if="!trainingHistoryData && !isLoadingHistory" description="请选择模型或上传文件"></el-empty>`**。
    * **图表容器:** **`<div v-if="trainingHistoryData">`**

      * **`<el-row :gutter="20">`**

        * **`<el-col :span="12"><TrainingHistoryChart title="准确率" :rounds="trainingHistoryData.rounds" :values="trainingHistoryData.accuracies" />``</el-col>`**
        * **`<el-col :span="12"><TrainingHistoryChart title="损失" :rounds="trainingHistoryData.rounds" :values="trainingHistoryData.losses" />``</el-col>`**
      * **`</el-row>`**
      * **(可选) 显示总训练时间:** **`<p>`总训练时间: {{ trainingHistoryData.total_training_time }}`</p>`**
    * **错误提示:** **`<el-alert v-if="historyError" :title="historyError" type="error" show-icon :closable="false"></el-alert>`**。

**5. 状态管理 (Pinia -** **src/store/modules/modelStore.ts**):
(与之前设计类似)

* **availableModels**: **Ref<ModelInfo[]>**
* **selectedModelId**: **Ref<number | string | null>**
* **uploadedImageFile**: **Ref<File | null>** **(存储原始文件对象，或处理后的 base64)**
* **predictionResult**: **Ref<Prediction[] | null>**
* **isLoadingPrediction**: **Ref`<boolean>`**
* **predictionError**: **Ref<string | null>**
* **trainingHistoryData**: **Ref<TrainingHistoryData | null>**
* **isLoadingHistory**: **Ref`<boolean>`**
* **historyError**: **Ref<string | null>**
* **Actions:** **fetchAvailableModels**, **runPrediction**, **loadTrainingHistory** **(根据模型 ID 或上传的文件)。**

**6. API 服务 (**src/services/api.ts**):**
(与之前设计类似)

* **使用 Axios 实例。**
* **封装函数：**getModels()**,** **postPrediction(modelId, imageData)**, **getTrainingHistory(modelId)**。
* **定义好请求和响应的 TypeScript 类型 (**src/types/api.ts**)。**



**7. Vite 配置 (**vite.config.ts**):**

* **可能需要配置** **server.proxy** **来解决开发环境下的跨域问题，将** **/api** **请求转发给 Django 后端。**

  ```typescript
  import { defineConfig } from 'vite'
  import vue from '@vitejs/plugin-vue'
  ```
* ```typescript
   export default defineConfig({
     plugins: [vue()],
     server: {
       proxy: {
         // 字符串简写写法
         // '/api': 'http://localhost:8000',
         // 选项写法
         '/api': {
           target: 'http://127.0.0.1:8000', // 后端服务实际地址
           changeOrigin: true, // 需要虚拟主机站点
           // rewrite: (path) => path.replace(/^\/api/, '') // 如果后端接口不带 /api 前缀，需要重写
         }
       }
     }
   })
  ```


* **如果使用 Element Plus 按需导入，需要配置相关插件 (**unplugin-vue-components**,** **unplugin-auto-import**)。




### 第二部分：后端设计 (Python + Django + DRF)


**1. 技术栈:**

* **语言:** **Python 3**
* **框架:** **Django**
* **API 框架:** **Django Rest Framework (DRF)**
* **数据库:** **PostgreSQL / MySQL / SQLite (开发用 SQLite 足够)**
* **模型运行库:**  **PyTorch (根据你的模型选择)**
* **图像处理:** **Pillow**
* **CORS:** **django-cors-headers**


```
backend/
├── manage.py
├── project_name/      # Django 项目配置 (settings.py, urls.py...)
├── api/               # Django App for API logic (models.py, serializers.py, views.py, urls.py...)
│   └── services/      # (可选) 放置模型加载和推理逻辑 (inference_service.py)
├── media/             # 存储模型文件和历史记录 (配置 MEDIA_ROOT)
│   └── models/
│       ├── model_a/
│       │   ├── model.h5 / model.pth
│       │   └── history.json
│       └── ...
├── requirements.txt
└── .env               # (可选) 环境变量
```




**3. 数据库模型 (**api/models.py**):** **(与之前设计相同)**

* **PretrainedModel** **类，包含** **name**, **description**, **framework**, **model_file** **(路径),** **history_file** **(路径),** **class_labels** **(JSON),** **input_shape** **(JSON) 等字段。**
* **重要:** **需要手动将模型文件 (如** **.h5**, **.pth**) 和 **history.json** **文件放到** **media/models/** **下对应的子目录，并在数据库中创建** **PretrainedModel** **记录，填入正确的文件相对路径和类别标签。**

**4. 序列化器 (**api/serializers.py**):** **(与之前设计相同)**

* **BaseModelSerializer**: 用于列表展示模型基本信息 (**id**, **name**, **description**)。
* **PredictionRequestSerializer**: 验证 **/api/predict/** **请求体 (**model_id**,** **image_data** **- base64 字符串)。**
* **PredictionResultSerializer**: 格式化单条预测结果 (**label**, **probability**)。

**5. 视图 (**api/views.py**):** **(与之前设计相同，重点回顾)**

* **ModelListView (generics.ListAPIView)**: 返回所有 **PretrainedModel** **的基本信息列表 (GET** **/api/models/**)。
* **PredictView (views.APIView)**:

  * **接收 POST 请求到** **/api/predict/**。
  * **使用** **PredictionRequestSerializer** **验证输入。**
  * **根据** **model_id** **查找** **PretrainedModel** **记录。**
  * **加载模型:** **(可添加缓存) 调用** **load_model_from_file** **函数，根据** **framework** **加载 TF 或 PyTorch 模型。**
  * **处理图像:** **解码 Base64 图片数据，使用 Pillow 进行打开、转换 (RGB)、缩放 (根据** **input_shape**)。
  * **预处理:** **将图像转为 NumPy 数组，归一化 (需与模型训练时一致)，增加 Batch 维度，可能调整维度顺序 (如 PyTorch 的 NCHW)。**
  * **推理:** **调用** **model.predict()** **(TF) 或** **model(input_tensor)** **(PyTorch)。**
  * **格式化输出:** **将预测概率与** **class_labels** **结合，使用** **PredictionResultSerializer** **序列化成** **[{label: "cat", probability: 0.9}, ...]** **格式，包含在** **{"predictions": [...]}** **中返回。**
  * **错误处理:** **捕获文件未找到、图像处理错误、模型加载/推理错误、标签数量不匹配等异常，返回合适的 HTTP 状态码和错误信息。**
* **TrainingHistoryView (views.APIView)**:

  * **接收 GET 请求到** **/api/models/{model_id}/training_history/**。
  * **根据** **model_id** **查找** **PretrainedModel** **记录，获取** **history_file** **路径。**
  * **读取对应的** **history.json** **文件。**
  * **验证 JSON:** **确保包含** **rounds**, **accuracies**, **losses** **等必要键。**
  * **返回 JSON 文件内容。**
  * **错误处理:** **捕获文件未找到、JSON 解析错误等。**

**6. URL 配置 (**api/urls.py**,** **project_name/urls.py**): **(与之前设计相同)**

* **在** **api/urls.py** **中定义** **/models/**, **/predict/**, **/models/[int:model_id](int:model_id)/training_history/** **路由。**
* **在** **project_name/urls.py** **中** **include('api.urls')** **到** **/api/** **路径下。**

**7. 设置 (**project_name/settings.py**):** **(与之前设计相同)**

* **添加** **'rest_framework'**, **'api'**, **'corsheaders'** **到** **INSTALLED_APPS**。
* **添加** **'corsheaders.middleware.CorsMiddleware'** **到** **MIDDLEWARE** **(通常放在靠前位置)。**
* **配置** **CORS_ALLOWED_ORIGINS** **允许来自 Vite 开发服务器的源 (例如** **http://localhost:5173** **或** **http://127.0.0.1:5173**)。生产环境需要配置前端部署的域名。
* **配置** **MEDIA_URL = '/media/'** **和** **MEDIA_ROOT = os.path.join(BASE_DIR, 'media')**。



### 第三部分：开发与集成

* **启动后端:** **cd backend && python manage.py runserver** **(通常在** **http://127.0.0.1:8000**)。
* **启动前端:** **cd frontend && npm run dev** **(通常在** **http://localhost:5173**)。
* **访问前端:** **在浏览器中打开 Vite 提供的地址。**
* **交互:** **前端页面通过 Axios 向后端 API (**/api/...**) 发送请求。如果配置了 Vite 代理，前端可以直接请求** **/api/...**；否则需要请求完整后端地址 **http://127.0.0.1:8000/api/...** **(并确保 CORS 配置正确)。**
* **调试:** **使用浏览器开发者工具查看网络请求和前端日志，使用 Django/Python 的调试工具查看后端日志和错误。**
