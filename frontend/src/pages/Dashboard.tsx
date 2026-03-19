// frontend/src/pages/Dashboard.tsx

import React, { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";
import { fetchHistoryData } from "../api"; 
import type { CandlestickData } from "../api"; // 假设您的接口文件路径正确
import { useMarketStore } from "../store/useMarketStore";
import { useWebSocket } from "../hooks/useWebSocket"; // 假设您已经实现了这个 Hook

// K 线周期配置：根据您的后端 generateHistoryData 间隔，这里使用  1分钟线
const BAR_INTERVAL_MS = 60 * 1000;
const DEFAULT_VOLUME = 15; // 默认每次 Tick 增加的交易量（简化处理）
const MAX_DATA_POINTS = 200; // 内存中最多保留 200 根柱子

const Dashboard: React.FC = () => {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  // 启动 WebSocket 连接
  useWebSocket();

  // ECharts 容器的引用
  const chartRef = useRef<HTMLDivElement>(null);

  // K线数据状态 (会被实时更新)
  const [allChartData, setAllChartData] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isChartInitialized, setIsChartInitialized] = useState(false);

  //  核心：用于 K 线聚合的引用
  const lastBarTimeRef = useRef(0); // 存储当前正在绘制的K线的起始时间戳

  // 从 useMarketStore 订阅实时价格
  const currentPrice = useMarketStore((state) => state.currentPrice);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // 1. 获取历史数据的 useEffect (仅在组件挂载时执行)
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchHistoryData();
        setAllChartData(data); // 使用历史数据初始化图表数据

        // 初始化 lastBarTimeRef 为历史数据最后一根 K 线的起始时间
        if (data.length > 0) {
          lastBarTimeRef.current = data[data.length - 1][0];
        }
      } catch (error) {
        console.error("获取历史数据失败:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 2. 渲染图表的 useEffect (初始化图表结构)
  useEffect(() => {
    //等待chartRef绑定的样式创建好创建和数据加载好
    if (!chartRef.current || allChartData.length === 0) {
      return;
    }

    const myChart =
      echarts.getInstanceByDom(chartRef.current) ||
      echarts.init(chartRef.current);
    const resizeHandler = () => myChart.resize();

    // 仅在图表未设置 option 时执行全量渲染
    if (!myChart.getOption() || !isChartInitialized) {
      // 数据格式转换
      const dates = allChartData.map((item) =>
        new Date(item[0]).toLocaleTimeString()
      );
      const values = allChartData.map((item) => item.slice(1, 5)); // [O, C, L, H]
      const volumes = allChartData.map((item) => item[5]);

      // ECharts 配置 (保持您的原有配置，但新增 dataZoom)
      //EChartsOption是TS专属的类型，用于类型检查
      const option: EChartsOption = {
        title: { text: "模拟市场K线图", left: "center" },
        tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
        legend: { data: ["K线图", "交易量"], bottom: 0 },

        dataZoom: [
          {
            type: "inside",
            xAxisIndex: [0, 1],
            startValue: allChartData.length - 50,
            endValue: allChartData.length - 1,
          },
          {
            type: "slider",
            xAxisIndex: [0, 1],
            startValue: allChartData.length - 50,
            endValue: allChartData.length - 1,
            bottom: 10,
            height: 20,
          },
        ],

        grid: [
          { left: "3%", right: "3%", top: "10%", height: "50%" },
          { left: "3%", right: "3%", bottom: "10%", height: "15%" },
        ],
        xAxis: [
          {
            type: "category",
            data: dates,
            boundaryGap: true,
            axisLine: { onZero: false },
          },
          {
            type: "category",
            data: dates,
            gridIndex: 1,
            boundaryGap: false,
            axisLine: { onZero: false },
          },
        ],
        yAxis: [
          { scale: true, name: "价格", position: "right" },
          { scale: true, gridIndex: 1, name: "交易量", splitNumber: 2 },
        ],
        series: [
          {
            name: "K线图",
            type: "candlestick",
            data: values,
            xAxisIndex: 0,
            yAxisIndex: 0,
            itemStyle: {
              color: "#eb5454",
              color0: "#47b262",
              borderColor: "#eb5454",
              borderColor0: "#47b262",
            },
          },
          {
            name: "交易量",
            type: "bar",
            data: volumes,
            xAxisIndex: 1,
            yAxisIndex: 1,
            itemStyle: { color: "#7f7f7f" },
          },
        ],
      };

      myChart.setOption(option, true);
      setIsChartInitialized(true);
      window.addEventListener("resize", resizeHandler);
    }

    return () => {
      const instance = echarts.getInstanceByDom(
        chartRef.current as HTMLDivElement
      );
      if (instance) {
        instance.dispose();
        window.removeEventListener("resize", resizeHandler);
      }
    };
  }, [allChartData]); // 依赖历史数据加载来初始化

  // ------------------------------------------------------------------
  // 3. 核心：实时 K 线和交易量增量更新
  // ------------------------------------------------------------------
  useEffect(() => {
    // 确保图表初始化完成且有有效价格
    if (
      !isChartInitialized ||
      currentPrice <= 0 ||
      allChartData.length === 0 ||
      !chartRef.current
    ) {
      return;
    }

    const myChart = echarts.getInstanceByDom(
      chartRef.current as HTMLDivElement
    );
    if (!myChart) return;

    // 🚨 必须深拷贝数据，避免直接修改 ECharts 内部数据结构
    const currentOption = myChart.getOption() as unknown as {
      xAxis: { data: string[] }[];
      series: { data: unknown[] }[];
    };

    // 获取当前的 X 轴、K 线和交易量数据
    const xAxisData = currentOption.xAxis[0]?.data || [];
    const candlestickData = (currentOption.series[0]?.data as number[][]) || [];
    const volumeData = (currentOption.series[1]?.data as number[]) || [];

    const now = Date.now();

    // 检查 Tick 是否仍属于当前 K 线周期
    // 我们需要对齐到 BAR_INTERVAL_MS 的起始时间
    const isSameBar = now - lastBarTimeRef.current < BAR_INTERVAL_MS;

    if (isSameBar) {
      // 场景 1: 仍在当前 K 线周期内 (实时更新最后一根 K 线)

      const lastCandle = candlestickData[candlestickData.length - 1];
      const lastVolumeIndex = volumeData.length - 1;

      // 1. 更新收盘价 (索引 1)
      lastCandle[1] = currentPrice;

      // 2. 更新最低价 (索引 2) 和最高价 (索引 3)
      lastCandle[2] = Math.min(lastCandle[2], currentPrice);
      lastCandle[3] = Math.max(lastCandle[3], currentPrice);

      // 3. 实时更新成交量 V: 累加 (简化为每次 Tick + DEFAULT_VOLUME)
      volumeData[lastVolumeIndex] += DEFAULT_VOLUME;
    } else {
      // 场景 2: 超过当前 K 线周期 (创建新 K 线)

      // 1. 创建新 K 线的时间标签和时间引用
      const newBarTimeLabel = new Date().toLocaleTimeString();

      xAxisData.push(newBarTimeLabel);

      // 2. 新 K 线数据：[O, C, L, H] 都是当前价格
      const newCandle: number[] = [
        currentPrice,
        currentPrice,
        currentPrice,
        currentPrice,
      ];
      candlestickData.push(newCandle);

      // 3. 新成交量数据：从 DEFAULT_VOLUME 开始
      volumeData.push(DEFAULT_VOLUME);

      // 4. 更新时间引用
      lastBarTimeRef.current = now;

      // 5. 触发 DataZoom 滚动到最新数据点
      myChart.dispatchAction({
        type: "dataZoom",
        end: 100,
        xAxisIndex: [0, 1],
      });
    }

    // 限制内存中数据点数量
    if (candlestickData.length > MAX_DATA_POINTS) {
      const excess = candlestickData.length - MAX_DATA_POINTS;
      candlestickData.splice(0, excess);
      xAxisData.splice(0, excess);
      volumeData.splice(0, excess);
    }

    // 增量更新图表 (只更新 series 和 xAxis)
    myChart.setOption(
      {
        xAxis: [{ data: xAxisData }, { data: xAxisData, gridIndex: 1 }],
        series: [
          { data: candlestickData }, // 更新 K 线数据
          { data: volumeData }, // 更新交易量数据
        ],
      },
      {
        notMerge: false, // 允许合并，只更新 data 数组
        lazyUpdate: true, // 开启懒更新，提高性能
      }
    );
  }, [currentPrice, isChartInitialized]); // 依赖 currentPrice 变化而更新

  // 渲染逻辑
  if (loading || currentPrice === 0) {
    return <div>数据加载中...</div>;
  }

  return (
    <div style={styles.fullScreenContainer}>
      <div style={styles.header}>
        <h2>
          市场仪表盘 - 实时价格:
          <span style={styles.priceDisplay}>${currentPrice.toFixed(2)}</span>
        </h2>
        <button onClick={handleLogout} style={styles.logoutButton}>
          退出登录
        </button>
      </div>

      <div style={styles.chartWrapper}>
        <div ref={chartRef} style={styles.chartContainer} />
      </div>
    </div>
  );
};

export default Dashboard;

// 样式定义
const styles: { [key: string]: React.CSSProperties } = {
  fullScreenContainer: {
    height: "100vh",
    width: "100vw",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#f5f5f5",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  logoutButton: {
    padding: "8px 15px",
    cursor: "pointer",
  },
  priceDisplay: {
    fontSize: "36px",
    fontWeight: "bold",
    marginLeft: "15px",
    color: "darkblue",
  },
  chartWrapper: {
    flexGrow: 1,
    minHeight: 0,
    width: "100%",
  },
  chartContainer: {
    width: "100%",
    height: "100%",
  },
};
