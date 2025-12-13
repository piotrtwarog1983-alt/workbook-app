# git-add-essential.ps1
# Skrypt dodający tylko niezbędne pliki do Git

Write-Host "🔍 Sprawdzanie plików do dodania..." -ForegroundColor Cyan

# Dodaj kod źródłowy
Write-Host "📁 Dodawanie kodu źródłowego..." -ForegroundColor Yellow
git add app/
git add components/
git add lib/
git add scripts/
git add prisma/schema.prisma
git add prisma/seed.js
if (Test-Path "prisma/seed.ts") {
    git add prisma/seed.ts
}

# Dodaj konfigurację
Write-Host "⚙️ Dodawanie plików konfiguracyjnych..." -ForegroundColor Yellow
git add package.json
git add package-lock.json
git add tsconfig.json
git add next.config.js
git add tailwind.config.js
git add postcss.config.js
git add vercel.json
git add middleware.ts

# Dodaj pliki statyczne (KRYTYCZNE!)
Write-Host "🖼️ Dodawanie plików statycznych (obrazy, teksty)..." -ForegroundColor Yellow
git add public/

# Dodaj dokumentację
Write-Host "📚 Dodawanie dokumentacji..." -ForegroundColor Yellow
git add README.md
if (Test-Path "FAZA1_README.md") {
    git add FAZA1_README.md
}
if (Test-Path "DEPLOY_CHECKLIST.md") {
    git add DEPLOY_CHECKLIST.md
}
if (Test-Path "SETUP.md") {
    git add SETUP.md
}
if (Test-Path "MYSQL_SETUP.md") {
    git add MYSQL_SETUP.md
}
if (Test-Path "QUICK_FIX.md") {
    git add QUICK_FIX.md
}

# Dodaj .gitignore
Write-Host "🔒 Dodawanie .gitignore..." -ForegroundColor Yellow
git add .gitignore

Write-Host ""
Write-Host "✅ Gotowe! Sprawdź status:" -ForegroundColor Green
Write-Host ""
git status --short
Write-Host ""
Write-Host "💡 Aby commitować, uruchom:" -ForegroundColor Cyan
Write-Host "   git commit -m 'Faza 1: Minimalny layout bez bazy danych'" -ForegroundColor White
Write-Host ""

