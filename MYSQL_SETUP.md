# Konfiguracja MySQL 8.0

## Krok 1: Utworzenie pliku .env

Utwórz plik `.env` w głównym katalogu projektu z następującą zawartością:

```env
# Database - MySQL 8.0
DATABASE_URL="mysql://39771574_workbook:Kkntyw21!@mysql8:3306/39771574_workbook?schema=public"

# JWT
JWT_SECRET=your-secret-key-change-in-production

# Lemon Squeezy
LEMON_SQUEEZY_WEBHOOK_SECRET=your-webhook-secret
NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL=https://your-store.lemonsqueezy.com/checkout/buy/your-product-id

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**UWAGA:** Jeśli host `mysql8` nie działa, spróbuj użyć pełnego adresu IP lub domeny serwera MySQL.

## Krok 2: Instalacja zależności

```bash
npm install
```

## Krok 3: Generowanie Prisma Client

```bash
npx prisma generate
```

## Krok 4: Uruchomienie migracji

```bash
npx prisma migrate dev --name init
```

Lub jeśli baza danych już istnieje i chcesz tylko zsynchronizować schema:

```bash
npx prisma db push
```

## Krok 5: (Opcjonalnie) Załadowanie danych testowych

```bash
npx prisma db seed
```

## Rozwiązywanie problemów

### Problem: Nie można połączyć się z bazą danych

1. Sprawdź, czy host `mysql8` jest dostępny z Twojego serwera
2. Jeśli używasz zdalnej bazy danych, upewnij się, że:
   - Port 3306 jest otwarty
   - Użytkownik ma uprawnienia do połączenia z zewnątrz
   - Firewall pozwala na połączenia

3. Spróbuj użyć pełnego adresu w DATABASE_URL:
   ```
   DATABASE_URL="mysql://39771574_workbook:Kkntyw21!@twoj-serwer.com:3306/39771574_workbook?schema=public"
   ```

### Problem: Błąd "Unknown database"

Upewnij się, że baza danych `39771574_workbook` istnieje. Możesz ją utworzyć przez phpMyAdmin lub bezpośrednio w MySQL:

```sql
CREATE DATABASE IF NOT EXISTS 39771574_workbook CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Problem: Błąd z JSON type

MySQL 8.0 obsługuje typ JSON, więc nie powinno być problemów. Jeśli jednak wystąpi błąd, upewnij się, że używasz MySQL 8.0 lub nowszej wersji.

## Sprawdzenie połączenia

Możesz sprawdzić połączenie z bazą danych używając:

```bash
npx prisma db pull
```

Lub otworzyć Prisma Studio:

```bash
npx prisma studio
```

