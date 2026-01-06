# Instrukcja konfiguracji WorkBook

## Krok 1: Instalacja zależności

```bash
npm install
```

## Krok 2: Konfiguracja bazy danych

1. Utwórz bazę danych PostgreSQL
2. Skopiuj plik `.env.example` do `.env`
3. Uzupełnij `DATABASE_URL` w pliku `.env`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/workbook?schema=public"
```

4. Uruchom migracje:

```bash
npx prisma migrate dev
npx prisma generate
```

5. Załaduj przykładowe dane:

```bash
npx prisma db seed
```

## Krok 3: Konfiguracja systemów płatności

### Opcja A: Lemon Squeezy

1. Zaloguj się do panelu Lemon Squeezy
2. Przejdź do ustawień webhooków
3. Dodaj nowy webhook:
   - URL: `https://twoja-domena.com/api/webhooks/lemonsqueezy`
   - Event: `order_created`
4. Skopiuj secret webhooka
5. Dodaj do `.env`:

```
LEMON_SQUEEZY_WEBHOOK_SECRET="twój-secret-z-lemon-squeezy"
NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL="https://twoj-sklep.lemonsqueezy.com/checkout/buy/twoj-produkt-id"
```

### Opcja B: Stripe

1. Zaloguj się do [Stripe Dashboard](https://dashboard.stripe.com)
2. Przejdź do **Developers** → **Webhooks**
3. Kliknij **Add endpoint**
4. Dodaj endpoint:
   - URL: `https://twoja-domena.com/api/webhooks/stripe`
   - Events: 
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
5. Skopiuj **Signing secret** z endpointu
6. Dodaj do `.env`:

```
STRIPE_SECRET_KEY="sk_live_xxx lub sk_test_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_xxx lub pk_test_xxx"
```

**Uwaga:** Możesz używać obu systemów płatności jednocześnie - każdy ma własny webhook.

## Krok 4: Konfiguracja JWT

Wygeneruj bezpieczny klucz JWT i dodaj do `.env`:

```
JWT_SECRET="twój-bardzo-długi-i-losowy-klucz-sekretny"
```

Możesz wygenerować klucz używając:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Krok 5: Konfiguracja URL aplikacji

Dodaj do `.env`:

```
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # dla developmentu
# lub
NEXT_PUBLIC_APP_URL="https://twoja-domena.com"  # dla produkcji
```

## Krok 6: Dodawanie treści kursu

### Opcja A: Przez bazę danych

Możesz dodać strony kursu bezpośrednio przez Prisma Studio:

```bash
npx prisma studio
```

### Opcja B: Przez skrypt importu

1. Umieść zdjęcia w folderach `public/course/strona X/Foto/`
2. Uruchom skrypt importu:

```bash
npx ts-node scripts/import-course-pages.ts
```

### Opcja C: Przez API (do zaimplementowania)

Możesz stworzyć panel administracyjny do zarządzania treścią kursu.

## Krok 7: Dodawanie słownika pojęć

Możesz dodać pojęcia do słownika przez Prisma Studio lub bezpośrednio w bazie danych:

```sql
INSERT INTO "GlossaryTerm" (term, definition, language) 
VALUES ('Termin', 'Definicja terminu', 'pl');
```

## Krok 8: Uruchomienie aplikacji

### Development

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem `http://localhost:3000`

### Production

```bash
npm run build
npm start
```

## Testowanie przepływu zakupu

### Testowanie Lemon Squeezy

1. Przejdź na stronę główną (`/`)
2. Kliknij przycisk "Kup teraz" (przekierowanie do Lemon Squeezy)
3. Wykonaj testową płatność w Lemon Squeezy
4. Sprawdź, czy webhook został wywołany (logi serwera)
5. Sprawdź email (w development mode będzie w logach konsoli)
6. Użyj linku z emaila do rejestracji
7. Zaloguj się i sprawdź dostęp do kursu

### Testowanie Stripe

1. Użyj [Stripe CLI](https://stripe.com/docs/stripe-cli) do testowania lokalnie:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
2. Skopiuj webhook signing secret z CLI do `.env`
3. Utwórz testowy Checkout Session (przez API lub test mode)
4. Wykonaj testową płatność używając [karty testowej](https://stripe.com/docs/testing):
   - Numer: `4242 4242 4242 4242`
   - Data: dowolna przyszła
   - CVC: dowolne 3 cyfry
5. Sprawdź, czy webhook został wywołany (logi serwera)
6. Sprawdź email i dokończ rejestrację

## Struktura danych kursu

Każda strona kursu (`CoursePage`) może zawierać:

- `pageNumber` - numer strony (kolejność)
- `title` - tytuł strony (opcjonalnie)
- `content` - treść w formacie JSON: `{"text": "treść tekstowa"}`
- `imageUrl` - URL do zdjęcia (relatywny do `/public` lub absolutny)
- `tips` - tablica tipów w formacie JSON: `["tip 1", "tip 2"]`

Przykład:

```json
{
  "pageNumber": 1,
  "title": "Wprowadzenie",
  "content": "{\"text\": \"Witaj w kursie!\"}",
  "imageUrl": "/course/strona 1/Foto/hero-1.jpg",
  "tips": "[\"Zacznij od przygotowania materiałów\", \"Użyj dobrego światła\"]"
}
```

## Rozwiązywanie problemów

### Błąd połączenia z bazą danych

- Sprawdź, czy PostgreSQL jest uruchomiony
- Sprawdź `DATABASE_URL` w `.env`
- Uruchom `npx prisma migrate dev` ponownie

### Webhook Lemon Squeezy nie działa

- Sprawdź, czy URL webhooka jest dostępny publicznie (użyj ngrok dla developmentu)
- Sprawdź `LEMON_SQUEEZY_WEBHOOK_SECRET` w `.env`
- Sprawdź logi serwera

### Webhook Stripe nie działa

- Sprawdź, czy URL webhooka jest dostępny publicznie
- Użyj [Stripe CLI](https://stripe.com/docs/stripe-cli) do testowania lokalnie
- Sprawdź `STRIPE_WEBHOOK_SECRET` w `.env`
- Sprawdź logi w [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
- Upewnij się, że wybrałeś odpowiednie eventy (`checkout.session.completed`)

### Obrazy się nie ładują

- Sprawdź, czy obrazy są w folderze `public/course/`
- Sprawdź, czy `imageUrl` w bazie danych jest poprawne
- Sprawdź konfigurację Next.js Image w `next.config.js`

## Następne kroki

- [ ] Integracja z prawdziwym serwisem emailowym (SendGrid, Resend, etc.)
- [ ] Panel administracyjny do zarządzania kursem
- [ ] System zapisywania postępu użytkownika
- [ ] Obsługa wielu języków
- [ ] Upload zdjęć przez interfejs

