import axios from "axios";

export const API_URL = 'http://localhost:9080'; 

const apiClient = axios.create({
  baseURL: API_URL, 
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

export const api = apiClient;