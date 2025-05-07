<template>
  <div class="login-container">
    <div class="login-content">
      <div class="login-left">
        <div class="system-title">
          <h1>联邦学习系统</h1>
          <p>分布式机器学习解决方案平台</p>
        </div>
      </div>
      <div class="login-right">
        <el-card class="login-card">
          <div class="login-header">
            <h2>{{ isLogin ? '系统登录' : '用户注册' }}</h2>
          </div>
          <!-- 登录表单 -->
          <el-form 
            v-if="isLogin"
            ref="loginFormRef" 
            :model="loginForm" 
            :rules="loginRules" 
            label-position="top"
            size="large"
          >
            <el-form-item label="用户名" prop="username">
              <el-input 
                v-model="loginForm.username"
                placeholder="请输入用户名"
                prefix-icon="User"
              />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input 
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                prefix-icon="Lock"
                show-password
              />
            </el-form-item>
            <el-form-item>
              <el-button 
                type="primary" 
                :loading="loading" 
                @click="handleLogin" 
                style="width: 100%;"
                size="large"
              >
                登录
              </el-button>
            </el-form-item>
            <div class="form-footer">
              <span>没有账号？</span>
              <el-button type="text" @click="toggleForm">立即注册</el-button>
            </div>
          </el-form>
          
          <!-- 注册表单 -->
          <el-form 
            v-else
            ref="registerFormRef" 
            :model="registerForm" 
            :rules="registerRules" 
            label-position="top"
            size="large"
          >
            <el-form-item label="用户名" prop="username">
              <el-input 
                v-model="registerForm.username"
                placeholder="请输入用户名"
                prefix-icon="User"
              />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input 
                v-model="registerForm.password"
                type="password"
                placeholder="请输入密码"
                prefix-icon="Lock"
                show-password
              />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input 
                v-model="registerForm.confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                prefix-icon="Lock"
                show-password
              />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input 
                v-model="registerForm.email"
                placeholder="请输入邮箱"
                prefix-icon="Message"
              />
            </el-form-item>
            <el-form-item label="姓名" prop="fullName">
              <el-input 
                v-model="registerForm.fullName"
                placeholder="请输入姓名"
                prefix-icon="User"
              />
            </el-form-item>
            <el-form-item>
              <el-button 
                type="primary" 
                :loading="loading" 
                @click="handleRegister" 
                style="width: 100%;"
                size="large"
              >
                注册
              </el-button>
            </el-form-item>
            <div class="form-footer">
              <span>已有账号？</span>
              <el-button type="text" @click="toggleForm">返回登录</el-button>
            </div>
          </el-form>
        </el-card>
      </div>
    </div>
    <div class="login-footer">
      <p>© 2024 联邦学习系统 版权所有</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, FormInstance } from 'element-plus'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const loginFormRef = ref<FormInstance>()
const registerFormRef = ref<FormInstance>()
const isLogin = ref(true)

const loginForm = reactive({
  username: '',
  password: ''
})

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  fullName: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
  ]
}

const validatePass = (rule: any, value: string, callback: any) => {
  if (value === '') {
    callback(new Error('请输入密码'))
  } else if (value.length < 6) {
    callback(new Error('密码长度不能小于6位'))
  } else {
    if (registerForm.confirmPassword !== '') {
      registerFormRef.value?.validateField('confirmPassword')
    }
    callback()
  }
}

const validatePass2 = (rule: any, value: string, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const validateEmail = (rule: any, value: string, callback: any) => {
  if (value === '') {
    callback()
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      callback(new Error('请输入有效的邮箱地址'))
    } else {
      callback()
    }
  }
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应在3-20个字符之间', trigger: 'blur' }
  ],
  password: [
    { validator: validatePass, trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validatePass2, trigger: 'blur' }
  ],
  email: [
    { validator: validateEmail, trigger: 'blur' }
  ]
}

