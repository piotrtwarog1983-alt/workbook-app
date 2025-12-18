# 🔧 Instalacja Git dla Windows

## Problem
Błąd: `Der Befehl "git" ist entweder falsch geschrieben oder konnte nicht gefunden werden.`
Oznacza to, że Git nie jest zainstalowany lub nie jest w PATH.

## ✅ Rozwiązanie 1: Zainstaluj Git (ZALECANE)

### Krok 1: Pobierz Git
1. Przejdź na: https://git-scm.com/download/win
2. Pobierz najnowszą wersję Git for Windows
3. Uruchom instalator

### Krok 2: Podczas instalacji
- ✅ Zaznacz "Add Git to PATH" (dodaj Git do PATH)
- ✅ Wybierz "Git from the command line and also from 3rd-party software"
- ✅ Zostaw domyślne opcje dla reszty

### Krok 3: Po instalacji
Zamknij i otwórz ponownie CMD/PowerShell, potem sprawdź:

```cmd
git --version
```

Jeśli zobaczysz wersję (np. `git version 2.43.0`), Git jest zainstalowany!

## ✅ Rozwiązanie 2: Dodaj Git do PATH (jeśli już jest zainstalowany)

### Sprawdź czy Git jest zainstalowany:
```cmd
"C:\Program Files\Git\bin\git.exe" --version
```

Lub:
```cmd
"C:\Program Files (x86)\Git\bin\git.exe" --version
```

### Jeśli Git działa, dodaj do PATH:

1. **Otwórz System Properties:**
   - Naciśnij `Win + R`
   - Wpisz: `sysdm.cpl`
   - Enter

2. **Dodaj do PATH:**
   - Kliknij "Environment Variables"
   - W "System variables" znajdź "Path"
   - Kliknij "Edit"
   - Kliknij "New"
   - Dodaj: `C:\Program Files\Git\bin`
   - Kliknij "OK" wszędzie

3. **Zrestartuj CMD:**
   - Zamknij i otwórz ponownie CMD
   - Sprawdź: `git --version`

## ✅ Rozwiązanie 3: Użyj Git Bash (tymczasowe)

Jeśli Git jest zainstalowany, ale nie w PATH:

1. Otwórz **Git Bash** (z menu Start)
2. Przejdź do katalogu projektu:
   ```bash
   cd "/d/eulaliafotografia.com/WorkBook/workbook-app/aplikacja Note.js"
   ```
3. Uruchom skrypt:
   ```bash
   npm run git:add-essential
   ```

## ✅ Rozwiązanie 4: Użyj pełnej ścieżki do Git

Jeśli Git jest zainstalowany, możesz użyć pełnej ścieżki:

```cmd
"C:\Program Files\Git\bin\git.exe" add app/ components/ lib/ scripts/ prisma/schema.prisma prisma/seed.js prisma/seed.ts package.json package-lock.json tsconfig.json next.config.js tailwind.config.js postcss.config.js vercel.json middleware.ts public/ README.md FAZA1_README.md DEPLOY_CHECKLIST.md SETUP.md MYSQL_SETUP.md QUICK_FIX.md .gitignore
```

## 🚀 Po instalacji Git

Gdy Git będzie działał, możesz użyć:

```cmd
npm run git:add-essential
```

Lub bezpośrednio:

```cmd
git add app/ components/ lib/ scripts/ prisma/schema.prisma prisma/seed.js prisma/seed.ts package.json package-lock.json tsconfig.json next.config.js tailwind.config.js postcss.config.js vercel.json middleware.ts public/ README.md FAZA1_README.md DEPLOY_CHECKLIST.md SETUP.md MYSQL_SETUP.md QUICK_FIX.md .gitignore
```

## 📝 Szybka instalacja (winget)

Jeśli masz Windows 10/11 z winget:

```cmd
winget install --id Git.Git -e --source winget
```

Po instalacji zamknij i otwórz ponownie CMD.

## ✅ Weryfikacja

Po instalacji sprawdź:

```cmd
git --version
```

Powinieneś zobaczyć coś jak:
```
git version 2.43.0.windows.1
```

