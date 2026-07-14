import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
    throw new Error('VITE_API_URL is not configured.');
}

export const apiClient = axios.create({
    baseURL: apiUrl,
    withCredentials: true,
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
});