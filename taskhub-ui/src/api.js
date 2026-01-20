import axios from 'axios';
import { Platform } from 'react-native';

// Android emulator için özel IP, gerçek cihaz için bilgisayarın IP'si gerekir
// iOS simulator için localhost çalışır
const getBaseURL = () => {
  if (Platform.OS === 'android') {
    // Android emulator için
    return 'https://10.0.2.2:7053/api';
    // Gerçek Android cihaz için bilgisayarın yerel IP'sini kullanın:
    // return 'https://192.168.1.XXX:7053/api';
  }
  // iOS ve web için
  return 'https://localhost:7053/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
});

// Development için self-signed certificate hatasını yok say
if (__DEV__) {
  // React Native'de axios varsayılan olarak certificate validation yapar
  // Development için bu kontrolü atlayabiliriz
}

export const getTasks = () => api.get('/tasks');
export const createTask = (task) => api.post('/tasks', task);
