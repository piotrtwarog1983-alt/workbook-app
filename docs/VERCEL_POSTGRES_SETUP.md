# Konfiguracja Vercel Postgres

## Krok 1: Utworzenie bazy danych w Vercel

1. Przejdź do [Vercel Dashboard](https://vercel.com)
2. Wybierz swój projekt **workbook-app**
3. Przejdź do zakładki **Storage**
4. Kliknij **Create Database**
5. Wybierz **Postgres**
6. Wybierz plan (Hobby plan jest darmowy)
7. Wybierz region (najlepiej blisko użytkowników, np. `fra1` dla Europy)
8. Kliknij **Create**

## Krok 2: Pobranie connection string

Po utworzeniu bazy:

1. W sekcji **Storage** znajdź swoją bazę Postgres
2. Kliknij na nią, aby otworzyć szczegóły
3. Przejdź do zakładki **.env.local**
4. Skopiuj wartość `POSTGRES_URL` (lub `DATABASE_URL`)

**Przykładowy format:**
```
postgres://default:password@ep-xxx-xxx.region.aws.neon.tech:5432/verceldb?sslmode=require
```

## Krok 3: Ustawienie zmiennych środowiskowych w Vercel

1. W projekcie Vercel przejdź do **Settings** → **Environment Variables**
2. Dodaj następujące zmienne:

### Wymagane zmienne:

```
DATABASE_URL=postgres://default:password@ep-xxx-xxx.region.aws.neon.tech:5432/verceldb?sslmode=require
```

```
JWT_SECRET=twoj-bardzo-dlugi-i-losowy-klucz-sekretny
```
*Wygeneruj klucz: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`*

```
LEMON_SQUEEZY_WEBHOOK_SECRET=twoj-secret-z-lemon-squeezy
```

```
NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL=https://twoj-sklep.lemonsqueezy.com/checkout/buy/twoj-produkt-id
```

```
NEXT_PUBLIC_APP_URL=https://twoja-domena.vercel.app
```

3. Ustaw zmienne dla wszystkich środowisk (Production, Preview, Development)
4. Kliknij **Save**

## Krok 4: Lokalna konfiguracja (opcjonalnie)

Jeśli chcesz testować lokalnie z Vercel Postgres:

1. Pobierz zmienne środowiskowe:
   ```bash
   vercel env pull .env.local
   ```

2. Sprawdź czy `.env.local` zawiera `DATABASE_URL`

## Krok 5: Migracje i seed

### Lokalnie (jeśli masz dostęp do bazy):

```bash
# Generuj Prisma Client
npx prisma generate

# Utwórz migracje
npx prisma migrate dev --name init

# Załaduj dane testowe
npx prisma db seed
```

### W Vercel (po deployu):

1. Przejdź do projektu w Vercel Dashboard
2. Otwórz **Functions** → wybierz dowolną funkcję
3. W konsoli wykonaj:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

**LUB** użyj Vercel CLI:

```bash
# Pobierz zmienne środowiskowe
vercel env pull .env.local

# Uruchom migracje
npx prisma migrate deploy

# Załaduj seed
npx prisma db seed
```

## Krok 6: Weryfikacja

1. Sprawdź połączenie z bazą:
   ```bash
   npx prisma studio
   ```
   Otworzy się interfejs graficzny do przeglądania danych.

2. Sprawdź czy tabele zostały utworzone:
   - `User`
   - `Course`
   - `CoursePage`
   - `Enrollment`
   - `RegistrationToken`
   - `LemonSqueezyOrder`
   - `GlossaryTerm`
   - `ProgressEvaluation`

## Rozwiązywanie problemów

### Problem: "Can't reach database server"

- Sprawdź czy `DATABASE_URL` jest poprawnie ustawiony w Vercel
- Upewnij się, że używasz `POSTGRES_URL` z Vercel Storage
- Sprawdź czy baza jest w tym samym regionie co aplikacja

### Problem: "SSL connection required"

- Upewnij się, że `DATABASE_URL` zawiera `?sslmode=require` na końcu
- Vercel Postgres wymaga SSL

### Problem: Migracje nie działają

- Upewnij się, że `DATABASE_URL` jest dostępny w środowisku, w którym uruchamiasz migracje
- Sprawdź czy masz uprawnienia do tworzenia tabel w bazie

## Zalety Vercel Postgres

✅ **Zintegrowane z Vercel** - automatyczna konfiguracja  
✅ **Automatyczne kopie zapasowe** - dane są bezpieczne  
✅ **Bezpłatny plan Hobby** - wystarczy dla małych projektów  
✅ **Niskie opóźnienia** - baza w tym samym regionie co aplikacja  
✅ **Łatwe skalowanie** - można łatwo przejść na wyższy plan  

## Następne kroki

Po skonfigurowaniu bazy:

1. ✅ Uruchom migracje: `npx prisma migrate deploy`
2. ✅ Załaduj dane: `npx prisma db seed`
3. ✅ Przetestuj aplikację: sprawdź logowanie i kurs
4. ✅ Skonfiguruj webhook Lemon Squeezy

Powodzenia! 🚀

