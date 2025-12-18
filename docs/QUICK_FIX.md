# Szybka naprawa problemów

## Problem 1: Seed nie działa

Naprawiłem seed - teraz używa `seed.js` zamiast `seed.ts`. Uruchom:

```bash
npx prisma db seed
```

Jeśli nadal nie działa, sprawdź czy masz:
1. Skonfigurowaną bazę danych w `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/workbook?schema=public"
```

2. Uruchomione migracje:
```bash
npx prisma migrate dev
```

## Problem 2: 404 na `/course/strona-1`

**To nie jest poprawna ścieżka!** 

Poprawna ścieżka to: `/course` (bez `/strona-1`)

Kurs ładuje się przez API, a nie przez statyczne pliki. Strony kursu są w bazie danych, nie jako osobne route'y.

## Problem 3: Brak danych w bazie

Jeśli widzisz błąd 404 lub "Kurs nie został znaleziony":

1. Upewnij się, że seed się wykonał:
```bash
npx prisma db seed
```

2. Sprawdź czy kurs istnieje w bazie:
```bash
npx prisma studio
```

3. Jeśli nie ma kursu, uruchom seed ponownie

## Problem 4: Brak autoryzacji

Jeśli widzisz "Brak autoryzacji" lub przekierowanie do `/login`:

1. Musisz się najpierw zarejestrować (przez link z emaila po zakupie)
2. Lub zalogować się na `/login`

## Kolejność działań:

1. **Zainstaluj zależności:**
```bash
npm install
```

2. **Skonfiguruj `.env`:**
```
DATABASE_URL="postgresql://user:password@localhost:5432/workbook?schema=public"
JWT_SECRET="twój-losowy-klucz"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

3. **Uruchom migracje:**
```bash
npx prisma migrate dev
npx prisma generate
```

4. **Załaduj dane:**
```bash
npx prisma db seed
```

5. **Uruchom aplikację:**
```bash
npm run dev
```

6. **Wejdź na poprawną ścieżkę:**
- Strona główna: `http://localhost:3000`
- Kurs: `http://localhost:3000/course` (NIE `/course/strona-1`)

## Sprawdzenie czy wszystko działa:

1. Otwórz `http://localhost:3000` - powinna być strona główna
2. Kliknij "Kup teraz" - przekierowanie do Lemon Squeezy
3. Po zakupie (lub w testach) użyj linku z emaila do rejestracji
4. Zaloguj się i wejdź na `/course` - powinien załadować się kurs

## Jeśli nadal nie działa:

Sprawdź logi w terminalu - powinny pokazać dokładny błąd.

