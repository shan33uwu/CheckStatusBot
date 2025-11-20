const fs = require('fs');
const https = require('https');

// 你的服務列表
const services = [
    { id: 'api', url: 'https://api.shan33.pages.dev' },
    { id: 'core1', url: 'https://core-1.shan33.pages.dev' },
    { id: 'core2', url: 'https://core-2.shan33.pages.dev' },
    { id: 'web', url: 'https://shan33.pages.dev' }
];

// 讀取目前的 history.json
let data = { lastUpdate: "", services: [] };
try {
    const raw = fs.readFileSync('./history.json');
    data = JSON.parse(raw);
} catch (e) {
    console.log("No history file found, creating new one.");
}

// 檢查函數
function checkUrl(url) {
    return new Promise((resolve) => {
        const start = Date.now();
        const req = https.get(url, (res) => {
            // 200-299 視為成功，其他視為失敗 (或根據你的需求調整)
            const isOk = res.statusCode >= 200 && res.statusCode < 300;
            resolve(isOk ? 'ok' : 'down');
        });
        
        req.on('error', () => resolve('down'));
        req.on('timeout', () => resolve('down'));
        req.setTimeout(5000); // 5秒超時
    });
}

// 主流程
(async () => {
    // 確保結構正確
    if (!data.services) data.services = [];

    for (const service of services) {
        console.log(`Checking ${service.id}...`);
        const status = await checkUrl(service.url);
        
        // 找到對應的服務數據
        let srvData = data.services.find(s => s.id === service.id);
        if (!srvData) {
            srvData = { id: service.id, history: [] };
            data.services.push(srvData);
        }

        // 加入新狀態 (1=ok, 0=down, 2=warn)
        // 為了簡化，這裡只存 'ok' 或 'down'
        srvData.history.push(status === 'ok' ? 1 : 0);

        // 只保留最近 90 次記錄
        if (srvData.history.length > 90) {
            srvData.history.shift();
        }
    }

    data.lastUpdate = new Date().toISOString();

    // 寫入檔案
    fs.writeFileSync('./history.json', JSON.stringify(data, null, 2));
    console.log("History updated.");
})();
