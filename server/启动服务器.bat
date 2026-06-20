@echo off
:: 源来如此 - 后台启动同步服务器
cd /d "e:\学习\词桥\server"
start "" /b "C:\Program Files\nodejs\node.exe" index.js
echo 服务器已后台启动: http://localhost:3456
echo 可关闭此窗口，服务继续运行。
pause
