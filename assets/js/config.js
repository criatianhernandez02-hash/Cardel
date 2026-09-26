/*
 * Cardel Designs — everything the owner might want to change lives here.
 * After editing, commit and push; the site updates in about a minute.
 *
 * ⚠ BEFORE LAUNCH: confirm phone, hours and prices with Paty (see README).
 */
window.CARDEL = {
  name: 'Cardel Designs Hair Salon',
  owner: 'Paty',

  // TODO: replace with the salon's real number (this is a placeholder).
  phone: '(530) 555-0123',

  address: {
    street: '1810 E Main St, Suite 105',
    city: 'Woodland',
    region: 'CA',
    zip: '95776'
  },
  geo: { lat: 38.6786, lng: -121.7497 },

  rating: { value: 4.6, count: 22 },

  links: {
    instagram: 'https://www.instagram.com/cardel_designs_hairsalon/',
    facebook: 'https://www.facebook.com/Cardelgirls/',
    // Paste the salon's Google reviews link here (Google Business Profile → "Ask for reviews").
    googleReviews: 'https://www.google.com/search?q=Cardel+Designs+Hair+Salon+Woodland+CA',
    directions: 'https://www.google.com/maps/dir/?api=1&destination=Cardel+Designs+Hair+Salon%2C+1810+E+Main+St+Suite+105%2C+Woodland%2C+CA+95776',
    mapEmbed: 'https://www.google.com/maps?q=Cardel+Designs+Hair+Salon,+1810+E+Main+St+Suite+105,+Woodland,+CA+95776&output=embed'
  },

  // Displayed hours. 0 = Sunday … 6 = Saturday, 24h clock, null = closed.
  // Keep in sync with HOURS in apps-script/Code.gs (that one controls booking).
  hours: {
    0: null,
    1: null,
    2: ['10:00', '18:00'],
    3: ['11:00', '19:00'],
    4: ['10:00', '18:00'],
    5: ['10:00', '19:00'],
    6: ['09:00', '16:00']
  },

  // The Google Apps Script web-app URL from SETUP.md. Empty = demo mode
  // (the booking calendar works but shows sample times and books nothing).
  bookingEndpoint: '',

  // Services. ids MUST match SERVICES in apps-script/Code.gs.
  // price = "from" price in dollars. TODO: confirm every price with Paty.
  serviceGroups: [
    {
      id: 'cuts', en: 'Cuts', es: 'Cortes',
      services: [
        { id: 'womens-cut', minutes: 60, price: 45,
          en: ["Women's Haircut & Style", 'Consultation, shampoo, precision cut and finish.'],
          es: ['Corte y peinado de dama', 'Consulta, lavado, corte a detalle y peinado.'] },
        { id: 'mens-cut', minutes: 30, price: 25,
          en: ["Men's Haircut", 'Clean, tailored cut with a sharp finish.'],
          es: ['Corte de caballero', 'Corte limpio y a tu medida.'] },
        { id: 'kids-cut', minutes: 30, price: 20,
          en: ['Kids Haircut (12 & under)', 'Patient, friendly cuts for little ones.'],
          es: ['Corte de niños (12 y menores)', 'Cortes con paciencia para los pequeños.'] }
      ]
    },
    {
      id: 'color', en: 'Color', es: 'Color',
      services: [
        { id: 'root-touchup', minutes: 90, price: 65,
          en: ['Root Touch-Up', 'Refresh regrowth and cover grays.'],
          es: ['Retoque de raíz', 'Cubre canas y crecimiento.'] },
        { id: 'all-over-color', minutes: 120, price: 85,
          en: ['All-Over Color', 'Rich, even color from root to ends.'],
          es: ['Tinte completo', 'Color uniforme de raíz a puntas.'] },
        { id: 'highlights', minutes: 150, price: 110,
          en: ['Highlights', 'Partial or full foils for brightness and dimension.'],
          es: ['Rayitos / Luces', 'Parciales o completos para dar luz y dimensión.'] },
        { id: 'balayage', minutes: 180, price: 150,
          en: ['Balayage / Ombré', 'Hand-painted, soft, grown-out-friendly color.'],
          es: ['Balayage / Ombré', 'Color pintado a mano, natural y de bajo mantenimiento.'] }
      ]
    },
    {
      id: 'occasions', en: 'Styling & Occasions', es: 'Peinados y eventos',
      services: [
        { id: 'blowout', minutes: 45, price: 35,
          en: ['Wash & Blowout', 'Smooth, bouncy, camera-ready hair.'],
          es: ['Lavado y secado (blowout)', 'Cabello liso, con volumen y listo.'] },
        { id: 'updo', minutes: 75, price: 65,
          en: ['Special Occasion Updo', 'Weddings, proms, parties, photos.'],
          es: ['Peinado para evento', 'Bodas, graduaciones, fiestas y fotos.'] },
        { id: 'quince-bridal', minutes: 120, price: 120,
          en: ['Quinceañera / Bridal Hair', 'Trial and day-of styling for your big day. Accessories available.'],
          es: ['Peinado de quinceañera / novia', 'Prueba y peinado para tu gran día. Accesorios disponibles.'] }
      ]
    },
    {
      id: 'care', en: 'Care', es: 'Cuidado',
      services: [
        { id: 'treatment', minutes: 45, price: 35,
          en: ['Deep Conditioning Treatment', 'Repair and shine for dry or color-treated hair.'],
          es: ['Tratamiento de hidratación profunda', 'Repara y da brillo al cabello seco o teñido.'] },
        { id: 'consultation', minutes: 15, price: 0,
          en: ['Free Consultation', 'Not sure what you need? Let’s talk it through first.'],
          es: ['Consulta gratis', '¿No sabes qué necesitas? Platiquemos primero.'] }
      ]
    }
  ],

  // Real client reviews only. Add more from Google/Yelp as { text, name, source }.
  reviews: [
    {
      en: 'Patricia takes the time to listen, gives helpful feedback, never makes you feel rushed, and goes slowly and methodically to make sure you get exactly what you want.',
      es: 'Patricia se toma el tiempo de escuchar, da buenos consejos, nunca te apresura y trabaja con calma y detalle para que quedes exactamente como quieres.',
      name: 'Client review',
      source: 'Yelp'
    }
  ],

  // Photos of Paty's work: put files in assets/img/gallery/ and list them here,
  // e.g. { src: 'assets/img/gallery/balayage-1.webp', en: 'Soft balayage', es: 'Balayage suave' }.
  // While this is empty the gallery shows a link to Instagram instead.
  gallery: [],

  // Optional hero photo, e.g. 'assets/img/hero.webp'. Empty = typographic hero.
  heroImage: ''
};
