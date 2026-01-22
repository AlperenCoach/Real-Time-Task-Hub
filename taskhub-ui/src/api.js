import axios from 'axios';
import { Platform } from 'react-native';

// Bilgisayarınızın yerel IP adresini buraya girin
// Windows'ta bulmak için: ipconfig | findstr /i "IPv4"
// Mac/Linux'ta bulmak için: ifconfig | grep "inet "
// Genellikle 192.168.x.x veya 10.0.x.x formatındadır
// NOT: IP adresiniz değişirse burayı güncelleyin
const LOCAL_IP = '192.168.1.196'; // Bu IP'yi kendi bilgisayarınızın IP'si ile değiştirin

const getBaseURL = () => {
  // Web platformu için localhost kullan
  if (Platform.OS === 'web') {
    return 'http://localhost:5086/api';
  }
  
  // Android emulator için özel IP
  if (Platform.OS === 'android') {
    // Android emulator için 10.0.2.2 kullan (localhost'un emulator karşılığı)
    // Gerçek Android cihaz için LOCAL_IP kullanılmalı
    // Expo Go kullanıyorsanız LOCAL_IP kullanın
    return `http://${LOCAL_IP}:5086/api`;
  }
  
  // iOS simulator ve gerçek iOS cihaz için bilgisayarın IP'si
  // iOS simulator localhost'u desteklemez, bu yüzden IP kullanmalıyız
  return `http://${LOCAL_IP}:5086/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000, // 10 saniye timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - gönderilen istekleri logla
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.baseURL + config.url);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Error interceptor - hataları daha iyi görmek için
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.status, error.response.data);
      console.error('Full URL:', error.config?.baseURL + error.config?.url);
    } else if (error.request) {
      // Request made but no response received
      console.error('Network Error:', error.message);
      console.error('Full URL:', error.config?.baseURL + error.config?.url);
      console.error('Base URL:', error.config?.baseURL);
      console.error('Request Path:', error.config?.url);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export const getTasks = () => api.get('/tasks');
export const createTask = (task) => api.post('/tasks', task);
export const updateTask = (id, task) => api.put(`/tasks/${id}`, task);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);
export const getTotalCompletedTasksAsync = () => {
  console.log('Calling getTotalCompletedTasks, URL: /tasks/counter');
  return api.get('/tasks/counter').then(response => {
    console.log('getTotalCompletedTasks response:', response);
    console.log('getTotalCompletedTasks response.data:', response.data);
    return response;
  }).catch(error => {
    console.error('getTotalCompletedTasks error:', error);
    throw error;
  });
};