const toggleForm = () => {
  isLogin.value = !isLogin.value
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await authStore.login(loginForm.username, loginForm.password)
        ElMessage.success('登录成功')
        router.push('/')
      } catch (error: any) {
        ElMessage.error(error.message || '登录失败')
      } finally {
        loading.value = false
      }
    }
  })
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await authStore.register(
          registerForm.username, 
          registerForm.password,
          registerForm.email || undefined,
          registerForm.fullName || undefined
        )
        ElMessage.success('注册成功')
        router.push('/')
      } catch (error: any) {
        ElMessage.error(error.message || '注册失败')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100vh;
  width: 100%;
  background: linear-gradient(120deg, #e0f7fa 0%, #f3f9ff 100%);
  position: relative;
  overflow: hidden;
}

.login-container::before {
  content: '';
  position: absolute;
  width: 200vw;
  height: 200vw;
  border-radius: 50%;
  background: linear-gradient(45deg, #409eff20, #409eff10);
  top: -150vw;
  right: -100vw;
  z-index: 0;
}

.login-container::after {
  content: '';
  position: absolute;
  width: 150vw;
  height: 150vw;
  border-radius: 50%;
  background: linear-gradient(45deg, #409eff15, #409eff05);
  bottom: -100vw;
  left: -80vw;
  z-index: 0;
}

.login-content {
  display: flex;
  width: 80%;
  max-width: 1400px;
  min-width: 320px;
  height: min(600px, 80vh);
  min-height: 400px;
  margin: auto;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 1;
  backdrop-filter: blur(8px);
}

.login-left {
  flex: 1;
  background: linear-gradient(135deg, #409eff 0%, #64b5f6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  padding: clamp(20px, 5vw, 60px);
}

.system-title {
  text-align: center;
}

.system-title h1 {
  font-size: clamp(28px, 3vw, 42px);
  font-weight: 600;
  margin-bottom: clamp(8px, 1.5vw, 24px);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.system-title p {
  font-size: clamp(16px, 1.5vw, 20px);
  opacity: 0.8;
}

.login-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(20px, 5vw, 60px);
}

.login-card {
  width: 100%;
  max-width: 450px;
  border-radius: 12px;
  background-color: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.login-header {
  text-align: center;
  margin-bottom: clamp(20px, 4vh, 40px);
}

.login-header h2 {
  font-size: clamp(24px, 2vw, 32px);
  font-weight: 500;
  margin: 0;
  color: #409eff;
}

.login-footer {
  text-align: center;
  padding: 16px;
  color: #606266;
  font-size: 14px;
  z-index: 1;
}

/* 超宽屏适配 */
@media (min-aspect-ratio: 16/9) {
  .login-content {
    width: min(80%, 1800px);
    height: min(70vh, 700px);
  }
  
  .login-left {
    flex: 1.2;
  }
  
  .login-right {
    flex: 0.8;
  }
}

/* 大屏幕适配 */
@media (min-width: 1600px) {
  .login-content {
    max-width: 1600px;
  }
  
  .login-card {
    max-width: 500px;
  }
  
  .system-title h1 {
    margin-bottom: 24px;
  }
}

/* 4K及更高分辨率屏幕 */
@media (min-width: 2560px) {
  .login-content {
    max-width: 1800px;
  }
  
  .login-footer {
    font-size: 16px;
    padding: 24px;
  }
}

/* 标准响应式设计（保留原有的） */
@media (max-width: 1200px) {
  .login-content {
    width: 90%;
  }
}

@media (max-width: 992px) {
  .login-content {
    height: auto;
    flex-direction: column;
    width: 80%;
    max-width: 600px;
  }
  
  .login-left, .login-right {
    padding: 30px;
  }
}

@media (max-width: 768px) {
  .login-content {
    width: 90%;
    margin: 30px auto;
  }
  
  .login-left {
    padding: 20px;
  }
  
  .system-title h1 {
    font-size: 28px;
  }
  
  .system-title p {
    font-size: 16px;
  }
}

@media (max-width: 576px) {
  .login-content {
    width: 95%;
    background: transparent;
    box-shadow: none;
    backdrop-filter: none;
  }
  
  .login-left {
    display: none;
  }
  
  .login-right {
    padding: 20px 0;
  }
  
  .login-card {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
}

/* 处理较小高度的屏幕 */
@media (max-height: 700px) {
  .login-content {
    height: min(90vh, 500px);
    min-height: 350px;
  }
  
  .login-header {
    margin-bottom: 15px;
  }
  
  .el-form-item {
    margin-bottom: 15px;
  }
}

.form-footer {
  text-align: center;
  margin-top: 15px;
  font-size: 14px;
}
</style> 