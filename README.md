# WorkBook - Platforma Kursowa

Platforma do sprzedaży i dostarczania kursu fotografii kulinarnej.

## Funkcjonalności

- 🛒 Landing page z przyciskiem zakupu (Lemon Squeezy)
- 🔔 Webhook do odbierania potwierdzeń płatności
- ✉️ Automatyczne generowanie linku rejestracyjnego
- 👤 System rejestracji i logowania
- 📚 Platforma kursowa z:
  - Kwadratowym kontenerem na treści/zdjęcia
  - Nawigacją strzałkami między stronami
  - Popupami z tipami w formie chmurki
  - Słownikiem pojęć dostępnym w każdej chwili
  - Layoutem: treść po lewej, tipy i słownik po prawej

## Technologie

- Next.js 14 (App Router)
- TypeScript
- Prisma (MySQL 8.0)
- Tailwind CSS
- JWT Authentication
- Lemon Squeezy Integration

## Instalacja

1. Zainstaluj zależności:
```bash
npm install
```

2. Skonfiguruj zmienne środowiskowe (szablon znajdziesz w `.env.example`):
```bash
cp .env.example .env
```

Edytuj `.env` i uzupełnij:
- `DATABASE_URL` - URL do bazy danych MySQL (np. `mysql://user:password@host:3306/database?schema=public`)
- `JWT_SECRET` - Sekretny klucz JWT
- `LEMON_SQUEEZY_WEBHOOK_SECRET` - Secret z Lemon Squeezy
- `NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL` - URL do checkoutu Lemon Squeezy
- `NEXT_PUBLIC_APP_URL` - URL aplikacji

3. Skonfiguruj bazę danych:
```bash
npx prisma migrate dev
npx prisma generate
```

4. (Opcjonalnie) Dodaj przykładowe dane:
```bash
# Utwórz skrypt seed w prisma/seed.ts
npx prisma db seed
```

5. Uruchom serwer deweloperski:
```bash
npm run dev
```

## Konfiguracja Lemon Squeezy

1. W panelu Lemon Squeezy przejdź do ustawień webhooków
2. Dodaj webhook z URL: `https://twoja-domena.com/api/webhooks/lemonsqueezy`
3. Wybierz event: `order_created`
4. Skopiuj secret i dodaj do `.env` jako `LEMON_SQUEEZY_WEBHOOK_SECRET`

## Struktura kursu

Kurs składa się ze stron (CoursePage), które mogą zawierać:
- Tekst (JSON w polu `content`)
- Zdjęcia (URL w polu `imageUrl`)
- Tipy (JSON array w polu `tips`)

Strony są przechowywane w folderze `public/course/strona X/` z podfolderami:
- `Foto/` - zdjęcia
- `Wersja/PL/` - treści tekstowe (do implementacji)

## API Endpoints

- `POST /api/webhooks/lemonsqueezy` - Webhook od Lemon Squeezy
- `POST /api/auth/register` - Rejestracja użytkownika
- `POST /api/auth/login` - Logowanie
- `GET /api/courses/[slug]` - Pobranie kursu (wymaga autoryzacji)
- `GET /api/glossary` - Pobranie słownika pojęć

## TODO

- [ ] Integracja z prawdziwym serwisem emailowym
- [ ] Upload i zarządzanie zdjęciami kursu
- [ ] System zapisywania postępu użytkownika
- [ ] Wiele języków dla treści kursu
- [ ] Panel administracyjny do zarządzania kursem

