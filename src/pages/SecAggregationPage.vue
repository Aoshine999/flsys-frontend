<template>
  <div class="sec-aggregation-container">
    <el-card class="image-card">
      <template #header>
        <div class="card-header">
          <h2>安全聚合示意图</h2>
        </div>
      </template>
      <div class="image-container">
        <img src="../assets/sec_aggregation.png" alt="安全聚合示意图" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
// 无需额外的逻辑
</script>

<style scoped>
.sec-aggregation-container {
  padding: clamp(10px, 2vw, 20px);
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.image-card {
  height: 100%;
  width: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.card-header {
  text-align: center;
  width: 100%;
}

.card-header h2 {
  margin: 0;
  font-size: clamp(16px, 2vw, 20px);
  color: #303133;
}

.image-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: clamp(5px, 1vw, 10px);
  min-height: 0;
  overflow: auto;
  width: 100%;
  height: 100%;
}

.image-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  width: auto;
  height: auto;
}

@media (max-width: 768px) {
  .sec-aggregation-container {
    padding: 10px;
  }
  
  .image-container {
    padding: 5px;
  }
}

@media (orientation: portrait) {
  .image-container img {
    width: 100%;
    height: auto;
  }
}

@media (orientation: landscape) {
  .image-container img {
    height: 100%;
    width: auto;
  }
}
</style> 