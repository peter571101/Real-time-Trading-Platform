const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const { createServer} = require('http')
const app = express();
const PORT = 3001;

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Real-time Market Data Backend is running!");
});

const{generateHistoryData} = require('./mock/history');

app.post('/api/login',(req,res) => {
    const { username, password } = req.body;

    if(username && password) {
        const token = `mock-jwt-token-${Date.now()}`;
        return res.json({
            code:0,
            message:'Login successful',
            data: { token, username }
        });
    }

    res.status(401).json({code: 1,message: 'Invalid credentials'});
})

app.get('/api/history' , (req,res) => {
    const historyData = generateHistoryData(200);

    res.json({
        code: 0,
        message: 'Success',
        data: historyData,
    })
})
app.listen(PORT,() => {
    console.log(`✅ Backend Server running at http://localhost:${PORT}`);
});