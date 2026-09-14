@echo off
echo ============================================
echo  NTK Devolucoes - Instalacao (Windows)
echo ============================================
echo.
echo Verificando Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERRO] Node.js nao encontrado.
    echo Baixe e instale a versao LTS em: https://nodejs.org
    echo Depois rode este arquivo novamente.
    pause
    exit /b 1
)

echo Node.js encontrado. Instalando dependencias...
call npm install
if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias.
    pause
    exit /b 1
)

echo.
echo Criando banco de dados e usuarios iniciais...
call npm run db:seed

echo.
echo Gerando build de producao...
call npm run build

echo.
echo ============================================
echo  Instalacao concluida!
echo  Use o arquivo iniciar-servidor.bat para rodar.
echo ============================================
pause
