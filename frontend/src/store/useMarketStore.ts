// frontend/src/store/useMarketStore.ts

import { create } from 'zustand';

interface MarketState {
    currentPrice: number;
}

interface MarketActions {
    setCurrentPrice: (price: number) => void;
}

type MarketStore = MarketState & MarketActions;

export const useMarketStore = create<MarketStore>((set) => ({
    // 状态初始化
    currentPrice: 0, // 初始价格设置为 0，但我们会在组件中使用它来判断加载状态

    // 动作实现
    setCurrentPrice: (price) => set({ currentPrice: price }),
}));