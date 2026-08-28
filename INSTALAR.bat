@echo off
chcp 65001 >nul
title Instalacao - App de Requisicoes IRRIGA
cd /d "%~dp0"

echo ============================================
echo   Instalacao do App de Requisicoes
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado.
  echo Instale o Node.js LTS em https://nodejs.org e rode este arquivo de novo.
  pause
  exit /b 1
)

echo -^> Instalando dependencias (pode demorar alguns minutos)...
call npm install
if errorlevel 1 goto erro

echo.
echo ============================================
echo   Dependencias instaladas.
echo.
echo   PROXIMO PASSO: configurar o banco na nuvem.
echo   Abra o arquivo DEPLOY.md e siga os passos 2 e 3
echo   (criar projeto no Supabase e preencher o arquivo .env).
echo.
echo   Depois disso, use INICIAR.bat para abrir o app.
echo ============================================
pause
exit /b 0

:erro
echo.
echo [ERRO] Algo deu errado. Veja as mensagens acima.
pause
exit /b 1
