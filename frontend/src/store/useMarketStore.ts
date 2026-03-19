// frontend/src/store/useMarketStore.ts

import { create } from 'zustand';

interface MarketState {
    currentPrice: number;
    lastTickVolume: number; // 存储后端推送的单次成交量
    setCurrentPrice: (price: number) => void;
    setLastTickVolume: (volume: number) => void; // 更新单次成交量
}

export const useMarketStore = create<MarketState>((set) => ({
    currentPrice: 0,
    lastTickVolume: 0, // 初始为 0
    
    setCurrentPrice: (price) => set({ currentPrice: price }),
    setLastTickVolume: (volume) => set({ lastTickVolume: volume }),
}));