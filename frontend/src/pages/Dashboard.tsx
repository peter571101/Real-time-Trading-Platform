// frontend/src/pages/Dashboard.tsx

import { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useMarketStore } from '../store/useMarketStore';

// 假设我们有一个获取历史数据的 Hook 或函数
// import { fetchHistoryData } from '../api/data'; 

function Dashboard() {
    // ----------------------------------------------------
    // 1. 启动 WebSocket 监听 (核心)
    // ----------------------------------------------------
    useWebSocket(); // 只需要调用一次，它会在后台管理连接和 Store 更新
    
    // ----------------------------------------------------
    // 2. 从 Store 中获取实时价格
    // ----------------------------------------------------
    const currentPrice = useMarketStore(state => state.currentPrice);

    // 3. 示例：获取历史数据（确保您的历史数据请求没有问题）
    const [historyLoaded, setHistoryLoaded] = useState(false);

    useEffect(() => {
        // 模拟调用您的 /api/history
        // fetchHistoryData().then(data => { /* ... */ setHistoryLoaded(true); });
        
        // 假设历史数据已加载
        setHistoryLoaded(true); 
    }, []);

    // ----------------------------------------------------
    // 4. 渲染逻辑 (关键：处理初始加载状态)
    // ----------------------------------------------------
    
    // 如果历史数据或初始状态未准备好，显示加载中，避免白屏
    if (!historyLoaded || currentPrice === 0) { 
        // 🚨 检查点：currentPrice 初始值是 0，如果这里不处理，组件可能会崩溃
        return <div>数据加载中...</div>; 
    }

    // 渲染 UI
    return (
        <div className="dashboard-container">
            <h1>📊 实时市场面板</h1>
            
            {/* 实时价格展示 */}
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: currentPrice > 1000 ? 'green' : 'red' }}>
                当前价格: ${currentPrice.toFixed(2)}
            </div>
            
            <p>（价格每 500ms 变动并更新，这是实时数据）</p>
            
            {/* 假设图表等其他组件在这里 */}
        </div>
    );
}

export default Dashboard;