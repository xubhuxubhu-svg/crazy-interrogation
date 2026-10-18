# 瘋狂審訊室

心理戰・語音審訊網頁遊戲。單人可以當審問官或嫌犯和電腦對戰；連線對戰可以和朋友各演一角，找不到真人對手時自動改由電腦對戰。

遊戲製作：Eric Hu

## 檔案（全部放在同一層，不需要資料夾）

- `server.js`：連線對戰伺服器
- `package.json`：伺服器需要的套件清單
- `index.html`：遊戲畫面
- `engine.js`：遊戲規則、五個案件、電腦對手、評分
- `render.js`：角色動畫
- `music.js`：背景音樂
- `app.js`：選單、單人與連線流程、語音、麥克風

## Render 設定

- Runtime：Node
- Build Command：`npm install`
- Start Command：`npm start`
- 環境變數：不需要
