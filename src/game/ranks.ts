/** Rango que se otorga al terminar la partida según la puntuación. */
export interface Rank {
  /** Puntuación mínima para alcanzarlo. */
  min: number;
  name: string;
  /** Artículo para armar frases como «Eres una Ameba». */
  article: 'un' | 'una';
  emoji: string;
  /** Comentario que acompaña al rango en la pantalla final. */
  phrase: string;
}

/**
 * Escala de rangos, de menor a mayor, contada como una evolución: de la primera
 * célula a los animales, del troglodita al oficio de escribir, y de ahí al cosmos.
 *
 * Para ajustarla basta con editar esta lista: debe empezar en 0 y tener los
 * mínimos en orden creciente.
 */
export const RANKS: readonly Rank[] = [
  // --- La vida se abre paso ---
  {
    min: 0,
    name: 'Ameba',
    article: 'una',
    emoji: '🦠',
    phrase: 'Una sola célula y ya encontraste el teclado. Por algo se empieza.',
  },
  {
    min: 120,
    name: 'Esponja de mar',
    article: 'una',
    emoji: '🧽',
    phrase: 'Vives pegado al fondo viendo pasar las palabras. Al menos nadie te mueve del puesto.',
  },
  {
    min: 280,
    name: 'Medusa',
    article: 'una',
    emoji: '🎐',
    phrase: 'Flotas entre las letras sin cerebro, pero con mucho estilo.',
  },
  {
    min: 480,
    name: 'Gusano',
    article: 'un',
    emoji: '🐛',
    phrase: 'Acabas de estrenar cerebro. Todavía no sabes muy bien para qué sirve.',
  },
  {
    min: 720,
    name: 'Camarón',
    article: 'un',
    emoji: '🦐',
    phrase: 'Camarón que se duerme, se lo lleva la línea roja.',
  },
  {
    min: 1000,
    name: 'Pez',
    article: 'un',
    emoji: '🐟',
    phrase: 'Ya tienes columna vertebral. Memoria, lo que se dice memoria, tres segundos.',
  },
  {
    min: 1350,
    name: 'Rana',
    article: 'una',
    emoji: '🐸',
    phrase: 'Saliste del agua de un salto. Las palabras siguen cayendo más rápido que tú.',
  },
  {
    min: 1750,
    name: 'Tortuga',
    article: 'una',
    emoji: '🐢',
    phrase: 'Lenta pero segura. Sobre todo lenta.',
  },
  {
    min: 2200,
    name: 'Dinosaurio',
    article: 'un',
    emoji: '🦖',
    phrase: 'Dominas el planeta, aunque con esos bracitos cuesta llegar a la tecla Enter.',
  },
  {
    min: 2700,
    name: 'Gallina',
    article: 'una',
    emoji: '🐔',
    phrase: 'Fuiste un dinosaurio. Ahora picoteas el teclado con dos dedos y bastante dignidad.',
  },
  {
    min: 3200,
    name: 'Ratón',
    article: 'un',
    emoji: '🐭',
    phrase: 'Pequeño, nervioso y veloz. Irónicamente, se te da mejor el teclado que el ratón.',
  },
  {
    min: 3800,
    name: 'Mono con teclado',
    article: 'un',
    emoji: '🐒',
    phrase: 'Dicen que tecleando al azar algún día escribirás el Quijote. Vas por la primera línea.',
  },

  // --- La humanidad aprende a escribir ---
  {
    min: 4500,
    name: 'Troglodita',
    article: 'un',
    emoji: '🦴',
    phrase: 'Golpeas las teclas con un garrote, pero ya aciertas más de las que fallas.',
  },
  {
    min: 5400,
    name: 'Inventor del fuego',
    article: 'un',
    emoji: '🔥',
    phrase: 'Tus dedos empiezan a echar chispas. Literalmente: acabas de inventarlas.',
  },
  {
    min: 6500,
    name: 'Escriba egipcio',
    article: 'un',
    emoji: '📜',
    phrase: 'Tres mil años tallando jeroglíficos y ahora te piden escribir «murciélago».',
  },
  {
    min: 7700,
    name: 'Monje copista',
    article: 'un',
    emoji: '🕯️',
    phrase: 'Copias palabra por palabra sin levantar la vista. Y sin cobrar.',
  },
  {
    min: 9000,
    name: 'Estudiante con sueño',
    article: 'un',
    emoji: '😴',
    phrase: 'Escribes rápido porque la entrega era ayer.',
  },
  {
    min: 10500,
    name: 'Practicante',
    article: 'un',
    emoji: '☕',
    phrase: 'Haces el trabajo de tres, te pagan con experiencia y además traes el café.',
  },
  {
    min: 12500,
    name: 'Oficinista',
    article: 'un',
    emoji: '📎',
    phrase: 'Escribes como quien responde correos un lunes a las ocho de la mañana.',
  },
  {
    min: 14500,
    name: 'Mecanógrafo',
    article: 'un',
    emoji: '⌨️',
    phrase: 'Diez dedos, cero miradas al teclado. Tu abuela estaría orgullosa.',
  },
  {
    min: 17000,
    name: 'Periodista',
    article: 'un',
    emoji: '📰',
    phrase: 'Cierras la edición en cinco minutos y todavía te sobra uno para el titular.',
  },

  // --- La mente se dispara ---
  {
    min: 20000,
    name: 'Erudito',
    article: 'un',
    emoji: '📚',
    phrase: 'Terminas de leer las palabras antes de que acaben de aparecer.',
  },
  {
    min: 23500,
    name: 'Sabio',
    article: 'un',
    emoji: '🦉',
    phrase: 'Las palabras ya no caen: bajan a pedirte consejo.',
  },
  {
    min: 27500,
    name: 'Matemático',
    article: 'un',
    emoji: '🧮',
    phrase: 'Calculas la trayectoria de cada letra con tres decimales.',
  },
  {
    min: 32000,
    name: 'Científico loco',
    article: 'un',
    emoji: '🧪',
    phrase: 'Nadie entiende tu método, pero los resultados dan miedo.',
  },
  {
    min: 37000,
    name: 'Genio',
    article: 'un',
    emoji: '💡',
    phrase: 'Se te ocurren las palabras medio segundo antes de que existan.',
  },
  {
    min: 43000,
    name: 'Hacker',
    article: 'un',
    emoji: '💻',
    phrase: 'Ya no escribes las palabras: entras al sistema y las borras desde adentro.',
  },
  {
    min: 50000,
    name: 'Inteligencia artificial',
    article: 'una',
    emoji: '🤖',
    phrase: 'Tus dedos ya no necesitan supervisión humana.',
  },

  // --- Más allá del planeta ---
  {
    min: 58000,
    name: 'Astronauta',
    article: 'un',
    emoji: '🚀',
    phrase: 'Escribes con guantes, sin gravedad, y aun así no fallas una.',
  },
  {
    min: 67000,
    name: 'Marciano',
    article: 'un',
    emoji: '👽',
    phrase: 'En tu planeta esto se aprende antes que caminar.',
  },
  {
    min: 77000,
    name: 'Cometa',
    article: 'un',
    emoji: '☄️',
    phrase: 'Pasas una vez cada setenta años y dejas a todos mirando al cielo.',
  },
  {
    min: 88000,
    name: 'Supernova',
    article: 'una',
    emoji: '🌟',
    phrase: 'Brillas más que toda tu galaxia. Dura poco, pero qué espectáculo.',
  },
  {
    min: 100000,
    name: 'Agujero negro',
    article: 'un',
    emoji: '🕳️',
    phrase: 'Ninguna palabra escapa de ti. Ni la luz. Ni la tecla Enter.',
  },
  {
    min: 115000,
    name: 'Galaxia',
    article: 'una',
    emoji: '🌌',
    phrase: 'Cien mil millones de estrellas, y todas escriben a tu ritmo.',
  },
  {
    min: 135000,
    name: 'Big Bang',
    article: 'un',
    emoji: '💥',
    phrase: 'Antes de ti no había palabras. Las escribiste todas tú.',
  },
];

/** Rango que corresponde a una puntuación. */
export function rankForScore(score: number): Rank {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (score >= rank.min) current = rank;
  }
  return current;
}

export interface RankProgress {
  rank: Rank;
  /** Siguiente rango, o null si ya se alcanzó el más alto. */
  next: Rank | null;
  /** Puntos que faltan para el siguiente rango (0 en el más alto). */
  pointsToNext: number;
  /** Avance dentro del rango actual hacia el siguiente, de 0 a 1. */
  progress: number;
}

/** Rango actual y cuánto falta para el siguiente. */
export function rankProgress(score: number): RankProgress {
  const rank = rankForScore(score);
  const next = RANKS[RANKS.indexOf(rank) + 1] ?? null;
  if (!next) return { rank, next: null, pointsToNext: 0, progress: 1 };
  return {
    rank,
    next,
    pointsToNext: next.min - score,
    progress: Math.min(1, Math.max(0, (score - rank.min) / (next.min - rank.min))),
  };
}
