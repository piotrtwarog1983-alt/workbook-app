# Faza 2: Backend + baza danych (PostgreSQL + Prisma)

## ✅ Co zostało wdrożone

- **PostgreSQL + Prisma** – wszystkie API korzystają ponownie z bazy danych (Vercel Postgres).
- **Rejestracja i logowanie** – `POST /api/auth/register` i `POST /api/auth/login` zapisują użytkowników, walidują hasła i zwracają token JWT.
- **Webhook Lemon Squeezy** – `POST /api/webhooks/lemonsqueezy` weryfikuje podpis, zapisuje zamówienia i wysyła link rejestracyjny.
- **Kurs z bazy danych** – `CourseViewer` pobiera dane przez `/api/courses/[slug]`, a `prisma/seed.ts` importuje wszystkie strony z `lib/mock-data`.
- **Słownik, oceny postępów, upload zdjęć** – wszystkie endpointy (`/api/glossary`, `/api/progress-evaluations`, `/api/upload-photo`, `/api/check-upload`, `/api/user/upload-id`) korzystają z prawdziwych danych.
- **Nowe `.env.example`** i aktualne instrukcje w `README.md`.

## 🛠️ Konfiguracja lokalna

1. Skopiuj plik `.env.example` i uzupełnij dane:
   ```bash
   cp .env.example .env
   ```
   Najważniejsze zmienne:
   - `DATABASE_URL` – connection string z Vercel Postgres (zobacz `VERCEL_POSTGRES_SETUP.md`)
   - `JWT_SECRET` – silny sekret dla JWT
   - `LEMON_SQUEEZY_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL`
   - `NEXT_PUBLIC_APP_URL`

2. Zainstaluj zależności i wygeneruj klienta Prisma:
   ```bash
   npm install
   npx prisma generate
   ```

3. Wykonaj migracje (lub `db push`, jeżeli schema jest już wdrożona):
   ```bash
   npx prisma migrate dev
   ```

4. Załaduj dane kursu i słownik:
   ```bash
   npx prisma db seed
   ```

5. Uruchom aplikację:
   ```bash
   npm run dev
   ```

## 🌐 Deploy na Vercel

1. Upewnij się, że w projekcie Vercel ustawione są zmienne środowiskowe (Settings → Environment Variables):
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `LEMON_SQUEEZY_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL`
   - `NEXT_PUBLIC_APP_URL`

2. Utwórz bazę Vercel Postgres (zobacz `VERCEL_POSTGRES_SETUP.md` dla szczegółowych instrukcji).

3. Deploy:
   ```bash
   vercel --prod
   ```

## 📌 Weryfikacja funkcjonalna

- **Rejestracja**: wygeneruj token (webhook lub manualnie) i wykonaj `POST /api/auth/register`.
- **Logowanie**: zaloguj się na `/login`, sprawdź zapis tokena i dostęp do `/course`.
- **Kurs**: upewnij się, że `/api/courses/fotografia-kulinarna` zwraca dane z bazy (nie mock).
- **Oceny postępów**: zaloguj użytkownika, ustaw ocenę na stronach 16/21/30/36/41/50 i sprawdź zapis w tabeli `ProgressEvaluation`.
- **Upload**: generuj `uploadId` przez `/api/user/upload-id`, prześlij plik i zweryfikuj wynik w `/api/check-upload`.
- **Webhook**: wykonaj żądanie z podpisem Lemon Squeezy, sprawdź rekord w `LemonSqueezyOrder` oraz email w logach.

## ❗Ważne

- `CourseViewer` ma fallback do `MOCK_COURSE`, ale w Fazie 2 kurs powinien pochodzić z bazy.
- Endpoint `/api/check-upload` został oznaczony jako dynamiczny, aby uniknąć ostrzeżeń Next.js.
- Skrypt `npx prisma db seed` wykorzystuje `lib/mock-data.ts`, dzięki czemu baza zawiera komplet 51 stron kursu.

Powodzenia z dalszymi fazami! 💪

