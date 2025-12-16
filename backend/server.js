// server.js (后端主文件)

const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const http = require("http"); // 修复：使用 http 模块的 createServer
const { generateHistoryData } = require("./mock/history"); // 假设您有这个文件

const app = express();

// --- 1. 配置中间件 ---
app.use(cors());
app.use(express.json());

// --- 2. HTTP API 路由 ---

// 根路径检查
app.get("/", (req, res) => {
  res.send("Real-time Market Data Backend is running!");
});

// 登录 API
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (username && password) {
    const token = `mock-jwt-token-${Date.now()}`;
    return res.json({
      code: 0,
      message: "Login successful",
      data: { token, username },
    });
  }

  res.status(401).json({ code: 1, message: "Invalid credentials" });
});

// 历史数据 API
app.get("/api/history", (req, res) => {
  // 假设 generateHistoryData 可以生成历史K线数据
  const historyData = generateHistoryData(200);

  res.json({
    code: 0,
    message: "Success",
    data: historyData,
  });
});

// --- 3. WebSocket 实时推送设置 ---

// 使用 http.createServer 创建服务器，以便 WebSocket 可以共享端口
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let currentPrice = 96.0; // 初始价格
const PRICE_CHANGE_INTERVAL = 500; // 每 500ms 推送一次

wss.on("connection", (ws) => {
  console.log("WebSocket 客户端已连接");

  ws.on("close", () => {
    console.log("WebSocket 客户端已断开连接");
  });

  ws.on("error", (error) => {
    console.error("WebSocket 错误:", error.message);
  });
});

// 模拟实时价格变动并广播
setInterval(() => {
  // 模拟价格随机变动 (+/- 0.05到 +/- 0.5)
  const change = (Math.random() - 0.5) * 1.0;
  currentPrice += change;
  currentPrice = parseFloat(currentPrice.toFixed(2)); // 保留两位小数

  const tick = {
    type: "tick",
    data: {
      time: Date.now(),
      price: currentPrice,
      volume: Math.floor(Math.random() * 100) + 10, // 模拟成交量
    },
  };

  const message = JSON.stringify(tick);

  // 广播给所有已连接的客户端
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}, PRICE_CHANGE_INTERVAL);

// --- 4. 端口监听逻辑 (确保端口可用) ---

const PORT = process.env.PORT || 3001;
const MAX_PORT = 3010;

function startListening(port) {
  server
    .listen(port, () => {
      console.log(`✅ HTTP/WebSocket 服务器正在 ${port} 端口运行`);
      console.log(`WebSocket URL: ws://localhost:${port}`);
    })
    .on("error", (err) => {
      if (err.code === "EADDRINUSE" && port < MAX_PORT) {
        console.log(`端口 ${port} 被占用，尝试端口 ${port + 1}...`);
        startListening(port + 1);
      } else {
        console.error("启动服务器失败:", err.message);
      }
    });
}

startListening(PORT);
