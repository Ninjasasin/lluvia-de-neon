# Lluvia de Neón

Juego arcade de mecanografía para navegador. Las palabras caen sobre una ciudad nocturna: escríbelas completas y pulsa **Enter** antes de que toquen la línea roja. Incluye dificultad progresiva, rachas con multiplicador, cuatro poderes, sonido sintetizado y récords guardados en el navegador.

**Jugar en línea:** https://ninjasasin.github.io/lluvia-de-neon/

Creado por **Ninjasasin**. Todo el arte, el sonido y el código del juego son propios. El nombre se cambia en un solo lugar: `src/config.ts`.

## Instalar y ejecutar

Requiere [Node.js](https://nodejs.org) 22.12 o superior.

```bash
npm install
npm run dev
```

Abre la dirección que muestra la terminal (por defecto `http://localhost:5173`).

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga automática |
| `npm test` | Ejecuta las pruebas automatizadas |
| `npm run build` | Comprueba los tipos y genera la versión final en `dist/` |
| `npm run preview` | Sirve la versión generada en `dist/` |

El juego no usa servicios externos: no hay backend, fuentes remotas ni archivos de audio. Una vez instalado funciona sin conexión.

## Publicación en la web

El juego está publicado con GitHub Pages. Cada vez que se sube un cambio a la rama `main`, GitHub ejecuta las pruebas, compila el proyecto y actualiza la página por sí solo (el proceso está en `.github/workflows/pages.yml` y tarda cerca de un minuto).

Para publicar un cambio:

```bash
git add -A
git commit -m "Describe el cambio"
git push
```

Los récords y la configuración se guardan en el navegador de cada equipo: no se comparten entre computadores.

## Cómo se juega

- Escribe la palabra completa y pulsa **Enter**. Las tildes, la diéresis y la «ñ» cuentan; las mayúsculas no.
- Un intento equivocado no elimina nada y rompe la racha.
- Cada palabra que toca la línea roja cuesta una de las tres vidas.
- **Esc** pausa y reanuda. La partida también se pausa sola si cambias de pestaña o la ventana pierde el foco.

### Etapas

Cada nivel es una etapa cerrada, con un descanso antes de la siguiente:

1. Durante 50 segundos aparecen palabras. Cumplido ese tiempo, la barra superior avisa «Últimas palabras» y ya no cae ninguna nueva.
2. La etapa termina cuando la pantalla queda despejada, porque escribiste las palabras que quedaban o porque llegaron al fondo.
3. Aparece el **resumen del nivel**: palabras eliminadas, precisión, mejor racha, palabras por minuto, puntos y bonificación. Se queda en pantalla hasta que pulses **Enter** (o el botón «Siguiente nivel»).
4. Corre una **cuenta regresiva de 5 a 0** que anuncia el nivel y la longitud de sus palabras, y la partida continúa con la pantalla limpia.

Durante el resumen y la cuenta regresiva no corre el tiempo de juego ni los temporizadores de los poderes, y se conservan puntos, vidas, racha e inventario.

### Fondos

En **Configuración → Fondo** se elige el escenario del juego y de los menús. Hay seis, todos dibujados por código y animados:

| Fondo | Qué muestra |
|---|---|
| Ciudad nocturna | Luna, nubes y edificios iluminados |
| Espacio alienígena | Planeta con anillos, base alienígena y platillos que cruzan el cielo |
| Prehistoria | Volcán activo, dinosaurios, pterodáctilos y luciérnagas |
| Fondo del mar | Rayos de luz, ruinas hundidas, corales, peces, medusas y burbujas |
| Japón samurái | Sol rojo tras el monte nevado, pagoda, torii, samurái y pétalos de cerezo |
| Aurora polar | Cortinas de luz sobre montañas nevadas, abetos y una cabaña |

Con la intensidad de animaciones en «Reducida» o «Mínima» el fondo queda quieto.

### Poderes

Algunas palabras llegan con borde de color e icono. Al escribirlas guardas su poder (máximo tres de cada uno) y lo activas con su tecla.

| Tecla | Poder | Efecto |
|---|---|---|
| 1 | Congelar | Detiene todas las palabras 6 s, incluidas las que aparezcan mientras dura |
| 2 | Ralentizar | Reduce la velocidad un 65 % durante 10 s y la recupera gradualmente |
| 3 | Relámpago | Elimina las 3 palabras normales más cercanas al fondo (50 % de los puntos) |
| 4 | Bomba | Elimina todas las palabras normales (25 % de los puntos) |

Reactivar Congelar o Ralentizar reinicia su duración; no se acumulan. Relámpago y Bomba no se gastan si no hay palabras que eliminar.

### Puntuación

`Puntos = (10 × letras + bonus de velocidad) × multiplicador`

- **Bonus de velocidad:** hasta 5 puntos por letra; decae hasta cero cuando la palabra lleva `3 + 0,8 × letras` segundos en pantalla.
- **Multiplicador por racha:** 5 aciertos x1,2 · 10 x1,5 · 20 x2 · 30 o más x3.
- **Bonificación de nivel:** 100 × el nivel superado, al cerrar la etapa.

### Rangos

Al terminar la partida, la puntuación decide qué eres. La escala tiene 35 rangos y sigue una evolución: de la primera célula a los animales, del troglodita al oficio de escribir, y de ahí al cosmos. La pantalla final muestra el rango con una frase y cuánto falta para el siguiente; la escala completa está en «Mejores puntuaciones».

| # | Rango | Desde |
|---|---|---|
| 1 | 🦠 Ameba | 0 |
| 2 | 🧽 Esponja de mar | 120 |
| 3 | 🎐 Medusa | 280 |
| 4 | 🐛 Gusano | 480 |
| 5 | 🦐 Camarón | 720 |
| 6 | 🐟 Pez | 1.000 |
| 7 | 🐸 Rana | 1.350 |
| 8 | 🐢 Tortuga | 1.750 |
| 9 | 🦖 Dinosaurio | 2.200 |
| 10 | 🐔 Gallina | 2.700 |
| 11 | 🐭 Ratón | 3.200 |
| 12 | 🐒 Mono con teclado | 3.800 |
| 13 | 🦴 Troglodita | 4.500 |
| 14 | 🔥 Inventor del fuego | 5.400 |
| 15 | 📜 Escriba egipcio | 6.500 |
| 16 | 🕯️ Monje copista | 7.700 |
| 17 | 😴 Estudiante con sueño | 9.000 |
| 18 | ☕ Practicante | 10.500 |
| 19 | 📎 Oficinista | 12.500 |
| 20 | ⌨️ Mecanógrafo | 14.500 |
| 21 | 📰 Periodista | 17.000 |
| 22 | 📚 Erudito | 20.000 |
| 23 | 🦉 Sabio | 23.500 |
| 24 | 🧮 Matemático | 27.500 |
| 25 | 🧪 Científico loco | 32.000 |
| 26 | 💡 Genio | 37.000 |
| 27 | 💻 Hacker | 43.000 |
| 28 | 🤖 Inteligencia artificial | 50.000 |
| 29 | 🚀 Astronauta | 58.000 |
| 30 | 👽 Marciano | 67.000 |
| 31 | ☄️ Cometa | 77.000 |
| 32 | 🌟 Supernova | 88.000 |
| 33 | 🕳️ Agujero negro | 100.000 |
| 34 | 🌌 Galaxia | 115.000 |
| 35 | 💥 Big Bang | 135.000 |

Los nombres, las frases y los puntos mínimos se editan en `src/game/ranks.ts`.

### Récords con nombre

El juego guarda las 10 mejores partidas. Cuando una partida entra en la tabla, la pantalla final pide el nombre de quien la jugó (hasta 10 caracteres, en mayúsculas, como en las máquinas de arcade) y lo recuerda para la próxima vez. Si no se escribe nada, queda como «ANÓNIMO».

La tabla vive en el navegador de cada computador: cada persona lleva su propio ranking y no se comparte entre equipos.

### Dificultad

| Nivel | Caída completa | Aparición | Letras | Simultáneas |
|---|---|---|---|---|
| 1 | 16 s | cada 3,0 s | 3–5 | 5 |
| 2 | 14 s | cada 2,7 s | 4–6 | 6 |
| 3 | 12 s | cada 2,4 s | 5–7 | 7 |
| 4 | 10,5 s | cada 2,1 s | 6–9 | 8 |
| 5 | 9 s | cada 1,8 s | 7–11 | 9 |

A partir del nivel 6 la caída se acelera un 5 % por nivel y la aparición 0,1 s, con topes de 5,5 s de caída, 1 s entre apariciones, 12 palabras simultáneas y 14 letras. La dificultad inicial (fácil, normal o difícil) ajusta la velocidad y el ritmo de aparición.

## Decisiones de diseño

Puntos que la especificación dejaba abiertos y cómo quedaron resueltos:

- **Las palabras de poder no cuestan vidas** si llegan al fondo: son un premio, no una amenaza.
- **Relámpago solo apunta a palabras normales**, igual que la Bomba, para no destruir un poder que aún puedes escribir.
- **Perder una vida también rompe la racha**, además de los errores de escritura.
- **Palabras por minuto** usa la convención estándar: cinco caracteres correctos equivalen a una palabra.
- **La precisión** es el porcentaje de intentos con Enter que acertaron una palabra.
- El quinto acierto consecutivo ya puntúa con x1,2 (la racha se cuenta incluyendo el acierto actual).
- **El resumen del nivel espera al jugador** en lugar de avanzar solo, para que el descanso dure lo que haga falta. Para evitar saltárselo por accidente, ignora Enter durante el primer instante.
- **La etapa termina al despejar la pantalla**, no de golpe al cumplirse el tiempo: así no se regalan ni se pierden palabras a medias.

## Arquitectura

La lógica del juego no conoce el Canvas, el DOM ni el audio, y por eso se prueba sin navegador.

```
src/
├─ config.ts              Nombre del juego, autor y prefijo de almacenamiento
├─ assets/                Logo del autor
├─ App.tsx                Conecta pantallas, audio, guardado y pausa automática
├─ state/machine.ts       Máquina de estados: menú, ayuda, configuración, puntuaciones, partida, pausa, fin
├─ game/                  LÓGICA (sin dependencias del navegador)
│  ├─ engine.ts           Motor: caída, apariciones, vidas, etapas, poderes y cola de eventos
│  ├─ difficulty.ts       Parámetros de cada nivel
│  ├─ scoring.ts          Fórmulas de puntos, multiplicadores, precisión y PPM
│  ├─ powers.ts           Datos de los cuatro poderes y sus teclas
│  ├─ ranks.ts            Escala de rangos según la puntuación final
│  ├─ words.ts            Normalización de texto y banco de palabras
│  ├─ dictionary.ts       Carga los JSON del diccionario
│  ├─ storage.ts          Configuración y récords en LocalStorage
│  ├─ backgrounds.ts      Lista de fondos disponibles y sus nombres
│  └─ session.ts          Bucle con requestAnimationFrame; une motor, dibujo, efectos y audio
├─ render/                DIBUJO en Canvas
│  ├─ renderer.ts         Fichas, línea de peligro, anuncios y transición final
│  ├─ background.ts       Compone el fondo elegido: capas prerrenderizadas, parallax y animaciones
│  ├─ scenes/             Un archivo por fondo (ciudad, espacio, prehistoria, mar, Japón, aurora)
│  ├─ effects.ts          Partículas, textos flotantes, rayos, ondas y vibración
│  └─ icons.ts            Iconos de poderes compartidos entre Canvas y SVG
├─ audio/audio.ts         Efectos y música generados con Web Audio API
├─ ui/                    INTERFAZ en React y Tailwind (menús, HUD, panel de poderes, caja de escritura)
└─ data/diccionario/      Palabras en JSON, por dificultad
tests/                    Pruebas con Vitest
```

**Flujo de un cuadro.** `GameSession` calcula el tiempo transcurrido, llama a `engine.update(dt)`, recoge los eventos del motor (palabra eliminada, vida perdida, nivel superado…) y los traduce en efectos visuales y sonidos. Después el renderizador dibuja el estado actual. La interfaz de React solo recibe un resumen (puntaje, vidas, inventario) cuando algo cambia, así que no se redibuja en cada cuadro.

**Movimiento.** El motor avanza por tiempo real (delta time) y divide los saltos grandes en pasos de 50 ms como máximo, de modo que el resultado no depende de la tasa de cuadros.

**Teclado.** La escritura usa un campo de texto real que conserva el foco durante la partida, lo que garantiza el funcionamiento de tildes y teclas muertas. Los botones de la interfaz no pueden recibir el foco mientras se juega, así que Enter nunca los activa por accidente.

## Ampliar el diccionario

Las palabras están en `src/data/diccionario/`. Cada archivo tiene esta forma:

```json
{
  "nivel": 2,
  "nombre": "Intermedias",
  "palabras": ["ventana", "cocina", "jardín"]
}
```

`nivel` va de 1 (cortas y frecuentes) a 4 (complejas). Puedes añadir palabras a un archivo existente o crear otro `.json` en la misma carpeta: se carga automáticamente. Al cargar se pasan a minúsculas y se descartan las repetidas y las que contengan espacios, números o símbolos. El diccionario incluido tiene 1.596 palabras.

## Añadir un fondo

1. Crea `src/render/scenes/mifondo.ts` que exporte un objeto `Scene` (toma cualquiera de los existentes como modelo): `sky` pinta el cielo, `layers` las capas fijas con su parallax, y `back` / `front` los elementos animados.
2. Regístralo en `src/render/scenes/index.ts`.
3. Añade su identificador y su nombre en `src/game/backgrounds.ts`.

Aparece solo en la configuración, con su miniatura.

## Pruebas

`npm test` ejecuta 132 pruebas sobre la lógica principal:

| Archivo | Qué comprueba |
|---|---|
| `tests/engine.test.ts` | Aciertos y errores, tildes y mayúsculas, palabras repetidas, vidas, fin de partida, pausa, reinicio, apariciones sin solapes |
| `tests/levels.test.ts` | Fin de etapa, resumen del nivel, cuenta regresiva de 5 a 0 y arranque del nivel siguiente |
| `tests/names.test.ts` | Nombres de la tabla: limpieza, largo máximo, renombrar y último nombre usado |
| `tests/powers.test.ts` | Los cuatro poderes, límite de inventario, temporizadores en pausa |
| `tests/ranks.test.ts` | Escala de rangos: orden, límites exactos y avance hacia el siguiente |
| `tests/scoring.test.ts` | Fórmula de puntos, multiplicadores y rachas |
| `tests/difficulty.test.ts` | Progresión de niveles y sus límites |
| `tests/words.test.ts` | Diccionario (más de 1.000 palabras únicas y válidas) y selección de palabras |
| `tests/storage.test.ts` | Récords y configuración que sobreviven al cierre del navegador |
| `tests/machine.test.ts` | Transiciones entre pantallas |
