import axios from 'axios'

const API_BASE_URL = 'http://localhost:5005/api';

interface LoginResponse {
    token: string;
    username: string;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
    const response  = await axios.post(`${API_BASE_URL}/login`,{
        username,
        password
    });

    return response.data.data;
}

export type CandlestickData = [number, number, number, number, number, number];

interface HistoryResponse {
    data: CandlestickData[];
}

export async function fetchHistoryData(): Promise<CandlestickData[]> {
    const response = await axios.get<HistoryResponse>(`${API_BASE_URL}/history`)

    return response.data.data;
}