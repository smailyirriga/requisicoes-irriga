@echo off
chcp 65001 >nul
title App de Requisicoes IRRIGA - servidor
cd /d "%~dp0"

echo ============================================
echo   App de Requisicoes IRRIGA
echo ============================================
echo.
echo O app vai abrir no navegador em alguns segundos.
echo.
echo   Neste computador:  http://localhost:3000
echo   No celular (mesma rede Wi-Fi): veja o endereco "Network" abaixo
echo.
echo Deixe esta janela ABERTA enquanto estiver usando o app.
echo Para encerrar, feche esta janela.
echo ============================================
echo.

start "" http://localhost:3000
call npm run dev
pause
