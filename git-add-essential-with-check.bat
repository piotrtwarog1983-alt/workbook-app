@echo off
chcp 65001 >nul
echo 🔍 Sprawdzanie czy Git jest zainstalowany...
echo.

REM Sprawdź czy git jest dostępny
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Git nie jest zainstalowany lub nie jest w PATH!
    echo.
    echo 📥 Zainstaluj Git:
    echo    1. Pobierz z: https://git-scm.com/download/win
    echo    2. Podczas instalacji zaznacz "Add Git to PATH"
    echo    3. Zamknij i otwórz ponownie CMD
    echo.
    echo 💡 Alternatywnie, użyj Git Bash z menu Start
    echo.
    pause
    exit /b 1
)

echo ✅ Git jest zainstalowany!
echo.
echo 🔍 Sprawdzanie plików do dodania...
echo.

echo 📁 Dodawanie kodu źródłowego...
git add app/
git add components/
git add lib/
git add scripts/
git add prisma/schema.prisma
git add prisma/seed.js
if exist "prisma\seed.ts" git add prisma/seed.ts

echo ⚙️ Dodawanie plików konfiguracyjnych...
git add package.json
git add package-lock.json
git add tsconfig.json
git add next.config.js
git add tailwind.config.js
git add postcss.config.js
git add vercel.json
git add middleware.ts

echo 🖼️ Dodawanie plików statycznych (obrazy, teksty)...
git add public/

echo 📚 Dodawanie dokumentacji...
git add README.md
if exist "FAZA1_README.md" git add FAZA1_README.md
if exist "DEPLOY_CHECKLIST.md" git add DEPLOY_CHECKLIST.md
if exist "SETUP.md" git add SETUP.md
if exist "MYSQL_SETUP.md" git add MYSQL_SETUP.md
if exist "QUICK_FIX.md" git add QUICK_FIX.md

echo 🔒 Dodawanie .gitignore...
git add .gitignore

echo.
echo ✅ Gotowe! Sprawdź status:
echo.
git status --short
echo.
echo 💡 Aby commitować, uruchom:
echo    git commit -m "Faza 1: Minimalny layout bez bazy danych"
echo.
pause

