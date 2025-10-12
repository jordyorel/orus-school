import axios from "axios";

const api = axios.create({
  baseURL: "/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

export async function fetchLesson<T = unknown>(courseId: number, lessonId: number): Promise<T> {
  const { data } = await api.get<T>(`/courses/${courseId}/lessons/${lessonId}`);
  return data;
}

export async function fetchNextLesson<T = unknown>(courseId: number, lessonId: number): Promise<T> {
  const { data } = await api.get<T>(`/courses/${courseId}/lessons/${lessonId}/next`);
  return data;
}
