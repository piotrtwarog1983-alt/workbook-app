# 📦 Komendy Git - Dodawanie niezbędnych plików

## 🚀 Szybki start

### Opcja 1: Użyj skryptu PowerShell (ZALECANE)
```powershell
powershell -ExecutionPolicy Bypass -File git-add-essential.ps1
```

### Opcja 2: Użyj skryptu Batch (.bat)
```cmd
git-add-essential.bat
```

### Opcja 3: Użyj npm script
```cmd
npm run git:add-essential
```

## 📋 Co robią skrypty?

Skrypty automatycznie dodają do Git tylko niezbędne pliki:

✅ **Kod źródłowy:**
- `app/` - wszystkie pliki aplikacji
- `components/` - komponenty React
- `lib/` - biblioteki pomocnicze
- `scripts/` - skrypty pomocnicze
- `prisma/schema.prisma` - schema bazy danych
- `prisma/seed.js` i `prisma/seed.ts` - seed files

✅ **Konfiguracja:**
- `package.json` i `package-lock.json`
- `tsconfig.json`
- `next.config.js`
- `tailwind.config.js`
- `postcss.config.js`
- `vercel.json`
- `middleware.ts`

✅ **Pliki statyczne (KRYTYCZNE!):**
- `public/` - wszystkie obrazy i pliki tekstowe kursu

✅ **Dokumentacja:**
- `README.md`
- `FAZA1_README.md`
- `DEPLOY_CHECKLIST.md`
- `SETUP.md`
- `MYSQL_SETUP.md`
- `QUICK_FIX.md`

✅ **Inne:**
- `.gitignore`

## ❌ Co NIE jest dodawane (automatycznie ignorowane):

- `node_modules/` - Vercel zainstaluje automatycznie
- `.env` - zmienne środowiskowe (ustaw w Vercel Dashboard)
- `.next/` - build output (Vercel zbuduje)
- `.vercel/` - konfiguracja lokalna Vercel
- `*.log` - pliki logów

## 🔍 Sprawdzenie przed commitem

Po uruchomieniu skryptu sprawdź status:

```cmd
git status
```

Upewnij się, że **NIE MA**:
- `.env`
- `node_modules/`
- `.next/`
- `.vercel/`

## 💾 Pełny proces commitowania

### Krok 1: Dodaj pliki
```cmd
npm run git:add-essential
```

### Krok 2: Sprawdź status
```cmd
git status
```

### Krok 3: Commit
```cmd
git commit -m "Faza 1: Minimalny layout bez bazy danych"
```

### Krok 4: Push
```cmd
git push
```

## 🎯 Jedna komenda (bez skryptu)

Jeśli wolisz jedną komendę bez skryptu:

```cmd
git add app/ components/ lib/ scripts/ prisma/schema.prisma prisma/seed.js prisma/seed.ts package.json package-lock.json tsconfig.json next.config.js tailwind.config.js postcss.config.js vercel.json middleware.ts public/ README.md FAZA1_README.md DEPLOY_CHECKLIST.md SETUP.md MYSQL_SETUP.md QUICK_FIX.md .gitignore && git status --short
```

## ⚠️ Ważne uwagi

1. **Obrazy w `public/`** - MUSZĄ być w repozytorium, bo są serwowane jako statyczne
2. **Pliki `.env`** - NIE commituj, ustaw w Vercel Dashboard
3. **`node_modules/`** - NIE commituj, Vercel zainstaluje automatycznie
4. **Pliki buildowe** - NIE commituj, Vercel zbuduje automatycznie

## 🐛 Rozwiązywanie problemów

### Problem: "Execution Policy" w PowerShell
**Rozwiązanie:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Lub użyj:
```cmd
powershell -ExecutionPolicy Bypass -File git-add-essential.ps1
```

### Problem: Skrypt nie działa
**Rozwiązanie:** Użyj bezpośrednio npm script:
```cmd
npm run git:add-essential
```

### Problem: Niektóre pliki nie są dodawane
**Rozwiązanie:** Sprawdź czy pliki istnieją i czy nie są w `.gitignore`

