// frontend/src/hooks/useWebSocket.ts

import { useEffect, useRef } from 'react';
import { useMarketStore } from '../store/useMarketStore'; // 假设路径正确

const WS_URL = process.env.NODE_ENV === 'production' 
    ? 'wss://your-prod-domain.com/ws' 
    : 'ws://localhost:3001'; // 确保端口与 server.js 一致

export const useWebSocket = () => {
    const wsRef = useRef<WebSocket | null>(null);
    const { setCurrentPrice, setLastTickVolume } = useMarketStore.getState();

    const connect = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            return;
        }

        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('WebSocket connected successfully.');
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                
                if (message.type === 'tick' && message.data) {
                    const { price, volume } = message.data;
                    setCurrentPrice(price);
                    setLastTickVolume(volume); // ⭐️ 关键：更新成交量
                }
            } catch (error) {
                console.error("Failed to parse WebSocket message:", error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onclose = (event) => {
            console.log('WebSocket connection closed.', event.reason);
            // 断线重连逻辑
            setTimeout(connect, 5000); 
        };
    };

    useEffect(() => {
        connect();
        return () => {
            if (wsRef.current) {
                wsRef.current.close(1000, "Component unmount");
            }
        };
    }, []);
};