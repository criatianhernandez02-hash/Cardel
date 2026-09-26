/*
 * English lives in index.html (good for Google). This file holds the Spanish
 * for every [data-i18n] element plus the strings built by JavaScript.
 */
(function () {
  var ES = {
    'skip': 'Saltar al contenido',
    'nav.services': 'Servicios',
    'nav.about': 'Paty',
    'nav.reviews': 'Reseñas',
    'nav.visit': 'Ubicación',
    'cta.call': 'Llamar',
    'cta.book': 'Reservar',
    'cta.bookOnline': 'Reservar en línea',
    'cta.bookWithPaty': 'Reserva con Paty',
    'cta.seeWork': 'Mira mi trabajo en Instagram →',
    'cta.directions': 'Cómo llegar',
    'cta.map': 'Mapa',
    'hero.eyebrow': 'Salón de belleza · Woodland, CA',
    'hero.title': 'Un look diseñado para <em>ti</em>.',
    'hero.lede': 'Cortes, color y peinados para ocasiones especiales con Paty — quien te escucha primero, nunca te apresura y no para hasta que quede exactamente como lo imaginaste.',
    'hero.quick': 'Reserva en menos de un minuto',
    'hero.quickSub': 'Horarios en tiempo real, 24/7',
    'hero.card': 'Cortes · Color · Balayage · Quinceañeras · Novias',
    'p1.t': 'Primero, una consulta',
    'p1.d': 'Cada visita empieza platicando sobre lo que quieres.',
    'p2.t': 'Sin prisas',
    'p2.d': 'Una estilista, tu cita, toda la atención.',
    'p3.t': 'Color que dura',
    'p3.d': 'De cubrir canas a balayage, hecho con cuidado.',
    'p4.t': 'Lista para tu gran día',
    'p4.d': 'Peinados de quinceañera, novia y eventos — y accesorios.',
    'svc.eyebrow': 'Servicios y precios',
    'svc.title': 'Menú',
    'svc.note': 'Los precios son “desde”; el precio final depende del largo, el grosor y el producto. Toca cualquier servicio para reservarlo.',
    'about.eyebrow': 'Conoce a tu estilista',
    'about.title': 'Hola, soy Paty.',
    'about.p1': 'Cardel Designs es mi salón en la calle East Main en Woodland. Lo mantengo pequeño a propósito: cuando te sientas en mi silla, tienes toda mi atención desde la primera pregunta hasta el último vistazo al espejo.',
    'about.p2': 'Me mantengo al día con nuevas técnicas y tendencias, pero todo empieza contigo: tu cabello, tu rutina y el look que tienes en mente. Ya sea un despunte, un cambio de color o la quinceañera de tu hija, me tomo el tiempo para que quede perfecto.',
    'gal.eyebrow': 'Trabajo reciente',
    'gal.title': 'Resultados',
    'rev.eyebrow': 'Lo que dicen las clientas',
    'rev.from': 'de',
    'rev.reviews': 'reseñas',
    'rev.read': 'Ver reseñas en Google',
    'book.eyebrow': 'Reservas en línea · 24/7',
    'book.title': 'Haz tu cita',
    'book.sub': 'Elige un servicio y un horario — se agenda directo en el calendario de Paty. ¿Prefieres hablar? <a class="call-link" href="tel:" data-track="call_booking">Llama al salón</a>.',
    'book.demo': 'Modo de vista previa: los horarios son de ejemplo y todavía no se reserva nada.',
    'book.s1': 'Servicio',
    'book.s2': 'Fecha y hora',
    'book.s3': 'Tus datos',
    'book.pick': '¿Qué servicio necesitas?',
    'book.next': 'Ver horarios disponibles',
    'book.back': '← Cambiar servicio',
    'book.backTime': '← Elegir otro horario',
    'f.name': 'Nombre completo',
    'f.phone': 'Celular',
    'f.email': 'Correo electrónico',
    'f.optional': '(opcional — te enviamos una invitación de calendario)',
    'f.notes': '¿Algo que Paty deba saber?',
    'f.optional2': '(opcional)',
    'f.notesPh': 'Largo del cabello, color actual, fotos de inspiración que traerás…',
    'f.policy': '¿Necesitas cancelar o cambiar tu cita? Llama con al menos 24 horas de anticipación para que otra persona pueda tomar el lugar.',
    'f.confirm': 'Confirmar cita',
    'done.title': '¡Tu cita está confirmada!',
    'done.addCal': 'Agregar a mi calendario',
    'done.directions': 'Cómo llegar',
    'done.change': '¿Necesitas cambiarla? Llama al',
    'visit.eyebrow': 'Visítanos',
    'visit.title': 'Estamos en East Main',
    'visit.hours': 'Horario',
    'faq.eyebrow': 'Bueno saber',
    'faq.title': 'Preguntas',
    'faq.q1': '¿Aceptan clientes sin cita?',
    'faq.a1': 'Si hay espacio, sí — pero reservar en línea o llamar antes te asegura tu lugar.',
    'faq.q2': '¿Hablan español?',
    'faq.a2': '¡Sí! Paty habla inglés y español. Estás viendo el sitio en español; usa el botón EN para cambiar a inglés.',
    'faq.q3': '¿Cuánto dura una cita de color?',
    'faq.a3': 'El menú muestra los tiempos típicos. Los cambios grandes de color pueden tardar más — reserva una consulta gratis si no estás segura.',
    'faq.q4': '¿Hacen peinados para quinceañeras y bodas?',
    'faq.a4': 'Sí. Reserva una prueba y la cita del día del evento, o llama para planear el peinado de todo el grupo. Hay accesorios para el cabello en el salón.',
    'faq.q5': '¿Y si necesito cancelar?',
    'faq.a5': 'Llama con al menos 24 horas de anticipación para que otra clienta pueda tomar el horario.',
    'footer.reviews': 'Reseñas en Google'
  };

  // Strings used from JavaScript.
  var JS = {
    en: {
      openNow: 'Open now · until {t}', closedNow: 'Closed now', opensAt: 'Opens {d} at {t}',
      today: 'Today', tomorrow: 'Tomorrow', closed: 'Closed',
      reviews: '{n} reviews', free: 'Free', from: 'from ${p}', minutes: '{m} min',
      hrs: '{h} hr', hrsMin: '{h} hr {m} min', bookThis: 'Book',
      morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening',
      loading: 'Checking Paty’s calendar…', noSlots: 'No openings this day. Try another date — or call, a spot may open up.',
      pickDay: 'Pick a day to see open times.',
      loadError: 'Couldn’t load times right now. Please try again or call the salon.',
      booking: 'Booking…', invited: 'A calendar invite is on its way to {e}.',
      notInvited: 'Save it to your calendar so you don’t forget.',
      err_missing_name: 'Please enter your name.', err_bad_phone: 'Please enter a 10-digit phone number.',
      err_bad_email: 'That email doesn’t look right.', err_slot_taken: 'Sorry — that time was just taken. Please pick another.',
      err_too_many: 'Too many bookings from this number. Please call the salon.',
      err_generic: 'Something went wrong. Please try again or call the salon.',
      galleryEmpty: 'See Paty’s latest cuts, color and event styles on Instagram.', galleryBtn: 'Open Instagram', galleryMore: 'See more on Instagram →',
      change: 'Change', langBtn: 'ES', langLabel: 'Cambiar a español'
    },
    es: {
      openNow: 'Abierto · hasta las {t}', closedNow: 'Cerrado ahora', opensAt: 'Abre el {d} a las {t}',
      today: 'Hoy', tomorrow: 'Mañana', closed: 'Cerrado',
      reviews: '{n} reseñas', free: 'Gratis', from: 'desde ${p}', minutes: '{m} min',
      hrs: '{h} h', hrsMin: '{h} h {m} min', bookThis: 'Reservar',
      morning: 'Mañana', afternoon: 'Tarde', evening: 'Noche',
      loading: 'Revisando el calendario de Paty…', noSlots: 'No hay espacios este día. Prueba otra fecha — o llama, puede abrirse un lugar.',
      pickDay: 'Elige un día para ver los horarios.',
      loadError: 'No se pudieron cargar los horarios. Intenta de nuevo o llama al salón.',
      booking: 'Reservando…', invited: 'Te enviamos una invitación de calendario a {e}.',
      notInvited: 'Guárdala en tu calendario para no olvidarla.',
      err_missing_name: 'Escribe tu nombre.', err_bad_phone: 'Escribe un número de 10 dígitos.',
      err_bad_email: 'Ese correo no parece correcto.', err_slot_taken: 'Lo sentimos — alguien acaba de tomar ese horario. Elige otro.',
      err_too_many: 'Demasiadas reservas con este número. Por favor llama al salón.',
      err_generic: 'Algo salió mal. Intenta de nuevo o llama al salón.',
      galleryEmpty: 'Mira los cortes, colores y peinados más recientes de Paty en Instagram.', galleryBtn: 'Abrir Instagram', galleryMore: 'Ver más en Instagram →',
      change: 'Cambiar', langBtn: 'EN', langLabel: 'Switch to English'
    }
  };

  var EN = {};
  var lang = 'en';
  var listeners = [];

  function capture() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      EN[el.getAttribute('data-i18n')] = el.innerHTML;
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      EN[el.getAttribute('data-i18n-ph')] = el.getAttribute('placeholder');
    });
  }

  function apply(next) {
    lang = next === 'es' ? 'es' : 'en';
    var dict = lang === 'es' ? ES : EN;
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = dict[el.getAttribute('data-i18n')];
      if (v != null) el.innerHTML = v;
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var v = dict[el.getAttribute('data-i18n-ph')];
      if (v != null) el.setAttribute('placeholder', v);
    });
    try { localStorage.setItem('cardel-lang', lang); } catch (e) {}
    listeners.forEach(function (fn) { fn(lang); });
  }

  function initial() {
    var q = new URLSearchParams(location.search).get('lang');
    if (q === 'es' || q === 'en') return q;
    try { var s = localStorage.getItem('cardel-lang'); if (s) return s; } catch (e) {}
    return (navigator.language || '').toLowerCase().indexOf('es') === 0 ? 'es' : 'en';
  }

  window.I18N = {
    get lang() { return lang; },
    t: function (key, vars) {
      var s = (JS[lang] && JS[lang][key]) || JS.en[key] || key;
      return s.replace(/\{(\w+)\}/g, function (_, k) { return vars && vars[k] != null ? vars[k] : ''; });
    },
    set: apply,
    onChange: function (fn) { listeners.push(fn); },
    start: function () { capture(); apply(initial()); }
  };
})();
