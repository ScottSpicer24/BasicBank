import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// create a new axios instance as API
export const API = axios.create({
    baseURL: API_URL,
})

// Add a request interceptor to the API instance
API.interceptors.request.use((config) => {
    // get the token from the local storage
    const token = localStorage.getItem('token')
    if (token) {
        // add the token to the headers
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})
