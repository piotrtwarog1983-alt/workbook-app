# ✅ Checklist przed deployem na Vercel

## 📦 CO MUSI BYĆ W REPOZYTORIUM

### ✅ Kod źródłowy (WSZYSTKIE te pliki):
```
✓ app/                    # Wszystkie pliki w katalogu app/
✓ components/             # Wszystkie komponenty React
✓ lib/                    # Biblioteki pomocnicze (w tym mock-data.ts)
✓ prisma/                 # Schema Prisma (bez migrations/)
✓ scripts/                # Skrypty pomocnicze
✓ public/                 # ⚠️ BARDZO WAŻNE - wszystkie obrazy i pliki tekstowe!
  └── course/            # Wszystkie obrazy i pliki content.txt
✓ middleware.ts
✓ next.config.js
✓ package.json
✓ package-lock.json
✓ tsconfig.json
✓ tailwind.config.js
✓ postcss.config.js
✓ vercel.json
✓ .gitignore
✓ README.md
✓ FAZA1_README.md
```

### ✅ Pliki w `public/course/` (KRYTYCZNE):
```
✓ public/course/strona 1/Foto/*.jpg    # Wszystkie obrazy
✓ public/course/strona 1/Wersja/PL/content.txt  # Wszystkie pliki tekstowe
✓ ... (dla wszystkich stron 1-51)
```

**UWAGA:** Te pliki są OBSŁUGIWANE przez API endpoint `/api/course-content/[page]/[lang]` i MUSZĄ być w repo!

## ❌ CO NIE POWINNO BYĆ W REPOZYTORIUM

### ❌ Automatycznie ignorowane przez .gitignore:
```
✗ node_modules/          # Zainstaluje Vercel automatycznie
✗ .next/                 # Build output - Vercel zbuduje
✗ .env                   # Zmienne środowiskowe (ustaw w Vercel Dashboard)
✗ .env.local
✗ .vercel/               # Konfiguracja Vercel lokalna
✗ *.log                  # Logi
✗ .DS_Store              # Pliki systemowe macOS
✗ prisma/migrations/     # Migracje (opcjonalnie, ale lepiej nie)
```

## 🔍 SPRAWDŹ PRZED COMMITEM

### 1. Sprawdź rozmiar repozytorium:
```bash
# Sprawdź rozmiar folderu public/ (obrazy mogą być duże)
du -sh public/
```

**Jeśli `public/` jest większy niż 100MB:**
- Rozważ użycie CDN (np. Cloudinary, AWS S3) dla obrazów
- Lub użyj Git LFS dla dużych plików

### 2. Sprawdź czy wszystkie obrazy są w repo:
```bash
# Sprawdź czy wszystkie pliki .jpg są w public/course/
find public/course -name "*.jpg" | wc -l
```

### 3. Sprawdź czy wszystkie pliki content.txt są w repo:
```bash
# Sprawdź czy wszystkie pliki content.txt są w public/course/
find public/course -name "content.txt" | wc -l
```

### 4. Sprawdź .gitignore:
```bash
# Upewnij się, że .gitignore istnieje i jest poprawny
cat .gitignore
```

## 📝 KOMENDY DO COMMITU

### Opcja 1: Sprawdź co zostanie dodane (ZALECANE):
```bash
# Zobacz co zostanie dodane do commita
git status

# Zobacz szczegóły
git status --short
```

### Opcja 2: Dodaj wszystkie pliki (jeśli jesteś pewien):
```bash
git add .
git commit -m "Faza 1: Minimalny layout bez bazy danych"
git push
```

### Opcja 3: Dodaj selektywnie (BEZPIECZNIEJSZE):
```bash
# Dodaj tylko kod źródłowy
git add app/ components/ lib/ prisma/ scripts/
git add public/
git add *.json *.js *.ts *.tsx *.css *.md
git add .gitignore middleware.ts

# Sprawdź co zostanie dodane
git status

# Commit
git commit -m "Faza 1: Minimalny layout bez bazy danych"
git push
```

## ⚠️ WAŻNE UWAGI

### 1. Obrazy w `public/`:
- **MUSZĄ** być w repozytorium
- Vercel serwuje pliki z `public/` jako statyczne
- Jeśli obrazy są duże (>10MB każdy), rozważ kompresję

### 2. Pliki `.env`:
- **NIE** commituj pliku `.env`
- Ustaw zmienne środowiskowe w Vercel Dashboard:
  - Settings → Environment Variables
  - Dodaj: `NEXT_PUBLIC_APP_URL`

### 3. `node_modules/`:
- **NIE** commituj `node_modules/`
- Vercel automatycznie uruchomi `npm install`

### 4. Pliki buildowe:
- **NIE** commituj `.next/`, `out/`, `build/`
- Vercel automatycznie zbuduje aplikację

## 🚨 CZĘSTE BŁĘDY

### ❌ Błąd: "Repository too large"
**Przyczyna:** Zbyt duże obrazy w `public/`
**Rozwiązanie:**
- Użyj Git LFS dla obrazów
- Lub przenieś obrazy do CDN

### ❌ Błąd: "Missing files"
**Przyczyna:** Brakuje plików w `public/course/`
**Rozwiązanie:**
- Sprawdź czy wszystkie obrazy i pliki `.txt` są w repo
- Użyj `git add public/` aby dodać wszystkie

### ❌ Błąd: "Build failed"
**Przyczyna:** Brakuje plików źródłowych
**Rozwiązanie:**
- Sprawdź czy wszystkie pliki w `app/`, `components/`, `lib/` są w repo
- Sprawdź logi build w Vercel Dashboard

## ✅ FINALNA CHECKLISTA

Przed push:
- [ ] Wszystkie pliki w `app/` są w repo
- [ ] Wszystkie pliki w `components/` są w repo
- [ ] Wszystkie pliki w `lib/` są w repo (w tym `mock-data.ts`)
- [ ] Wszystkie obrazy w `public/course/` są w repo
- [ ] Wszystkie pliki `content.txt` są w repo
- [ ] `package.json` i `package-lock.json` są w repo
- [ ] `vercel.json` jest w repo
- [ ] `.gitignore` jest w repo i poprawny
- [ ] Plik `.env` **NIE** jest w repo
- [ ] Folder `node_modules/` **NIE** jest w repo
- [ ] Folder `.next/` **NIE** jest w repo

## 🎯 REKOMENDOWANA KOLEJNOŚĆ

1. **Sprawdź status:**
   ```bash
   git status
   ```

2. **Dodaj pliki:**
   ```bash
   git add .
   ```

3. **Sprawdź co zostanie commitowane:**
   ```bash
   git status
   # Upewnij się, że NIE ma: .env, node_modules/, .next/
   ```

4. **Commit:**
   ```bash
   git commit -m "Faza 1: Minimalny layout bez bazy danych"
   ```

5. **Push:**
   ```bash
   git push
   ```

6. **W Vercel Dashboard:**
   - Połącz repo
   - Ustaw zmienne środowiskowe
   - Deploy!

