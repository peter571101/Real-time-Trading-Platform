// frontend/src/pages/Dashboard.tsx

import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import * as echarts from 'echarts'; 
import { fetchHistoryData } from '../api';
import type { CandlestickData } from '../api'; 

const Dashboard: React.FC = () => {
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();
    
    // ECharts 容器的引用
    const chartRef = useRef<HTMLDivElement>(null);
    
    // K线数据状态
    const [chartData, setChartData] = useState<CandlestickData[]>([]);
    const [loading, setLoading] = useState(true);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    
    // 1. 获取数据的 useEffect
    useEffect(() => {
        const loadData = async() => {
            try {
                const data = await fetchHistoryData();
                setChartData(data);
            } catch(error) {
                console.error("获取历史数据失败:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []); 

    // 2. 渲染图表的 useEffect
    useEffect(() => {
        if (!chartRef.current || chartData.length === 0) {
            return;
        }
        const myChart = echarts.init(chartRef.current);
        
        // 数据格式转换
        const dates = chartData.map(item => new Date(item[0]).toLocaleDateString());
        const values = chartData.map(item => item.slice(1, 5)); 
        const volumes = chartData.map(item => item[5]); 

        const option = {
            title: { text: '模拟市场K线图', left: 'center' },
            tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
            legend: { data: ['K线图', '交易量'], bottom: 0 },
            grid: [
                { left:'3%', right:'3%', top: '10%', height:'50%' }, // K线图区域，调整左右边距
                { left:'3%', right:'3%', height:'15%', bottom:'10%' } // 交易量区域，调整左右边距
            ],
            xAxis: [
                { type: 'category', data: dates, boundaryGap: false, axisLine: { onZero: false } },
                { type: 'category', data: dates, gridIndex: 1, boundaryGap: false, axisLine: { onZero: false } }
            ],
            yAxis: [
                { scale: true, name: '价格', position: 'right' }, 
                { scale: true, gridIndex: 1, name: '交易量', splitNumber: 2 } 
            ],
            series: [
                {
                    name: 'K线图',
                    type: 'candlestick',
                    data: values,
                    itemStyle: {
                        color: '#ef232a', 
                        color0: '#14b281', 
                        borderColor: '#ed232a',
                        borderColor0: '#14b281'
                    },
                    xAxisIndex: 0,
                    yAxisIndex: 0, 
                },
                {
                    name: '交易量',
                    type: 'bar',
                    data: volumes,
                    xAxisIndex: 1, 
                    yAxisIndex: 1, 
                    itemStyle: { color: '#7f7f7f'}
                }
            ]
        };
        
        myChart.setOption(option);
        
        window.addEventListener('resize', myChart.resize);

        return () => {
            myChart.dispose(); 
            window.removeEventListener("resize", myChart.resize);
        };
    }, [chartData]); 

    return (
        // ⭐️ 外层容器占满整个视口，并使用 Flex 布局
        <div style={styles.fullScreenContainer}> 
            <div style={styles.header}>
                <h2>市场仪表盘</h2>
                <button onClick={handleLogout} style={styles.logoutButton}>
                    退出登录
                </button>
            </div>
            {loading ? (
                <p>正在加载数据...</p>
            ) : (
                // ⭐️ 图表父容器，占据剩余空间
                <div style={styles.chartWrapper}>
                    <div 
                        ref={chartRef} 
                        // ECharts 容器设置为 100% 才能填充其父容器
                        style={styles.chartContainer}
                    />
                </div>
            )}
        </div>
    );
};

// ⭐️ 样式定义
const styles = {
    // 占满整个视口高度，并开启 Flex 布局
    fullScreenContainer: {
        height: '100vh', 
        width: '100vw',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column', 
        backgroundColor: '#f5f5f5', 
    },
    // 头部样式
    header: {
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
    },
    logoutButton: {
        padding: '8px 15px',
        cursor: 'pointer',
    },
    // 图表父容器，使用 flexGrow: 1 占据剩余垂直空间
    chartWrapper: {
        flexGrow: 1, 
        minHeight: 0, 
        width: '100%',
    },
    // ECharts 渲染容器
    chartContainer: {
        width: '100%',
        height: '100%', 
    }
};

export default Dashboard;