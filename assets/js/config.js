/*
 * Cardel Designs — everything the owner might want to change lives here.
 * After editing, commit and push; the site updates in about a minute.
 *
 * ⚠ BEFORE LAUNCH: confirm phone, hours and prices with Paty (see README).
 */
window.CARDEL = {
  name: 'Cardel Designs Hair Salon',
  owner: 'Paty',

  phone: '(530) 867-0883',

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
    2: null,
    3: ['11:00', '19:00'],
    4: ['10:00', '18:00'],
    5: ['10:00', '19:00'],
    6: ['09:00', '16:00']
  },

  // The Google Apps Script web-app URL from SETUP.md. Empty = demo mode
  // (the booking calendar works but shows sample times and books nothing).
  bookingEndpoint: 'https://script.google.com/macros/s/AKfycbw7_fY7GXC4NlSPfp6rItCy9Y49vB_LPXRUU3_fv49ra1SiibMR7t4RNzx1ERKkDKyy/exec',

  // Add-ons clients can tick when booking (price in dollars, minutes added to the booking).
  addons: {
    haircut: { price: 45, minutes: 45,
      en: 'Add a haircut and style', es: 'Agregar corte y peinado', short: { en: 'Haircut', es: 'Corte' } },
    olaplex: { price: 30, minutes: 15,
      en: 'Add Olaplex bond protection', es: 'Agregar protección Olaplex', short: { en: 'Olaplex', es: 'Olaplex' } }
  },

  // Services. price in dollars; from: true shows "from $X", false shows the exact price.
  // addons = which add-ons a group's services can take.
  serviceGroups: [
    {
      id: 'color', en: "Color", es: "Color", addons: ['haircut', 'olaplex'],
      services: [
        { id: 'double-process', minutes: 180, price: 250, from: true,
          en: ["Double Process / Fashion Color", "Lift and tone for bold, vivid or fashion shades."],
          es: ["Doble proceso / Color fantasía", "Decoloración y tono para colores intensos o de fantasía."] },
        { id: 'color-correction', minutes: 240, price: 250, from: true,
          en: ["Color Correction", "Fixes uneven, brassy or box-dye color. Final price after consultation."],
          es: ["Corrección de color", "Corrige color disparejo, anaranjado o de caja. Precio final después de la consulta."] },
        { id: 'color-touchup', minutes: 60, price: 60, from: true,
          en: ["Color Touch-Up", "Express root refresh, no blow-dry. With haircut and style: from $125."],
          es: ["Retoque de color", "Retoque exprés de raíz, sin secado. Con corte y peinado: desde $125."] },
        { id: 'toner', minutes: 30, price: 65, from: true,
          en: ["Toner", "Refresh or neutralize your tone. No blow-dry."],
          es: ["Matizador (toner)", "Refresca o neutraliza el tono. Sin secado."] }
      ]
    },
    {
      id: 'highlights', en: "Highlights & Balayage", es: "Luces y balayage", addons: ['haircut', 'olaplex'],
      services: [
        { id: 'balayage', minutes: 180, price: 245, from: true,
          en: ["Balayage", "Hand-painted, soft, low-maintenance color. Long hair: $300."],
          es: ["Balayage", "Color pintado a mano, natural y de bajo mantenimiento. Cabello largo: $300."] },
        { id: 'babylights', minutes: 180, price: 220, from: true,
          en: ["Babylights", "Ultra-fine highlights for a natural glow."],
          es: ["Babylights", "Luces muy finas para un brillo natural."] },
        { id: 'full-highlights', minutes: 150, price: 195, from: true,
          en: ["Full Highlights", "Brightness and dimension all over."],
          es: ["Luces completas", "Luz y dimensión en todo el cabello."] },
        { id: 'partial-highlights', minutes: 120, price: 140, from: true,
          en: ["Partial Highlights", "Around the face and the top layer."],
          es: ["Luces parciales", "Alrededor del rostro y la capa de arriba."] }
      ]
    },
    {
      id: 'perms', en: "Perms", es: "Permanentes", addons: ['haircut'],
      services: [
        { id: 'perm-short', minutes: 120, price: 165, from: true,
          en: ["Perm, Short to Medium Hair", "Lasting curl or wave."],
          es: ["Permanente, cabello corto a mediano", "Rizo u onda duradera."] },
        { id: 'perm-long', minutes: 150, price: 180, from: true,
          en: ["Perm, Long Hair", "Lasting curl or wave for long hair."],
          es: ["Permanente, cabello largo", "Rizo u onda duradera para cabello largo."] }
      ]
    },
    {
      id: 'cuts', en: "Cuts", es: "Cortes", addons: [],
      services: [
        { id: 'curly-cut', minutes: 75, price: 85, from: true,
          en: ["Curly Specialist Haircut", "Cut curl by curl for shape and definition."],
          es: ["Corte especial para rizos", "Corte rizo por rizo para forma y definición."] },
        { id: 'teen-cut', minutes: 45, price: 45, from: false,
          en: ["Teen Haircut (13–17)", "Cut and style for ages 13 to 17."],
          es: ["Corte juvenil (13–17)", "Corte y peinado de 13 a 17 años."] },
        { id: 'kids-cut', minutes: 30, price: 35, from: false,
          en: ["Kids Haircut (12 & under)", "Patient, friendly cuts for little ones."],
          es: ["Corte de niños (12 y menores)", "Cortes con paciencia para los pequeños."] },
        { id: 'bang-trim', minutes: 15, price: 15, from: false,
          en: ["Bang Trim", "A quick fringe clean-up."],
          es: ["Corte de fleco", "Arreglo rápido de fleco."] }
      ]
    },
    {
      id: 'treatments', en: "Treatments & Smoothing", es: "Tratamientos y alaciado", addons: ['haircut'],
      services: [
        { id: 'keratin', minutes: 180, price: 250, from: false,
          en: ["Keratin Treatment", "Smooth, frizz-free hair for weeks."],
          es: ["Tratamiento de keratina", "Cabello liso y sin frizz por semanas."] },
        { id: 'brazilian-express', minutes: 90, price: 145, from: true,
          en: ["Brazilian Blowout Express", "A faster smoothing treatment that cuts frizz."],
          es: ["Brazilian Blowout exprés", "Alaciado rápido que reduce el frizz."] },
        { id: 'olaplex-repair', minutes: 30, price: 75, from: true,
          en: ["Olaplex Repair Treatment", "Rebuilds damaged or lightened hair. No blow-dry; with blow-dry $85."],
          es: ["Tratamiento reparador Olaplex", "Reconstruye el cabello dañado o decolorado. Sin secado; con secado $85."] },
        { id: 'deep-conditioning', minutes: 45, price: 50, from: true,
          en: ["Deep Conditioning Treatment", "Moisture and shine for dry or color-treated hair."],
          es: ["Tratamiento de hidratación profunda", "Hidratación y brillo para cabello seco o teñido."] }
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
  gallery: [
    { src: 'assets/img/gallery/balayage-waves.webp', en: 'Balayage with soft waves', es: 'Balayage con ondas suaves' },
    { src: 'assets/img/gallery/blonde-waves.webp', en: 'Dimensional blonde, blown-out waves', es: 'Rubio con dimensión y ondas' },
    { src: 'assets/img/gallery/highlights-copper.webp', en: 'Copper highlights, sleek finish', es: 'Luces cobrizas, acabado liso' },
    { src: 'assets/img/gallery/blonde-curls.webp', en: 'Soft blonde curls', es: 'Rizos rubios suaves' }
  ],

  // Photo of Paty for the "Meet your stylist" circle. Empty = red "P" monogram.
  portrait: 'assets/img/paty.webp',

  // Optional hero photo, e.g. 'assets/img/hero.webp'. Empty = typographic hero.
  heroImage: 'assets/img/gallery/balayage-waves.webp'
};
