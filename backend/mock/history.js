/**
 * 模拟生成 K 线历史数据 (OHLC + Volume)
 * @param {number} count 生成的数量
 * @param {number} interval 间隔时间
 * @returns {Array<Array<number>>} 格式化的 K 线数据数组
 */
const generateHistoryData = (count = 100, interval = 60 * 1000) => {
    const data = [];
    let baseTime = Date.now() - count * interval;
    let basePrice = 100.0;

    for(let i = 0;i < count; i++){
        const time = baseTime + i * interval;

        const open = basePrice;
        const close = open + (Math.random() - 0.5) * 2;
        const high = Math.max(open,close) + Math.random() * 0.5;
        const low = Math.min(open,close) - Math.random() * 0.5;
        const volume = Math.floor(Math.random() * 1000 + 500);

        data.push([
            time,
            parseFloat(open.toFixed(2)),
            parseFloat(close.toFixed(2)),            
            parseFloat(low.toFixed(2)),            
            parseFloat(high.toFixed(2)),            
            volume
        ]);

        basePrice = close + (Math.random() - 0.5) * 2;
    }
    return data;
}

module.exports = {generateHistoryData};
