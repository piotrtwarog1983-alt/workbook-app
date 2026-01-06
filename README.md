# WorkBook - Fotografia Kulinarna

Platforma edukacyjna do nauki fotografii kulinarnej smartfonem.

## Funkcje

- 📚 Interaktywny kurs z 51 stronami
- 📸 Upload zdjęć z postępami przez QR kod
- 💬 Chat z adminem
- 📖 Słownik pojęć fotograficznych
- ⏱️ Śledzenie postępów w czasie rzeczywistym (Pusher)

## Technologie

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma (PostgreSQL)
- Vercel Blob Storage
- Pusher (real-time)
- Resend (email)

## Uruchomienie

```bash
npm install
npx prisma db push
npm run dev
```

## Dokumentacja

Szczegółowa dokumentacja znajduje się w folderze `docs/`:
- `SETUP.md` - Instrukcja konfiguracji
- `DEPLOY_CHECKLIST.md` - Checklist wdrożenia
- `VERCEL_POSTGRES_SETUP.md` - Konfiguracja bazy danych

## Struktura projektu

```
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── course/            # Strony kursu
│   └── admin/             # Panel admina
├── components/            # Komponenty React
├── lib/                   # Utilities i helpery
├── prisma/               # Schema bazy danych
├── public/course/        # Treść kursu (zdjęcia, teksty, tipy)
└── docs/                 # Dokumentacja projektu
```

## Zmienne środowiskowe

Zobacz `.env.example` dla wymaganych zmiennych:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Sekret dla JWT tokenów
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob Storage
- `PUSHER_*` - Konfiguracja Pusher
- `RESEND_API_KEY` - Klucz API Resend
- `NEXT_PUBLIC_APP_URL` - URL aplikacji

### Płatności (wybierz jeden lub oba):
**Lemon Squeezy:**
- `LEMON_SQUEEZY_WEBHOOK_SECRET` - Secret webhooka

**Stripe:**
- `STRIPE_SECRET_KEY` - Klucz prywatny Stripe
- `STRIPE_WEBHOOK_SECRET` - Secret webhooka Stripe
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Klucz publiczny Stripe

## License

Proprietary - © 2025 Eulalia Twarog
