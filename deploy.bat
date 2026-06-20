@echo off
chcp 65001 >nul
title 源来如此 — 一键部署

echo ========================================
echo   源来如此 — 一键部署到 Netlify
echo ========================================
echo.

:: 切换到脚本所在目录
cd /d "%~dp0"

:: 检查 git 是否可用
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 找不到 git 命令，请确认已安装 Git
    pause
    exit /b 1
)

echo [1/3] 推送代码到 GitHub...
git config user.email "yuanlairuci@example.com" 2>nul
git config user.name "yuanlairuci" 2>nul
git add -A
git commit -m "deploy %date% %time%" 2>nul
git push origin main 2>&1
if %errorlevel% neq 0 (
    echo [警告] Git 推送失败（可忽略，继续部署）
)

echo.
echo [2/3] 打包项目...
del /q "..\yuanlairuci-deploy.zip" 2>nul
tar -a -cf "..\yuanlairuci-deploy.zip" --exclude=node_modules --exclude=.git --exclude=*.log --exclude=users.json --exclude=server.bat --exclude=*.jpg .

if not exist "..\yuanlairuci-deploy.zip" (
    echo [错误] 打包失败！
    pause
    exit /b 1
)

echo [3/3] 打开 Netlify Drop...
start "" "https://app.netlify.com/drop"

echo.
echo ========================================
echo   部署包: ..\yuanlairuci-deploy.zip
echo   拖拽此 zip 到浏览器中的 Netlify 页面
echo   生效链接: https://enchanting-capybara-4b2ec0.netlify.app
echo ========================================
echo.
echo 文件管理器已打开，可以直接拖拽
explorer "%~dp0.."
pause
