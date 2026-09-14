@echo off
title NTK Devolucoes - Servidor
cd /d "%~dp0"
echo ============================================
echo  NTK Devolucoes - Servidor rodando
echo  NAO FECHE ESTA JANELA enquanto o time estiver usando o app.
echo ============================================
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    echo Endereco para acesso pela rede: http://%%a:3000
)
echo Endereco neste computador: http://localhost:3000
echo.

call npx next start -p 3000
