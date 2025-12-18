// Mock data - dane testowe do pracy bez bazy danych
// Używane zarówno w CourseViewer jak i API routes

export const MOCK_COURSE = {
  id: '1',
  title: 'WorkBook - Fotografia Kulinarna',
  description: 'Naucz się robić profesjonalne zdjęcia potraw smartfonem',
  slug: 'fotografia-kulinarna',
  pages: [
    {
      id: '1',
      pageNumber: 1,
      title: '',
      content: JSON.stringify({
        type: 'grid-2x2',
        panels: [
          {
            type: 'image',
            imageUrl: '/course/strona 1/Foto/hero-1.jpg',
          },
          {
            type: 'image',
            imageUrl: '/course/strona 1/Foto/hero-2.jpg',
          },
          {
            type: 'text',
            text: 'EULALIA TWAROG\n\nFine Dining Smartphone Photography\n\n★\n\nWORKBOOK FOR CHEFS\n\nTHE BASICS\nWHITE BACKGROUND PHOTOGRAPHY',
            backgroundColor: 'dark',
          },
          {
            type: 'image',
            imageUrl: '/course/strona 1/Foto/hero-3.jpg',
          },
        ],
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '2',
      pageNumber: 2,
      title: '',
      content: JSON.stringify({
        type: 'image-overlay',
        imageUrl: '/course/strona 2/Foto/portret.jpg',
        textFile: '/api/course-content/2/PL',
        textPosition: 'left',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '3',
      pageNumber: 3,
      title: '',
      content: JSON.stringify({
        type: 'quote-text',
        textFile: '/api/course-content/3/PL',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '4',
      pageNumber: 4,
      title: '',
      content: JSON.stringify({
        type: 'image-overlay-text',
        imageUrl: '/course/strona 4/Foto/start.jpg',
        overlayText: 'Start',
        textPosition: 'bottom-center',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '5',
      pageNumber: 5,
      title: '',
      content: JSON.stringify({
        type: 'image-overlay-text-top',
        imageUrl: '/course/strona 5/Foto/6.jpg',
        textFile: '/api/course-content/5/PL',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '6',
      pageNumber: 6,
      title: '',
      content: JSON.stringify({
        type: 'simple-text',
        textFile: '/api/course-content/6/PL',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '7',
      pageNumber: 7,
      title: '',
      content: JSON.stringify({
        type: 'qr-upload',
      }),
      tips: JSON.stringify(['Zrób zdjęcie potrawy na białym tle', 'Użyj naturalnego światła z okna', 'Ustaw telefon stabilnie']),
    },
    {
      id: '8',
      pageNumber: 8,
      title: '',
      content: JSON.stringify({
        type: 'text-image-split',
        textFile: '/api/course-content/8/PL',
        imageUrl: '/course/strona 8/Foto/8.jpg',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '9',
      pageNumber: 9,
      title: '',
      content: JSON.stringify({
        type: 'simple-text',
        text: 'Ustawienia\nsmartfona',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '10',
      pageNumber: 10,
      title: '',
      content: JSON.stringify({
        type: 'formatted-text',
        textFile: '/api/course-content/10/PL',
      }),
      tips: JSON.stringify(['Zapoznaj się dokładnie z ustawieniami swojego aparatu']),
    },
    {
      id: '11',
      pageNumber: 11,
      title: '',
      content: JSON.stringify({
        type: 'image-overlay-text',
        imageUrl: '/course/strona 11/Foto/11.jpg',
        overlayText: 'Światło',
        textPosition: 'bottom',
      }),
      tips: JSON.stringify(['Światło to podstawa dobrej fotografii kulinarnej']),
    },
    {
      id: '12',
      pageNumber: 12,
      title: '',
      content: JSON.stringify({
        type: 'image-overlay-text-file',
        imageUrl: '/course/strona 12/Foto/12.jpg',
        textFile: '/api/course-content/12/PL',
        textPosition: 'top',
      }),
      tips: JSON.stringify([
        'Styropian sprawdza się świetnie, ponieważ jest sztywny i łatwo można go ustawić na stole',
      ]),
    },
    {
      id: '13',
      pageNumber: 13,
      title: '',
      content: JSON.stringify({
        type: 'image-overlay-text-file',
        imageUrl: '/course/strona 13/Foto/13.jpg',
        textFile: '/api/course-content/13/PL',
        textPosition: 'top-left',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '14',
      pageNumber: 14,
      title: '',
      content: JSON.stringify({
        type: 'black-header-image',
        imageUrl: '/course/strona 14/Foto/14.jpg',
        textFile: '/api/course-content/14/PL',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '15',
      pageNumber: 15,
      title: '',
      content: JSON.stringify({
        type: 'qr-upload',
      }),
      tips: JSON.stringify(['Pamiętaj o linii horyzontu', 'Sprawdź czy zdjęcie jest proste']),
    },
    {
      id: '16',
      pageNumber: 16,
      title: '',
      content: JSON.stringify({
        type: 'progress-evaluation',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '17',
      pageNumber: 17,
      title: '',
      content: JSON.stringify({
        type: 'simple-text',
        text: 'PROSTY\nHORYZONT',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '18',
      pageNumber: 18,
      title: '',
      content: JSON.stringify({
        type: 'image-overlay-text-file',
        imageUrl: '/course/strona 18/Foto/18.jpg',
        textFile: '/api/course-content/18/PL',
        textPosition: 'top-left',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '19',
      pageNumber: 19,
      title: '',
      content: JSON.stringify({
        type: 'black-header-image',
        imageUrl: '/course/strona 19/Foto/19.jpg',
        textFile: '/api/course-content/19/PL',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '20',
      pageNumber: 20,
      title: '',
      content: JSON.stringify({
        type: 'qr-upload',
      }),
      tips: JSON.stringify([
        'W ustawieniach aparatu możesz włączyć siatkę w której znajduje się opcja żyroskopu pokazująca przechył telefonu',
      ]),
    },
    {
      id: '21',
      pageNumber: 21,
      title: '',
      content: JSON.stringify({
        type: 'progress-evaluation',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '22',
      pageNumber: 22,
      title: '',
      content: JSON.stringify({
        type: 'simple-text',
        text: 'KOMPOZYCJA',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '23',
      pageNumber: 23,
      title: '',
      content: JSON.stringify({
        type: 'image-overlay-text',
        imageUrl: '/course/strona 23/Foto/23.jpg',
        overlayText: 'Centrum',
        textPosition: 'top-center-lower',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '24',
      pageNumber: 24,
      title: '',
      content: JSON.stringify({
        type: 'two-images-container',
        text: 'Danie w centrum to klasyka i fundament:\ngdy talerz jest prosty i w środku zdjęcia, całość wygląda pięknie, czysto i klasycznie.',
        image1Url: '/course/strona 24/Foto/24-1.jpg',
        image2Url: '/course/strona 24/Foto/24-2.jpg',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '25',
      pageNumber: 25,
      title: '',
      content: JSON.stringify({
        type: 'black-header-image',
        imageUrl: '/course/strona 25/Foto/25.jpg',
        textFile: '/api/course-content/25/PL',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '26',
      pageNumber: 26,
      title: '',
      content: JSON.stringify({
        type: 'image-overlay-text-white',
        imageUrl: '/course/strona 26/Foto/26.jpg',
        textFile: '/api/course-content/26/PL',
        textPosition: 'top-center',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '27',
      pageNumber: 27,
      title: '',
      content: JSON.stringify({
        type: 'two-images-top-text',
        textFile: '/api/course-content/27/PL',
        image1Url: '/course/strona 27/Foto/27-1.jpg',
        image2Url: '/course/strona 27/Foto/27-2.jpg',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '28',
      pageNumber: 28,
      title: '',
      content: JSON.stringify({
        type: 'black-header-image',
        imageUrl: '/course/strona 28/Foto/28.jpg',
        textFile: '/api/course-content/28/PL',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '29',
      pageNumber: 29,
      title: '',
      content: JSON.stringify({
        type: 'qr-upload',
      }),
      tips: JSON.stringify([
        'W ustawieniach aparatu na twoim telefonie włącz siatkę trójpodziału - ułatwi to znacząco fotografowanie',
      ]),
    },
    {
      id: '30',
      pageNumber: 30,
      title: '',
      content: JSON.stringify({
        type: 'progress-evaluation',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '31',
      pageNumber: 31,
      title: '',
      content: JSON.stringify({
        type: 'image-overlay-text-file',
        imageUrl: '/course/strona 31/Foto/31.jpg',
        textFile: '/api/course-content/31/PL',
        textPosition: 'top-center',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '32',
      pageNumber: 32,
      title: '',
      content: JSON.stringify({
        type: 'two-images-top-text',
        textFile: '/api/course-content/32/PL',
        image1Url: '/course/strona 32/Foto/32-1.jpg',
        image2Url: '/course/strona 32/Foto/32-2.jpg',
        iconUrl: '/course/strona 32/Foto/prawo.png',
        iconUrlRight: '/course/strona 32/Foto/lewo.png',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '33',
      pageNumber: 33,
      title: '',
      content: JSON.stringify({
        type: 'white-header-image',
        imageUrl: '/course/strona 33/Foto/33.jpg',
        textFile: '/api/course-content/33/PL',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '34',
      pageNumber: 34,
      title: '',
      content: JSON.stringify({
        type: 'black-header-image',
        imageUrl: '/course/strona 34/Foto/34.jpg',
        textFile: '/api/course-content/34/PL',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '35',
      pageNumber: 35,
      title: '',
      content: JSON.stringify({
        type: 'qr-upload',
      }),
      tips: JSON.stringify(['Skup się na stylizacji i kompozycji']),
    },
    {
      id: '36',
      pageNumber: 36,
      title: '',
      content: JSON.stringify({
        type: 'progress-evaluation',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '37',
      pageNumber: 37,
      title: '',
      content: JSON.stringify({
        type: 'image-overlay-text',
        imageUrl: '/course/strona 37/Foto/37.jpg',
        overlayText: 'Proporcje',
        textPosition: 'top-center',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '38',
      pageNumber: 38,
      title: '',
      content: JSON.stringify({
        type: 'two-images-top-text',
        textFile: '/api/course-content/38/PL',
        image1Url: '/course/strona 38/Foto/38-1.jpg',
        image2Url: '/course/strona 38/Foto/38-2.jpg',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '39',
      pageNumber: 39,
      title: '',
      content: JSON.stringify({
        type: 'black-header-image',
        imageUrl: '/course/strona 39/Foto/39.jpg',
        textFile: '/api/course-content/39/PL',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '40',
      pageNumber: 40,
      title: '',
      content: JSON.stringify({
        type: 'qr-upload',
      }),
      tips: JSON.stringify(['Zastosuj wiedzę o edycji zdjęć']),
    },
    {
      id: '41',
      pageNumber: 41,
      title: '',
      content: JSON.stringify({
        type: 'progress-evaluation',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '42',
      pageNumber: 42,
      title: '',
      content: JSON.stringify({
        type: 'image-overlay-text',
        imageUrl: '/course/strona 42/Foto/42.jpg',
        overlayText: 'Obróbka zdjęć',
        textPosition: 'top-center',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '43',
      pageNumber: 43,
      title: '',
      content: JSON.stringify({
        type: 'simple-text',
        text:
          'Dla Twoich potrzeb świetnym programem do obróbki zdjęć będzie Snapseed.\n' +
          'To w pełni darmowa aplikacja na smartfon.\n\n' +
          'Pobierz ją i zaczynamy.\n\n' +
          'Nie rób więcej niż kroki omówione w workbooku.\n' +
          'Pracujemy nad: światłem, kolorem, ostrością,\n' +
          'usuwaniem pyłków i kadrowaniem.\n' +
          'naszym celem jest piękne, naturalnie wyglądające\n' +
          'zdjęcie kulinarne na białym tle.',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '44',
      pageNumber: 44,
      title: '',
      content: JSON.stringify({
        type: 'formatted-text',
        textFile: '/api/course-content/44/PL',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '45',
      pageNumber: 45,
      title: '',
      content: JSON.stringify({
        type: 'image-overlay-text-file',
        imageUrl: '/course/strona 45/Foto/45.jpg',
        textFile: '/api/course-content/45/PL',
        textPosition: 'top-center',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '46',
      pageNumber: 46,
      title: '',
      content: JSON.stringify({
        type: 'image-overlay-text-file',
        imageUrl: '/course/strona 46/Foto/46.jpg',
        textFile: '/api/course-content/46/PL',
        textPosition: 'top-center',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '47',
      pageNumber: 47,
      title: '',
      content: JSON.stringify({
        type: 'image-overlay-text-file',
        imageUrl: '/course/strona 47/Foto/47.jpg',
        textFile: '/api/course-content/47/PL',
        textPosition: 'top-center',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '48',
      pageNumber: 48,
      title: '',
      content: JSON.stringify({
        type: 'formatted-text',
        textFile: '/api/course-content/48/PL',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '49',
      pageNumber: 49,
      title: '',
      content: JSON.stringify({
        type: 'qr-upload',
      }),
      tips: JSON.stringify(['To Twoje finałowe zdjęcie - pokaż wszystko czego się nauczyłeś!']),
    },
    {
      id: '50',
      pageNumber: 50,
      title: '',
      content: JSON.stringify({
        type: 'progress-evaluation',
      }),
      tips: JSON.stringify([]),
    },
    {
      id: '51',
      pageNumber: 51,
      title: '',
      content: JSON.stringify({
        type: 'dictionary',
        textFile: '/api/course-content/51/PL',
      }),
      tips: JSON.stringify([]),
    },
  ],
}

export const MOCK_GLOSSARY_TERMS = [
  {
    id: '1',
    term: 'RAW',
    definition: 'Format zdjęcia, który zachowuje wszystkie dane z sensora aparatu bez kompresji. Daje więcej możliwości w edycji.',
  },
  {
    id: '2',
    term: 'Tryb Portret',
    definition: 'Funkcja aparatu, która rozmywa tło, aby główny obiekt był bardziej wyeksponowany.',
  },
  {
    id: '3',
    term: 'Kadrowanie',
    definition: 'Proces wyboru i ustawienia elementów w kadrze zdjęcia.',
  },
  {
    id: '4',
    term: 'Proporcje',
    definition: 'Stosunek wymiarów obiektu na zdjęciu. Ważne, aby wyglądały naturalnie.',
  },
]

