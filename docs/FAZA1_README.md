# Faza 1: Minimalny Layout bez Bazy Danych

## ✅ Co zostało zrobione

### 1. Utworzono wspólny plik z mock data
- **`lib/mock-data.ts`** - zawiera `MOCK_COURSE` i `MOCK_GLOSSARY_TERMS`
- Używany zarówno przez `CourseViewer` jak i API routes

### 2. Zmodyfikowano API routes (bez Prisma)
- **`app/api/courses/[slug]/route.ts`** - zwraca mock data zamiast z bazy
- **`app/api/progress-evaluations/route.ts`** - zwraca puste dane (oceny w localStorage)
- **`app/api/user/upload-id/route.ts`** - zwraca mock uploadId
- **`app/api/check-upload/route.ts`** - sprawdza tylko pliki, bez weryfikacji w bazie
- **`app/api/glossary/route.ts`** - używa tylko mock data

### 3. Zaktualizowano CourseViewer
- Importuje `MOCK_COURSE` z `lib/mock-data.ts`
- Usunięto duplikat definicji mock data

### 4. Utworzono konfigurację Vercel
- **`vercel.json`** - podstawowa konfiguracja dla Vercel

## 🚀 Jak wdrożyć na Vercel

### Krok 1: Przygotowanie repozytorium
```bash
git add .
git commit -m "Faza 1: Minimalny layout bez bazy danych"
git push
```

### Krok 2: Konfiguracja w Vercel Dashboard

1. **Połącz repozytorium z Vercel**
   - Zaloguj się do [vercel.com](https://vercel.com)
   - Kliknij "New Project"
   - Wybierz repozytorium

2. **Ustaw Framework Preset:**
   - Framework: **Next.js**
   - Root Directory: `./` (lub podkatalog jeśli projekt jest w podfolderze)

3. **Build Settings:**
   - Build Command: `npm run build` (domyślne)
   - Output Directory: `.next` (domyślne)
   - Install Command: `npm install` (domyślne)

4. **Environment Variables (minimalne):**
   ```
   NEXT_PUBLIC_APP_URL=https://twoja-domena.vercel.app
   ```
   
   **Opcjonalnie (dla przyszłych faz):**
   ```
   JWT_SECRET=twoj-losowy-klucz-sekretny
   ```

### Krok 3: Deploy
- Kliknij "Deploy"
- Vercel automatycznie zbuduje i wdroży aplikację

## 📋 Co działa w Fazie 1

✅ **Działa:**
- Layout aplikacji (PasswordGate, CourseViewer)
- Wyświetlanie kursu z mock data
- Nawigacja między stronami (klawisze strzałek)
- Wszystkie typy layoutów stron (grid-2x2, image-overlay, itp.)
- API endpoints zwracające mock data
- Słownik (mock data)
- Upload zdjęć (tylko sprawdzanie plików, bez bazy)

❌ **Nie działa (będzie w kolejnych fazach):**
- Zapisywanie ocen w bazie danych (tylko localStorage)
- Autentykacja użytkowników (tylko PasswordGate)
- Zapisywanie uploadId w bazie
- Webhooki Lemon Squeezy

## 🔍 Testowanie lokalnie

```bash
npm install
npm run dev
```

Aplikacja powinna działać na `http://localhost:3000`

## 📝 Następne kroki (Faza 2+)

1. **Faza 2:** Dodanie bazy danych (Vercel Postgres lub zewnętrzna)
2. **Faza 3:** Przywrócenie Prisma w API routes
3. **Faza 4:** Autentykacja użytkowników
4. **Faza 5:** Pełna funkcjonalność

## ⚠️ Ważne uwagi

- **Obrazy:** Upewnij się, że wszystkie obrazy w `public/course/` są w repozytorium
- **Pliki tekstowe:** Pliki w `public/course/strona X/Wersja/PL/content.txt` muszą być dostępne
- **Build:** Jeśli build się nie powiedzie, sprawdź logi w Vercel Dashboard

## 🐛 Rozwiązywanie problemów

### Problem: Build fails z błędem Prisma
**Rozwiązanie:** W Fazie 1 nie używamy Prisma, więc to nie powinno się zdarzyć. Jeśli się zdarzy, sprawdź czy wszystkie importy Prisma zostały usunięte.

### Problem: Obrazy się nie ładują
**Rozwiązanie:** Sprawdź ścieżki w `public/course/` i upewnij się, że pliki są w repo.

### Problem: "Module not found"
**Rozwiązanie:** Upewnij się, że wszystkie zależności są w `package.json` i uruchom `npm install`.

