export type Language = 'PL' | 'DE'

export const translations = {
  PL: {
    // Nawigacja i ogólne
    common: {
      logout: 'Wyloguj',
      login: 'Zaloguj się',
      register: 'Zarejestruj się',
      submit: 'Wyślij',
      cancel: 'Anuluj',
      save: 'Zapisz',
      close: 'Zamknij',
      loading: 'Ładowanie...',
      error: 'Błąd',
      success: 'Sukces',
      back: 'Wstecz',
      next: 'Dalej',
      previous: 'Poprzedni',
      page: 'Strona',
      of: 'z',
    },

    // Strona logowania
    login: {
      title: 'Logowanie',
      subtitle: 'Zaloguj się do swojego konta',
      email: 'Adres email',
      emailPlaceholder: 'Wpisz swój email',
      password: 'Hasło',
      passwordPlaceholder: 'Wpisz hasło',
      forgotPassword: 'Zapomniałeś hasła?',
      noAccount: 'Nie masz konta?',
      registerHere: 'Zarejestruj się tutaj',
      loginButton: 'Zaloguj się',
      loggingIn: 'Logowanie...',
      invalidCredentials: 'Nieprawidłowy email lub hasło',
      tooManyAttempts: 'Zbyt wiele prób logowania. Spróbuj ponownie za kilka minut.',
      loginError: 'Wystąpił błąd podczas logowania',
    },

    // Strona rejestracji
    signup: {
      title: 'Rejestracja',
      subtitle: 'Utwórz nowe konto',
      name: 'Imię i nazwisko',
      namePlaceholder: 'Wpisz swoje imię',
      email: 'Adres email',
      emailPlaceholder: 'Wpisz swój email',
      password: 'Hasło',
      passwordPlaceholder: 'Utwórz hasło (min. 8 znaków)',
      confirmPassword: 'Potwierdź hasło',
      confirmPasswordPlaceholder: 'Wpisz hasło ponownie',
      registrationToken: 'Token rejestracyjny',
      registrationTokenPlaceholder: 'Wpisz token otrzymany w emailu',
      termsAccept: 'Akceptuję',
      termsOfService: 'Regulamin',
      and: 'oraz',
      privacyPolicy: 'Politykę prywatności',
      registerButton: 'Zarejestruj się',
      registering: 'Rejestracja...',
      haveAccount: 'Masz już konto?',
      loginHere: 'Zaloguj się tutaj',
      passwordMismatch: 'Hasła nie są identyczne',
      passwordTooShort: 'Hasło musi mieć minimum 8 znaków',
      tokenRequired: 'Token rejestracyjny jest wymagany',
      termsRequired: 'Musisz zaakceptować regulamin i politykę prywatności',
      registrationError: 'Wystąpił błąd podczas rejestracji',
      invalidToken: 'Nieprawidłowy lub wygasły token rejestracyjny',
      emailExists: 'Konto z tym adresem email już istnieje',
    },

    // Resetowanie hasła
    forgotPassword: {
      title: 'Resetowanie hasła',
      subtitle: 'Podaj swój email, a wyślemy Ci link do resetowania hasła',
      email: 'Adres email',
      emailPlaceholder: 'Wpisz swój email',
      sendButton: 'Wyślij link resetowania',
      sending: 'Wysyłanie...',
      successMessage: 'Link do resetowania hasła został wysłany na Twój email',
      backToLogin: 'Wróć do logowania',
      emailNotFound: 'Nie znaleziono konta z tym adresem email',
    },

    resetPassword: {
      title: 'Nowe hasło',
      subtitle: 'Wprowadź nowe hasło dla swojego konta',
      password: 'Nowe hasło',
      passwordPlaceholder: 'Wpisz nowe hasło',
      confirmPassword: 'Potwierdź hasło',
      confirmPasswordPlaceholder: 'Wpisz hasło ponownie',
      resetButton: 'Ustaw nowe hasło',
      resetting: 'Ustawianie...',
      successMessage: 'Hasło zostało zmienione. Możesz się teraz zalogować.',
      invalidToken: 'Nieprawidłowy lub wygasły link do resetowania hasła',
      tokenExpired: 'Link do resetowania hasła wygasł',
    },

    // Kurs - główny widok
    course: {
      loadingCourse: 'Ładowanie kursu...',
      yourProgress: 'TWOJE POSTĘPY',
      dictionary: 'Słownik pojęć',
      lastPage: 'Ostatnia strona',
      chat: 'Wiadomości',
      tips: 'Tipy',
      noTips: 'Brak tipów dla tej strony',
      uploadPhoto: 'Prześlij zdjęcie',
      unlockNextStep: 'Aby odblokować następny krok, dodaj zdjęcie',
      scanQR: 'Zeskanuj kod QR telefonem',
      orUploadHere: 'lub prześlij zdjęcie tutaj',
      dragAndDrop: 'Przeciągnij i upuść zdjęcie',
      selectFile: 'Wybierz plik',
      uploading: 'Przesyłanie...',
      uploadSuccess: 'Zdjęcie zostało przesłane',
      uploadError: 'Błąd podczas przesyłania zdjęcia',
      pageNavigation: 'Nawigacja stron',
      goToPage: 'Przejdź do strony',
      loadingQR: 'Ładowanie kodu QR...',
      refreshPage: 'Odśwież stronę',
      // Upload
      submitPhoto: 'Prześlij swoje zdjęcie',
      dragOrClick: 'Przeciągnij zdjęcie tutaj lub kliknij, aby wybrać',
      supportedFormats: 'Obsługiwane formaty: JPG, PNG, WEBP',
      photoUploaded: 'Zdjęcie zostało przesłane pomyślnie!',
      uploadOther: 'Prześlij inne zdjęcie',
      uploadFromPhone: 'Lub prześlij z telefonu:',
      waitingForUpload: 'Czekam na przesłanie zdjęcia z telefonu...',
      scanQRToUpload: 'Zeskanuj kod QR telefonem, aby otworzyć stronę do przesłania zdjęcia bezpośrednio z urządzenia mobilnego',
      mustBeLoggedIn: 'Musisz być zalogowany, aby przesłać zdjęcie',
      failedToGetUploadId: 'Nie udało się pobrać identyfikatora uploadu',
      failedToLoadUserData: 'Nie udało się załadować danych użytkownika',
      pleaseSelectImage: 'Proszę wybrać plik graficzny',
      noUploadId: 'Brak identyfikatora uploadu. Odśwież stronę.',
      uploadFailed: 'Nie udało się przesłać zdjęcia. Spróbuj ponownie.',
    },

    // Pasek postępów
    progress: {
      light: 'światło',
      horizon: 'horyzont',
      composition: 'kompozycja',
      perspective: 'perspektywa',
      proportions: 'proporcje',
      retouching: 'retusz',
      final: 'finał',
      goTo: 'Przejdź do:',
    },

    // Chat
    chat: {
      title: 'Wiadomości',
      placeholder: 'Napisz wiadomość...',
      send: 'Wyślij',
      noMessages: 'Brak wiadomości. Napisz do nas!',
      you: 'Ty',
      admin: 'Zespół',
      loadMore: 'Wczytaj starsze',
    },

    // Słownik
    dictionary: {
      title: 'Słownik pojęć',
      searchPlaceholder: 'Szukaj terminu...',
      noResults: 'Nie znaleziono terminów',
    },

    // Galeria postępów
    gallery: {
      title: 'Twoje zdjęcia',
      noPhotos: 'Brak przesłanych zdjęć',
      viewFull: 'Zobacz w pełnym rozmiarze',
      delete: 'Usuń',
      confirmDelete: 'Czy na pewno chcesz usunąć to zdjęcie?',
    },

    // Emaile
    emails: {
      registrationSubject: 'Witamy w kursie fotografii kulinarnej!',
      registrationBody: 'Dziękujemy za rejestrację. Twoje konto zostało aktywowane.',
      resetSubject: 'Resetowanie hasła',
      resetBody: 'Kliknij poniższy link, aby zresetować hasło:',
      resetExpiry: 'Link wygaśnie za 1 godzinę.',
      resetIgnore: 'Jeśli nie prosiłeś o resetowanie hasła, zignoruj tę wiadomość.',
    },

    // Upload page
    upload: {
      title: 'Prześlij zdjęcie',
      success: 'Zdjęcie zostało przesłane pomyślnie!',
      closeWindow: 'Możesz zamknąć to okno.',
      selectFromGallery: 'Wybierz zdjęcie z galerii',
      selectOther: 'Wybierz inne zdjęcie',
      submitPhoto: 'Prześlij zdjęcie',
      uploading: 'Przesyłanie...',
      invalidLink: 'Błąd: Nieprawidłowy link',
      invalidLinkDesc: 'Link do uploadu jest nieprawidłowy. Sprawdź kod QR ponownie.',
      missingParams: 'Brak wymaganych parametrów w linku',
      missingData: 'Brak wymaganych danych',
      uploadFailed: 'Nie udało się przesłać zdjęcia. Spróbuj ponownie.',
      pleaseSelectImage: 'Proszę wybrać plik graficzny',
    },

    // Błędy API
    errors: {
      generic: 'Wystąpił błąd. Spróbuj ponownie.',
      network: 'Błąd połączenia. Sprawdź internet.',
      unauthorized: 'Sesja wygasła. Zaloguj się ponownie.',
      notFound: 'Nie znaleziono zasobu.',
      serverError: 'Błąd serwera. Spróbuj ponownie później.',
    },
  },

  DE: {
    // Navigation und Allgemein
    common: {
      logout: 'Abmelden',
      login: 'Anmelden',
      register: 'Registrieren',
      submit: 'Absenden',
      cancel: 'Abbrechen',
      save: 'Speichern',
      close: 'Schließen',
      loading: 'Lädt...',
      error: 'Fehler',
      success: 'Erfolg',
      back: 'Zurück',
      next: 'Weiter',
      previous: 'Zurück',
      page: 'Seite',
      of: 'von',
    },

    // Anmeldeseite
    login: {
      title: 'Anmeldung',
      subtitle: 'Melden Sie sich bei Ihrem Konto an',
      email: 'E-Mail-Adresse',
      emailPlaceholder: 'Geben Sie Ihre E-Mail ein',
      password: 'Passwort',
      passwordPlaceholder: 'Geben Sie Ihr Passwort ein',
      forgotPassword: 'Passwort vergessen?',
      noAccount: 'Noch kein Konto?',
      registerHere: 'Hier registrieren',
      loginButton: 'Anmelden',
      loggingIn: 'Anmeldung...',
      invalidCredentials: 'Ungültige E-Mail oder Passwort',
      tooManyAttempts: 'Zu viele Anmeldeversuche. Versuchen Sie es in einigen Minuten erneut.',
      loginError: 'Bei der Anmeldung ist ein Fehler aufgetreten',
    },

    // Registrierungsseite
    signup: {
      title: 'Registrierung',
      subtitle: 'Erstellen Sie ein neues Konto',
      name: 'Name',
      namePlaceholder: 'Geben Sie Ihren Namen ein',
      email: 'E-Mail-Adresse',
      emailPlaceholder: 'Geben Sie Ihre E-Mail ein',
      password: 'Passwort',
      passwordPlaceholder: 'Passwort erstellen (min. 8 Zeichen)',
      confirmPassword: 'Passwort bestätigen',
      confirmPasswordPlaceholder: 'Passwort erneut eingeben',
      registrationToken: 'Registrierungscode',
      registrationTokenPlaceholder: 'Code aus der E-Mail eingeben',
      termsAccept: 'Ich akzeptiere die',
      termsOfService: 'AGB',
      and: 'und',
      privacyPolicy: 'Datenschutzrichtlinie',
      registerButton: 'Registrieren',
      registering: 'Registrierung...',
      haveAccount: 'Bereits ein Konto?',
      loginHere: 'Hier anmelden',
      passwordMismatch: 'Passwörter stimmen nicht überein',
      passwordTooShort: 'Passwort muss mindestens 8 Zeichen haben',
      tokenRequired: 'Registrierungscode ist erforderlich',
      termsRequired: 'Sie müssen die AGB und Datenschutzrichtlinie akzeptieren',
      registrationError: 'Bei der Registrierung ist ein Fehler aufgetreten',
      invalidToken: 'Ungültiger oder abgelaufener Registrierungscode',
      emailExists: 'Ein Konto mit dieser E-Mail existiert bereits',
    },

    // Passwort zurücksetzen
    forgotPassword: {
      title: 'Passwort zurücksetzen',
      subtitle: 'Geben Sie Ihre E-Mail ein und wir senden Ihnen einen Link zum Zurücksetzen',
      email: 'E-Mail-Adresse',
      emailPlaceholder: 'Geben Sie Ihre E-Mail ein',
      sendButton: 'Link senden',
      sending: 'Senden...',
      successMessage: 'Ein Link zum Zurücksetzen wurde an Ihre E-Mail gesendet',
      backToLogin: 'Zurück zur Anmeldung',
      emailNotFound: 'Kein Konto mit dieser E-Mail gefunden',
    },

    resetPassword: {
      title: 'Neues Passwort',
      subtitle: 'Geben Sie ein neues Passwort für Ihr Konto ein',
      password: 'Neues Passwort',
      passwordPlaceholder: 'Neues Passwort eingeben',
      confirmPassword: 'Passwort bestätigen',
      confirmPasswordPlaceholder: 'Passwort erneut eingeben',
      resetButton: 'Neues Passwort setzen',
      resetting: 'Wird gesetzt...',
      successMessage: 'Passwort wurde geändert. Sie können sich jetzt anmelden.',
      invalidToken: 'Ungültiger oder abgelaufener Link zum Zurücksetzen',
      tokenExpired: 'Der Link zum Zurücksetzen ist abgelaufen',
    },

    // Kurs - Hauptansicht
    course: {
      loadingCourse: 'Kurs wird geladen...',
      yourProgress: 'IHR FORTSCHRITT',
      dictionary: 'Glossar',
      lastPage: 'Letzte Seite',
      chat: 'Nachrichten',
      tips: 'Tipps',
      noTips: 'Keine Tipps für diese Seite',
      uploadPhoto: 'Foto hochladen',
      unlockNextStep: 'Um den nächsten Schritt freizuschalten, fügen Sie ein Foto hinzu',
      scanQR: 'QR-Code mit dem Handy scannen',
      orUploadHere: 'oder Foto hier hochladen',
      dragAndDrop: 'Foto hierher ziehen',
      selectFile: 'Datei auswählen',
      uploading: 'Wird hochgeladen...',
      uploadSuccess: 'Foto wurde hochgeladen',
      uploadError: 'Fehler beim Hochladen',
      pageNavigation: 'Seitennavigation',
      goToPage: 'Zur Seite gehen',
      loadingQR: 'QR-Code wird geladen...',
      refreshPage: 'Seite aktualisieren',
      // Upload
      submitPhoto: 'Laden Sie Ihr Foto hoch',
      dragOrClick: 'Ziehen Sie das Foto hierher oder klicken Sie, um auszuwählen',
      supportedFormats: 'Unterstützte Formate: JPG, PNG, WEBP',
      photoUploaded: 'Foto wurde erfolgreich hochgeladen!',
      uploadOther: 'Anderes Foto hochladen',
      uploadFromPhone: 'Oder vom Handy hochladen:',
      waitingForUpload: 'Warte auf Foto-Upload vom Handy...',
      scanQRToUpload: 'Scannen Sie den QR-Code mit Ihrem Handy, um die Seite zum Hochladen von Fotos direkt vom Mobilgerät zu öffnen',
      mustBeLoggedIn: 'Sie müssen angemeldet sein, um ein Foto hochzuladen',
      failedToGetUploadId: 'Upload-ID konnte nicht abgerufen werden',
      failedToLoadUserData: 'Benutzerdaten konnten nicht geladen werden',
      pleaseSelectImage: 'Bitte wählen Sie eine Bilddatei',
      noUploadId: 'Keine Upload-ID. Seite aktualisieren.',
      uploadFailed: 'Foto konnte nicht hochgeladen werden. Versuchen Sie es erneut.',
    },

    // Fortschrittsleiste
    progress: {
      light: 'Licht',
      horizon: 'Horizont',
      composition: 'Komposition',
      perspective: 'Perspektive',
      proportions: 'Proportionen',
      retouching: 'Retusche',
      final: 'Finale',
      goTo: 'Gehe zu:',
    },

    // Chat
    chat: {
      title: 'Nachrichten',
      placeholder: 'Nachricht schreiben...',
      send: 'Senden',
      noMessages: 'Keine Nachrichten. Schreiben Sie uns!',
      you: 'Sie',
      admin: 'Team',
      loadMore: 'Ältere laden',
    },

    // Glossar
    dictionary: {
      title: 'Glossar',
      searchPlaceholder: 'Begriff suchen...',
      noResults: 'Keine Begriffe gefunden',
    },

    // Fortschrittsgalerie
    gallery: {
      title: 'Ihre Fotos',
      noPhotos: 'Keine hochgeladenen Fotos',
      viewFull: 'In voller Größe ansehen',
      delete: 'Löschen',
      confirmDelete: 'Möchten Sie dieses Foto wirklich löschen?',
    },

    // E-Mails
    emails: {
      registrationSubject: 'Willkommen beim Kurs für Food-Fotografie!',
      registrationBody: 'Vielen Dank für Ihre Registrierung. Ihr Konto wurde aktiviert.',
      resetSubject: 'Passwort zurücksetzen',
      resetBody: 'Klicken Sie auf den folgenden Link, um Ihr Passwort zurückzusetzen:',
      resetExpiry: 'Der Link läuft in 1 Stunde ab.',
      resetIgnore: 'Wenn Sie kein Zurücksetzen des Passworts angefordert haben, ignorieren Sie diese Nachricht.',
    },

    // Upload-Seite
    upload: {
      title: 'Foto hochladen',
      success: 'Foto wurde erfolgreich hochgeladen!',
      closeWindow: 'Sie können dieses Fenster schließen.',
      selectFromGallery: 'Foto aus Galerie auswählen',
      selectOther: 'Anderes Foto auswählen',
      submitPhoto: 'Foto hochladen',
      uploading: 'Wird hochgeladen...',
      invalidLink: 'Fehler: Ungültiger Link',
      invalidLinkDesc: 'Der Upload-Link ist ungültig. Überprüfen Sie den QR-Code erneut.',
      missingParams: 'Fehlende erforderliche Parameter im Link',
      missingData: 'Fehlende erforderliche Daten',
      uploadFailed: 'Foto konnte nicht hochgeladen werden. Versuchen Sie es erneut.',
      pleaseSelectImage: 'Bitte wählen Sie eine Bilddatei',
    },

    // API-Fehler
    errors: {
      generic: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
      network: 'Verbindungsfehler. Überprüfen Sie Ihre Internetverbindung.',
      unauthorized: 'Sitzung abgelaufen. Bitte melden Sie sich erneut an.',
      notFound: 'Ressource nicht gefunden.',
      serverError: 'Serverfehler. Bitte versuchen Sie es später erneut.',
    },
  },
} as const

export type TranslationKeys = typeof translations.PL














