// frontend/src/hooks/useWebSocket.ts

import { useEffect, useRef } from 'react';
import { useMarketStore } from '../store/useMarketStore';

// *** 🚨 关键配置：请修改为后端实际运行的端口 🚨 ***
const WS_URL = 'ws://localhost:3001'; 
const RECONNECT_INTERVAL = 5000;

export const useWebSocket = () => {
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimerRef = useRef<number | null>(null);
    const setCurrentPrice = useMarketStore(state => state.setCurrentPrice);

    const connect = () => {
        // 清理旧的定时器
        if (reconnectTimerRef.current !== null) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }

        // 尝试创建新的 WebSocket 连接
        try {
            console.log("Attempting to connect to:", WS_URL);
            wsRef.current = new WebSocket(WS_URL);
        } catch (error) {
            console.error("Failed to create WebSocket instance:", error);
            reconnectTimerRef.current = setTimeout(() => connect(), RECONNECT_INTERVAL) as unknown as number;
            return; 
        }

        wsRef.current.onopen = () => {
            console.log("WebSocket connected successfully.");
        };

        wsRef.current.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'tick' && message.data.price) {
                    setCurrentPrice(message.data.price);
                }
            } catch (error) {
                console.error("Failed to parse WebSocket message:", error);
            }
        };

        wsRef.current.onclose = (event) => {
            console.log(`WebSocket disconnected. Code: ${event.code}. Reconnecting in ${RECONNECT_INTERVAL / 1000}s...`);
            reconnectTimerRef.current = setTimeout(() => connect(), RECONNECT_INTERVAL) as unknown as number;
        };

        wsRef.current.onerror = (error) => {
            console.error("WebSocket error occurred. Closing connection.", error);
            wsRef.current?.close(); 
        };
    };

    useEffect(() => {
        connect(); 

        return () => {
            if (reconnectTimerRef.current !== null) {
                clearTimeout(reconnectTimerRef.current);
            }
            if (wsRef.current) {
                // 确保卸载时不会触发重连
                wsRef.current.onclose = null; 
                wsRef.current.close(); 
                console.log("WebSocket connection cleaned up.");
            }
        };
    }, []);
};