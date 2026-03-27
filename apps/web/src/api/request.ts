import axios from 'axios';

const request = axios.create({
  baseURL: import.meta.env.DEV ? '/api' : '/',
  timeout: 10000,
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 可以在这里添加 token 等统一逻辑
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 处理统一响应结构: { code, data, message }
    const res = response.data;
    
    // 假设非 0 为业务错误
    if (res && typeof res.code === 'number' && res.code !== 0) {
      console.error('[API Error]:', res.message);
      return Promise.reject(new Error(res.message || 'Error'));
    }
    
    // 返回真实的业务数据部分，如果没有 code 结构可能就是直接数据（兼容旧的或特殊接口）
    if (res && res.code === 0) {
      return res.data;
    }
    
    return res;
  },
  (error) => {
    // 可以在这里统一处理错误提示
    return Promise.reject(error);
  }
);

export default request;
