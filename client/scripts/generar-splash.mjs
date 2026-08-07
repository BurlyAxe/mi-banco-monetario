/**
 * Genera las pantallas de arranque de iOS.
 *
 *   node scripts/generar-splash.mjs
 *
 * ¿Por qué un script y no doce PNG subidos a mano? Porque son doce archivos
 * binarios cuyo único contenido es un color, y ese color es el fondo de la app:
 * el día que cambie, nadie se va a acordar de volver a exportarlos uno por uno
 * desde un editor. Así se cambia la constante COLOR y se vuelve a correr.
 *
 * Y ¿por qué hacen falta? Safari no sabe sacar la pantalla de arranque del
 * manifiesto: si no encuentra una imagen para el tamaño exacto del aparato,
 * enseña un rectángulo blanco mientras carga. En una app de fondo azul claro
 * ese destello blanco es lo primero que se ve cada vez que se abre.
 *
 * Sin dependencias: un PNG de color plano es lo bastante simple como para
 * escribirlo con el zlib que ya trae Node, y no vale la pena arrastrar una
 * librería de imágenes al proyecto para esto.
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** El --fondo-app de global.css. Si cambia allí, cambia aquí. */
const COLOR = [0xe9, 0xf0, 0xf6];

const DESTINO = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'iconos', 'arranque');

/**
 * Cada iPhone en vertical, con la medida lógica y la densidad que Safari usa
 * para elegir. La app es solo vertical (`orientation: portrait` en el
 * manifiesto), así que no hay versiones apaisadas.
 */
const PANTALLAS = [
  { ancho: 320, alto: 568, escala: 2 }, // SE 1ª gen
  { ancho: 375, alto: 667, escala: 2 }, // 8, SE 2ª y 3ª
  { ancho: 414, alto: 736, escala: 3 }, // 8 Plus
  { ancho: 414, alto: 896, escala: 2 }, // XR, 11
  { ancho: 375, alto: 812, escala: 3 }, // X, XS, 11 Pro
  { ancho: 414, alto: 896, escala: 3 }, // XS Max, 11 Pro Max
  { ancho: 390, alto: 844, escala: 3 }, // 12, 13, 14
  { ancho: 428, alto: 926, escala: 3 }, // 12, 13, 14 Pro Max
  { ancho: 393, alto: 852, escala: 3 }, // 14 Pro, 15, 16
  { ancho: 430, alto: 932, escala: 3 }, // 15 Pro Max, 16 Plus
  { ancho: 402, alto: 874, escala: 3 }, // 16 Pro
  { ancho: 440, alto: 956, escala: 3 }, // 16 Pro Max
];

const TABLA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

const crc32 = (buffer) => {
  let c = 0xffffffff;
  for (const byte of buffer) c = TABLA_CRC[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

/** Un trozo de PNG: longitud, tipo, datos y su CRC. */
const trozo = (tipo, datos) => {
  const longitud = Buffer.alloc(4);
  longitud.writeUInt32BE(datos.length);
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(cuerpo));
  return Buffer.concat([longitud, cuerpo, crc]);
};

function pngDeColorPlano(ancho, alto, [r, g, b]) {
  const cabecera = Buffer.alloc(13);
  cabecera.writeUInt32BE(ancho, 0);
  cabecera.writeUInt32BE(alto, 4);
  cabecera[8] = 8; // bits por canal
  cabecera[9] = 2; // color verdadero, sin transparencia
  // Los tres restantes (compresión, filtro, entrelazado) van en 0, que es lo
  // único que el formato admite, y Buffer.alloc ya los dejó así.

  // Cada línea empieza con un byte que dice qué filtro se le aplicó. 0 = a
  // pelo, que para un color plano comprime igual de bien y se lee de un vistazo.
  const linea = Buffer.alloc(1 + ancho * 3);
  for (let x = 0; x < ancho; x++) {
    linea[1 + x * 3] = r;
    linea[2 + x * 3] = g;
    linea[3 + x * 3] = b;
  }
  const crudo = Buffer.concat(Array.from({ length: alto }, () => linea));

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    trozo('IHDR', cabecera),
    trozo('IDAT', deflateSync(crudo, { level: 9 })),
    trozo('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(DESTINO, { recursive: true });

const etiquetas = [];
for (const { ancho, alto, escala } of PANTALLAS) {
  const px = { ancho: ancho * escala, alto: alto * escala };
  const nombre = `arranque-${px.ancho}x${px.alto}.png`;
  writeFileSync(join(DESTINO, nombre), pngDeColorPlano(px.ancho, px.alto, COLOR));

  etiquetas.push(
    `    <link rel="apple-touch-startup-image" href="/iconos/arranque/${nombre}"\n` +
      `      media="(device-width: ${ancho}px) and (device-height: ${alto}px) and (-webkit-device-pixel-ratio: ${escala}) and (orientation: portrait)" />`,
  );
}

console.log(`${PANTALLAS.length} pantallas de arranque en ${DESTINO}\n`);
console.log('Para index.html:\n');
console.log(etiquetas.join('\n'));
