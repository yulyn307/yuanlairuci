@echo off
chcp 65001 >nul
echo ========================================
echo   源来如此 — 一键部署到 Netlify
echo ========================================
echo.
echo [1/3] 推送代码到 GitHub...
cd /d "%~dp0"
git add -A
git commit -m "update %date% %time%" 2>nul
git push origin main
echo.
echo [2/3] 打包项目...
del /q "..\yuanlairuci-deploy.zip" 2>nul
tar -a -cf "..\yuanlairuci-deploy.zip" --exclude=node_modules --exclude=.git --exclude=*.log --exclude=users.json --exclude=server.bat --exclude=*.jpg .
echo [3/3] 打开 Netlify Drop...
start "" "https://app.netlify.com/drop"
echo.
echo ========================================
echo  部署包已生成: ..\yuanlairuci-deploy.zip
echo  拖拽这个 zip 到打开的 Netlify 页面即可
echo ========================================
pause
