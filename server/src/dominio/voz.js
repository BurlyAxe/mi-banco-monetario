/**
 * La voz de Nivis.
 *
 * Todo lo que Nivis dice pasa por aquí, y todo cambia según el tono que el
 * usuario eligió en sus ajustes ("¿qué tan directo quieres que sea?"):
 *
 *   Optimista → celebra lo que sí haces bien; nunca te hace sentir mal.
 *   Normal    → humor y verdad, sin drama.
 *   Realista  → los números tal cual y qué estás haciendo mal, sin adornos.
 *   Rudo      → te regaña de verdad cuando te pasas.
 *
 * Regla que ningún tono rompe: Nivis JAMÁS reclama por despensa, salud,
 * educación, ropa, higiene o servicios. Sobrevivir no es un vicio. El regaño
 * solo existe para el gasto de puro gusto (ver `vibraDeGasto` en constantes).
 */

import { dinero } from './formato.js';

/**
 * El veredicto: el texto grande bajo el titular del panel.
 *
 * `situacion` decide QUÉ se dice y el tono decide CÓMO. Las situaciones donde
 * el gasto fue esencial nunca caen en un caso de regaño.
 */
const VEREDICTO = {
  /** Cuenta recién creada (o periodo sin un solo gasto). */
  arranque: {
    Optimista: () =>
      'Cero pesos gastados. No hemos gastado nada y eso ya es un buen inicio: la hoja está limpia y el saldo intacto.',
    Normal: () =>
      'No hemos gastado nada todavía, que es el mejor arranque posible. Anota tu primer movimiento y empezamos a contar la historia.',
    Realista: () =>
      'Cero gastos registrados en el periodo. Sin datos no hay diagnóstico: registra lo que gastes y aquí te digo exactamente en qué se te va.',
    Rudo: () =>
      'Cero gastos. Por una vez no tengo nada que reclamarte, disfrútalo mientras dure. Anota tus movimientos y ahí sí platicamos.',
  },

  /** Hay ingresos pero ningún gasto: el mejor escenario posible. */
  arranqueConIngresos: {
    Optimista: ({ ingresos }) =>
      `${dinero(ingresos)} de ingresos y nada gastado. No hemos gastado nada: eso es un inicio inmejorable, todo sigue siendo tuyo.`,
    Normal: ({ ingresos }) =>
      `Entraron ${dinero(ingresos)} y no ha salido un peso. No hemos gastado nada, así que hoy vas invicto contra tu propia cartera.`,
    Realista: ({ ingresos }) =>
      `${dinero(ingresos)} de ingresos, $0 de gastos, 100% disponible. Es el mejor número posible; sostenerlo es la parte difícil.`,
    Rudo: ({ ingresos }) =>
      `${dinero(ingresos)} adentro y nada afuera. No hemos gastado nada, o sea que por ahora estás impecable. No lo arruines el fin de semana.`,
  },

  /** Gastó más de lo que ganó, y fue en puro gusto. Aquí sí hay reclamo. */
  excedido: {
    Optimista: ({ pct, gusto, ingresos }) =>
      `Gastaste el ${pct}% de tus ingresos, un poco más de lo que entró. Nada que no se arregle: ${dinero(gusto)} fueron de puro gusto, y ese es justo el pedazo que sí puedes mover el próximo periodo.`,
    Normal: ({ pct, gusto }) =>
      `Gastaste el ${pct}% de tus ingresos: sí, más de lo que ganaste. ${dinero(gusto)} se fueron en antojos, o sea que el hoyo no lo hizo la vida, lo hiciste tú con muy buena actitud.`,
    Realista: ({ pct, gusto, ingresos, total }) =>
      `Gastaste ${dinero(total)} contra ${dinero(ingresos)} de ingresos: el ${pct}%. Estás en números rojos y ${dinero(gusto)} de eso fue gasto evitable. Sin recortar esa parte, el próximo periodo empiezas debiendo.`,
    Rudo: ({ pct, gusto, topGusto }) =>
      `Gastaste el ${pct}% de lo que ganaste. Léelo otra vez: gastaste más de lo que tienes, y ${dinero(gusto)} se fueron en cosas que no necesitabas. ${topGusto} no es una emergencia, es una decisión que tomaste tú. Para el próximo periodo, esto se corta.`,
  },

  /** Se pasó de sus ingresos, pero por cosas necesarias. Cero regaño. */
  excedidoEsencial: {
    Optimista: ({ pct, esencial }) =>
      `Gastaste el ${pct}% de tus ingresos, pero ${dinero(esencial)} fueron en despensa, salud y cosas que de verdad se necesitan. Eso no es descontrol, es la vida cobrando; lo estás sosteniendo bien.`,
    Normal: ({ pct, esencial }) =>
      `Te pasaste: el ${pct}% de tus ingresos. Ahora, ${dinero(esencial)} de eso fue despensa, salud y necesidades — por eso no te digo nada. El problema no es cómo gastas, es que el ingreso quedó corto.`,
    Realista: ({ pct, esencial, total }) =>
      `${dinero(total)} gastados, el ${pct}% de tus ingresos, y ${dinero(esencial)} de eso fue esencial. Recortar aquí no es opción real: el número que hay que mover es el de arriba, el de lo que entra.`,
    Rudo: ({ pct, esencial }) =>
      `Te pasaste el ${pct}% de tus ingresos, pero no te voy a regañar por esto: ${dinero(esencial)} fueron necesidades. Aquí no sobra gasto, falta ingreso. Ese es el frente en el que hay que pelear.`,
  },

  /** Va apretado (85% o más del ingreso) sin llegar a excederse. */
  ajustado: {
    Optimista: ({ pct, queda }) =>
      `Llevas el ${pct}% de tus ingresos y todavía te quedan ${dinero(queda)}. Vas justo, pero vas: cerrar en verde ya está a tu alcance.`,
    Normal: ({ pct, queda }) =>
      `Vas en el ${pct}% de tus ingresos y te quedan ${dinero(queda)}. Cabe todo, pero cabe apretado: un antojo más y la cuenta se pone incómoda.`,
    Realista: ({ pct, queda, gusto }) =>
      `${pct}% de tus ingresos ya gastado, quedan ${dinero(queda)}. Con ${dinero(gusto)} en gasto de gusto, no tienes margen para imprevistos. Eso es el riesgo real, no el monto.`,
    Rudo: ({ pct, queda, gusto }) =>
      `${pct}% de tus ingresos, y ${dinero(gusto)} de puro gusto. Te quedan ${dinero(queda)} para lo que falta del periodo. Si se te descompone algo, no la libras. Frena ahora.`,
  },

  /** El gasto de gusto se comió una tajada grande del total. */
  gustoAlto: {
    Optimista: ({ gusto, pctGusto, esencial }) =>
      `${dinero(gusto)} se fueron en gustos (el ${pctGusto}% de tu gasto) y ${dinero(esencial)} en cosas necesarias. Disfrutar también cuenta; solo ponle un número al gusto y sigues igual de tranquilo.`,
    Normal: ({ gusto, pctGusto, topGusto }) =>
      `${dinero(gusto)} en puro gusto: el ${pctGusto}% de todo lo que gastaste. Divertirte no es delito, pero ${topGusto} ya te está pidiendo firmar contrato.`,
    Realista: ({ gusto, pctGusto, esencial }) =>
      `${dinero(gusto)} en gasto de gusto contra ${dinero(esencial)} en necesidades: el ${pctGusto}% de tu dinero se fue en cosas que no te devuelven nada. Ahí está tu margen de ahorro completo, no en la despensa.`,
    Rudo: ({ gusto, pctGusto, topGusto }) =>
      `El ${pctGusto}% de tu gasto fue puro antojo: ${dinero(gusto)} que no necesitabas. ${topGusto} ya dejó de ser un gusto y es tu personalidad. Esto no es mala suerte, es falta de freno.`,
  },

  /** Comida fuera de casa / a domicilio pesando demasiado. */
  comidaFuera: {
    Optimista: ({ antojo }) =>
      `${dinero(antojo)} se fueron en comer fuera y pedir a domicilio. Comer rico se disfruta; con cocinar dos veces por semana recuperas buena parte sin dejar de darte tus gustos.`,
    Normal: ({ antojo, ahorro }) =>
      `${dinero(antojo)} en comida de antojo y domicilios. Cocinar dos veces por semana te devuelve como ${dinero(ahorro)}: la despensa está bien, lo que sale caro es la flojera de las 10 de la noche.`,
    Realista: ({ antojo, ahorro }) =>
      `${dinero(antojo)} en comer fuera y apps de comida. Ese gasto es sustituible casi al 100%: cocinando la mitad de esas veces recuperas ${dinero(ahorro)} sin bajar tu nivel de vida.`,
    Rudo: ({ antojo, ahorro }) =>
      `${dinero(antojo)} en pedir comida. No en despensa: en flojera. Ese dinero se evaporó en bolsas de plástico y ${dinero(ahorro)} de eso lo pudiste tener todavía. Aprende a prender la estufa.`,
  },

  /** Gastó, pero casi todo fue en cosas que se necesitan. Nunca hay reclamo. */
  esencial: {
    Optimista: ({ esencial, pctEsencial }) =>
      `${dinero(esencial)} de tu gasto (el ${pctEsencial}%) fue en despensa, salud, transporte y cosas que se necesitan. Estás gastando en vivir, no en huir: eso se llama tenerlo bajo control.`,
    Normal: ({ esencial, pctEsencial }) =>
      `El ${pctEsencial}% de tu gasto fue esencial: ${dinero(esencial)} en despensa, salud, estudios y demás. Aquí no tengo nada que reclamarte, y créeme que le busqué.`,
    Realista: ({ esencial, pctEsencial, gusto }) =>
      `${dinero(esencial)} en gasto esencial (${pctEsencial}%) y ${dinero(gusto)} en gusto. La estructura de tu gasto es sana: si quieres ahorrar más, el ajuste ya no está en recortar, está en ganar más.`,
    Rudo: ({ esencial, pctEsencial }) =>
      `${pctEsencial}% de tu gasto fue en necesidades: ${dinero(esencial)}. Iba a regañarte y no encontré por dónde. Así se ve un periodo bien llevado, que no se te haga costumbre presumirlo.`,
  },

  /** Todo en orden, nada destacable. */
  sano: {
    Optimista: ({ total, gusto }) =>
      `${dinero(total)} gastados y solo ${dinero(gusto)} en gustos. Vas bien: ni te estás privando ni te estás pasando, que es exactamente el punto.`,
    Normal: ({ total, gusto, top }) =>
      `${dinero(total)} en total, ${dinero(gusto)} de puro gusto. ${top} lidera la tabla pero sin escándalo. Periodo tranquilo, de esos que no dan para chisme.`,
    Realista: ({ total, gusto, top }) =>
      `${dinero(total)} gastados, ${dinero(gusto)} en gusto, ${top} como categoría más pesada. Nada fuera de rango. Si quieres mejorar, ponle un tope al gusto antes de que crezca solo.`,
    Rudo: ({ total, gusto, topGusto }) =>
      `${dinero(total)} y ${dinero(gusto)} de eso en antojos. No es un desastre, pero tampoco me impresiona: ${topGusto} es por donde se te va a ir de las manos si te confías.`,
  },
};

/** Se pega al final del veredicto cuando no hay ni un ingreso anotado. */
const SIN_INGRESOS = {
  Optimista: ' Aún no anotas ingresos: regístralos y verás que el panorama se ve mejor de lo que parece.',
  Normal: ' Y sin un solo ingreso anotado en el periodo, así que estos números están contando media historia.',
  Realista: ' No hay ingresos registrados, así que no puedo calcular qué porcentaje de tu dinero es esto. Anótalos.',
  Rudo: ' Ni un ingreso registrado. Difícil cuidar un dinero que no me dejas ver.',
};

export function textoDeVeredicto({ tono, situacion, datos, hayIngresos }) {
  const grupo = VEREDICTO[situacion] || VEREDICTO.sano;
  const base = (grupo[tono] || grupo.Normal)(datos);
  const arranque = situacion === 'arranque' || situacion === 'arranqueConIngresos';
  return hayIngresos || arranque ? base : base + SIN_INGRESOS[tono];
}

/* ------------------------------------------------------------------ consejos */

/** Encabezado de la tarjeta de consejo; cambia con el tono. */
export const ETIQUETA_CONSEJO = {
  Optimista: 'NIVIS TE ANIMA',
  Normal: 'NIVIS DICE',
  Realista: 'NIVIS ANALIZA',
  Rudo: 'NIVIS TE LO ADVIERTE',
};

/**
 * Los consejos que la tarjeta va rotando. Cada uno se escribe cuatro veces,
 * una por tono, porque el consejo útil es el mismo pero la forma de tragarlo no.
 */
export function textosDeConsejo({ tono, totales, total, ranked, ingresos, delivery, suscripciones, gusto }) {
  const semanal = total / 4;
  const top = ranked[0];
  const elige = (opciones) => opciones[tono] || opciones.Normal;

  const lista = [];

  lista.push(
    ingresos > 0
      ? elige({
          Optimista: `De los ${dinero(ingresos)} que ingresaste, gastaste ${dinero(total)}. Aparta el 20% (${dinero(ingresos * 0.2)}) apenas entre y el resto te lo gastas sin una pizca de culpa.`,
          Normal: `De los ${dinero(ingresos)} de ingresos, gastaste ${dinero(total)}. Si apartas el 20% en cuanto entra (${dinero(ingresos * 0.2)}), el resto lo puedes quemar tranquilo.`,
          Realista: `Ingresos ${dinero(ingresos)}, gastos ${dinero(total)}. El 20% de tus ingresos son ${dinero(ingresos * 0.2)}: sepáralos el mismo día que entran o se gastan solos, siempre pasa.`,
          Rudo: `Ingresaste ${dinero(ingresos)} y gastaste ${dinero(total)}. Aparta ${dinero(ingresos * 0.2)} el día que te caiga el dinero, porque si esperas a fin de mes ya no va a estar. Los dos sabemos que no va a estar.`,
        })
      : elige({
          Optimista: 'Todavía no anotas ingresos. Regístralos con el botón de Ingresos: ver lo que entra motiva más que ver lo que sale.',
          Normal: 'No hay ingresos anotados en este periodo. Regístralos con el botón de Ingresos: sin saber cuánto entra, cualquier gasto parece razonable.',
          Realista: 'Sin ingresos registrados no hay porcentajes ni presupuesto posible. Anótalos con el botón de Ingresos y el resto de los números empieza a servir.',
          Rudo: 'No anotaste un solo ingreso. Así no se puede: registra lo que entra con el botón de Ingresos o deja de preguntarme por qué no te alcanza.',
        }),
  );

  // Con cero gasto de gusto no hay nada que echar en cara: cambia el consejo.
  lista.push(
    gusto > 0
      ? elige({
          Optimista: `Regla amable: 50% necesidades, 30% gustos, 20% ahorro. Con ${dinero(total)} te tocaría guardar ${dinero(total * 0.2)} — y llevas ${dinero(gusto)} de gusto, que también hace falta.`,
          Normal: `Regla rápida: 50% necesidades, 30% gustos, 20% ahorro. Con ${dinero(total)} te tocaría guardar ${dinero(total * 0.2)} — hoy vas en ${dinero(gusto)} de puro gusto.`,
          Realista: `Referencia 50/30/20: de ${dinero(total)}, el ahorro serían ${dinero(total * 0.2)} y el gusto ${dinero(total * 0.3)}. Vas en ${dinero(gusto)} de gusto: ahí está la desviación, medida.`,
          Rudo: `50% necesidades, 30% gustos, 20% ahorro. Deberías estar guardando ${dinero(total * 0.2)} y llevas ${dinero(gusto)} en antojos. La regla no falló, la ignoraste.`,
        })
      : elige({
          Optimista: `Regla amable: 50% necesidades, 30% gustos, 20% ahorro. No llevas nada en gasto de gusto, así que los ${dinero(total * 0.2)} de ahorro los tienes servidos.`,
          Normal: `Regla rápida: 50% necesidades, 30% gustos, 20% ahorro. Sin gasto de gusto en el periodo, apartar ${dinero(total * 0.2)} es de las cosas fáciles que te van a pasar hoy.`,
          Realista: `Referencia 50/30/20: de ${dinero(total)}, el ahorro serían ${dinero(total * 0.2)}. Tu gasto de gusto es cero, así que el margen ya existe: solo falta moverlo al ahorro.`,
          Rudo: `50% necesidades, 30% gustos, 20% ahorro. Cero en antojos este periodo, o sea que no tengo con qué regañarte: aparta los ${dinero(total * 0.2)} y quedamos a mano.`,
        }),
  );

  if (delivery > 0) {
    lista.push(
      elige({
        Optimista: `${dinero(delivery)} en apps de comida. Si cocinas dos veces por semana recuperas como ${dinero(delivery * 0.4)} y ni sientes el cambio.`,
        Normal: `${dinero(delivery)} en apps de comida. Cocinar dos veces por semana te devuelve como ${dinero(delivery * 0.4)}: eso es un par de tanques de gasolina.`,
        Realista: `${dinero(delivery)} en apps de comida. Reducir esos pedidos a la mitad libera ${dinero(delivery * 0.4)} sin tocar nada esencial: es el recorte más fácil que tienes disponible.`,
        Rudo: `${dinero(delivery)} en apps de comida. Eso es dinero que le regalaste a un repartidor por no caminar a la cocina. Con la mitad tendrías ${dinero(delivery * 0.4)} todavía en la cuenta.`,
      }),
    );
  } else {
    lista.push(
      elige({
        Optimista: 'Cero pedidos a domicilio en el periodo. Eso es autocontrol y merece que te lo diga en voz alta.',
        Normal: 'Cero pedidos a domicilio en el periodo. Nivis levanta una ceja de aprobación y no dice más.',
        Realista: 'Sin gasto en apps de comida en el periodo. Es una de las fugas más comunes y no la tienes: bien resuelto.',
        Rudo: 'Ni un pedido a domicilio. Bueno. Al menos algo estás haciendo bien, no me lo eches a perder mañana.',
      }),
    );
  }

  if (suscripciones > 0) {
    lista.push(
      elige({
        Optimista: `Tus suscripciones suman ${dinero(suscripciones)} (${dinero(suscripciones * 12)} al año). Revisa cuál no abriste últimamente y cancélala: es ahorro sin sacrificio.`,
        Normal: `Tus suscripciones suman ${dinero(suscripciones)}, o ${dinero(suscripciones * 12)} al año. Revisa cuál no abriste en tres semanas y cancélala hoy, no "luego".`,
        Realista: `${dinero(suscripciones)} en suscripciones este periodo, ${dinero(suscripciones * 12)} proyectados al año. Es gasto recurrente automático: el único que se corta una vez y ahorra doce meses.`,
        Rudo: `${dinero(suscripciones)} en suscripciones, ${dinero(suscripciones * 12)} al año, por cosas que ni abres. Estás pagando renta de aplicaciones que no visitas. Cancela una hoy, no "luego".`,
      }),
    );
  }

  lista.push(
    elige({
      Optimista: `Ponte un tope semanal de ${dinero(semanal * 0.85)}. No es castigo: es saber que lo que gastes debajo de esa línea es completamente tuyo.`,
      Normal: `Ponte un tope semanal de ${dinero(semanal * 0.85)}. Cuando llegues, el resto de la semana es cocina, caminata y series que ya pagaste.`,
      Realista: `Tu ritmo actual son ${dinero(semanal)} por semana. Un tope de ${dinero(semanal * 0.85)} es un recorte del 15%: suficiente para notarse en el mes y poco para que lo abandones.`,
      Rudo: `Tope semanal: ${dinero(semanal * 0.85)}. Cuando lo pases, se acabó. Ni "es que era una ocasión especial" ni "lo repongo la otra semana". Se acabó.`,
    }),
  );

  lista.push(
    elige({
      Optimista: 'Antes de comprar algo de $300 o más, espera 24 horas. Si mañana lo sigues queriendo, va — y disfrutarlo sin dudar es lo mejor de ese truco.',
      Normal: 'Truco anti-antojo: antes de comprar algo de $300 o más, espera 24 horas. Si al día siguiente sigues queriéndolo, va — casi siempre se te olvida.',
      Realista: 'Regla de las 24 horas para compras de $300 o más. La mayoría de las compras por impulso no sobreviven un día de espera: no es fuerza de voluntad, es tiempo.',
      Rudo: 'Antes de comprar algo de $300 para arriba, espera 24 horas. Si te da ansiedad esperar un día, ese es exactamente el problema del que te estoy hablando.',
    }),
  );

  lista.push(
    elige({
      Optimista: `Sepárate el 10% en cuanto te caiga el dinero: son ${dinero(total * 0.1)}. En seis meses tienes un fondo de emergencia y ni te diste cuenta.`,
      Normal: `Sepárate el 10% en cuanto te caiga el dinero, no al final. Con tu ritmo son ${dinero(total * 0.1)}: en seis meses ya es un fondo de emergencia real.`,
      Realista: `El 10% de tu ritmo son ${dinero(total * 0.1)} por periodo. En seis periodos son ${dinero(total * 0.6)}: ese es el número entre ti y pedir prestado cuando algo se descomponga.`,
      Rudo: `Aparta ${dinero(total * 0.1)} en cuanto entre el dinero. Al final del periodo no queda nada y lo sabes. Si no tienes fondo de emergencia, la emergencia la vas a pagar con intereses.`,
    }),
  );

  lista.push(
    elige({
      Optimista: `${top} es tu categoría más pesada. No la elimines, solo ponle presupuesto: ${dinero(totales[top] * 0.8)} el próximo periodo y ni lo vas a extrañar.`,
      Normal: `${top} es tu categoría más pesada. No la elimines, ponle presupuesto: ${dinero(totales[top] * 0.8)} el periodo que entra y lo sientes menos que un ayuno.`,
      Realista: `${top} concentra la mayor parte de tu gasto: ${dinero(totales[top])}. Un tope del 80% (${dinero(totales[top] * 0.8)}) es el ajuste con mayor impacto por menor esfuerzo que tienes.`,
      Rudo: `${top} es tu categoría más pesada con ${dinero(totales[top])}. El próximo periodo: ${dinero(totales[top] * 0.8)} y ni un peso más. No es sugerencia.`,
    }),
  );

  return lista;
}

/* ----------------------------------------------------- resumen de un día suelto */

/** Encabezado del resumen que Nivis da al abrir un día en el calendario. */
export const ETIQUETA_DIA = {
  Optimista: 'NIVIS RECUERDA ESE DÍA',
  Normal: 'NIVIS SOBRE ESE DÍA',
  Realista: 'NIVIS DESGLOSA ESE DÍA',
  Rudo: 'NIVIS TE RECUERDA ESE DÍA',
};

/**
 * El resumen de un día que ya pasó: de las 00:00 a las 23:59 de esa fecha.
 *
 * Mismas reglas que el veredicto del periodo — el día que se fue en despensa,
 * salud o transporte no recibe reclamo por más alto que sea el número.
 */
const RESUMEN_DIA = {
  /** Ni gastos ni ingresos: el día no dejó rastro. */
  sinNada: {
    Optimista: ({ dia }) => `El ${dia} no anotaste nada. Un día sin movimientos también es un día en que tu dinero se quedó donde estaba.`,
    Normal: ({ dia }) => `Nada anotado el ${dia}. O no gastaste, o no lo registraste — y de esas dos, solo una cuenta como victoria.`,
    Realista: ({ dia }) => `Cero movimientos el ${dia}. Sin registros no hay nada que analizar: si ese día sí gastaste, anótalo y vuelve.`,
    Rudo: ({ dia }) => `El ${dia} no hay ni un movimiento. Si de verdad no gastaste, felicidades. Si se te olvidó anotar, entonces no cuenta.`,
  },

  /** Entró dinero y no salió nada: el mejor día posible. */
  soloIngresos: {
    Optimista: ({ dia, ingresos }) => `El ${dia} entraron ${dinero(ingresos)} y no salió un peso. Días así son los que construyen el colchón.`,
    Normal: ({ dia, ingresos }) => `${dinero(ingresos)} de ingresos el ${dia} y cero gastos. Día invicto contra tu propia cartera.`,
    Realista: ({ dia, ingresos }) => `${dinero(ingresos)} de ingreso y $0 de gasto el ${dia}. Es el balance diario perfecto; el mérito está en repetirlo.`,
    Rudo: ({ dia, ingresos }) => `Entraron ${dinero(ingresos)} el ${dia} y no gastaste nada. Ese día sí supiste. ¿Y los demás?`,
  },

  /** Casi todo lo del día fue necesario. Cero regaño. */
  esencial: {
    Optimista: ({ dia, total, esencial, movimientos }) =>
      `El ${dia} gastaste ${dinero(total)} en ${movimientos} movimiento${movimientos === 1 ? '' : 's'}, y ${dinero(esencial)} de eso fue en cosas que se necesitan. Ese día gastaste en vivir: bien hecho.`,
    Normal: ({ dia, total, esencial }) =>
      `${dinero(total)} el ${dia}, de los cuales ${dinero(esencial)} fueron despensa, salud, transporte y demás. Ese día no tengo nada que reclamarte.`,
    Realista: ({ dia, total, esencial, pctEsencial }) =>
      `${dinero(total)} gastados el ${dia}: el ${pctEsencial}% (${dinero(esencial)}) fue gasto esencial. Ahí no hay nada que recortar, era gasto obligado.`,
    Rudo: ({ dia, total, esencial }) =>
      `${dinero(total)} el ${dia} y ${dinero(esencial)} fueron necesidades. Busqué por dónde regañarte ese día y no encontré. Que se repita.`,
  },

  /** El día se fue en puro antojo. */
  antojos: {
    Optimista: ({ dia, total, gusto, topGusto }) =>
      `El ${dia} gastaste ${dinero(total)} y ${dinero(gusto)} fueron de puro gusto, sobre todo en ${topGusto}. Date el gusto, solo que con número puesto: elige cuánto antes de salir.`,
    Normal: ({ dia, total, gusto, pctGusto, topGusto }) =>
      `${dinero(total)} el ${dia}, y el ${pctGusto}% (${dinero(gusto)}) se fue en antojos. ${topGusto} se llevó la corona ese día.`,
    Realista: ({ dia, total, gusto, pctGusto, topGusto }) =>
      `${dinero(total)} el ${dia}. ${dinero(gusto)}, el ${pctGusto}%, fue gasto prescindible y ${topGusto} concentró la mayor parte. Ese día tenías margen de ahorro completo ahí.`,
    Rudo: ({ dia, gusto, pctGusto, topGusto }) =>
      `El ${pctGusto}% de lo que gastaste el ${dia} fue puro antojo: ${dinero(gusto)} que no necesitabas, casi todo en ${topGusto}. Ese día no te falló la suerte, te falló el freno.`,
  },

  /** El día se fue en comer fuera y pedir a domicilio. */
  comidaFuera: {
    Optimista: ({ dia, antojo }) =>
      `El ${dia} se fueron ${dinero(antojo)} en comer fuera y domicilios. Comer rico se disfruta; con cocinar una vez más a la semana recuperas buena parte.`,
    Normal: ({ dia, antojo, total }) =>
      `De los ${dinero(total)} del ${dia}, ${dinero(antojo)} fueron comida fuera y apps de comida. La despensa está bien; lo caro es la flojera de las 10 de la noche.`,
    Realista: ({ dia, antojo, total }) =>
      `${dinero(total)} el ${dia}, ${dinero(antojo)} en comer fuera. Ese gasto es sustituible casi al 100% sin bajar tu nivel de vida.`,
    Rudo: ({ dia, antojo }) =>
      `${dinero(antojo)} en pedir comida el ${dia}. No en despensa: en flojera. Ese dinero se fue en bolsas de plástico.`,
  },

  /** Gastó bastante más que su día promedio. */
  caro: {
    Optimista: ({ dia, total, promedio, movimientos }) =>
      `El ${dia} fue tu día caro: ${dinero(total)} en ${movimientos} movimiento${movimientos === 1 ? '' : 's'}, contra ${dinero(promedio)} que gastas en un día normal. Pasa; lo importante es que el de junto sea tranquilo.`,
    Normal: ({ dia, total, promedio, top }) =>
      `${dinero(total)} el ${dia} contra ${dinero(promedio)} de tu día promedio. ${top} fue el que más pesó. Un día así se compensa, dos seguidos ya son tendencia.`,
    Realista: ({ dia, total, promedio, top, veces }) =>
      `${dinero(total)} el ${dia}: ${veces} veces tu día promedio de ${dinero(promedio)}. ${top} fue la categoría más pesada. Un día así se nota en el cierre del mes.`,
    Rudo: ({ dia, total, promedio, topGusto }) =>
      `${dinero(total)} en un solo día, el ${dia}. Tu día normal son ${dinero(promedio)}. Ese día se te fue la mano y ${topGusto} fue el cómplice.`,
  },

  /** Un día cualquiera, sin escándalo. */
  tranquilo: {
    Optimista: ({ dia, total, movimientos, top }) =>
      `El ${dia} gastaste ${dinero(total)} en ${movimientos} movimiento${movimientos === 1 ? '' : 's'}, con ${top} a la cabeza. Día tranquilo, de los que no hacen ruido pero suman.`,
    Normal: ({ dia, total, movimientos, top }) =>
      `${dinero(total)} el ${dia} en ${movimientos} movimiento${movimientos === 1 ? '' : 's'}. ${top} lideró sin escándalo. Día normal, de esos que no dan para chisme.`,
    Realista: ({ dia, total, movimientos, top, promedio }) =>
      `${dinero(total)} el ${dia}, ${movimientos} movimiento${movimientos === 1 ? '' : 's'}, ${top} como categoría más pesada. Tu día promedio son ${dinero(promedio)}: ese día estuviste en rango.`,
    Rudo: ({ dia, total, top }) =>
      `${dinero(total)} el ${dia}, con ${top} arriba. No hay desastre que señalar. Tampoco nada que presumir.`,
  },
};

export function textoDeDia({ tono, situacion, datos }) {
  const grupo = RESUMEN_DIA[situacion] || RESUMEN_DIA.tranquilo;
  return (grupo[tono] || grupo.Normal)(datos);
}

/* ------------------------------------------------- píldoras al registrar algo */

/**
 * Mensaje efímero al registrar un gasto. Si el gasto es esencial (despensa,
 * salud, educación, ropa, higiene…) ningún tono reclama, ni siquiera Rudo.
 */
export function textoDeGasto({ tono, categoria, monto, vibra }) {
  const m = dinero(monto);

  const POR_VIBRA = {
    vale: {
      Optimista: [
        `${m} en ${categoria}. Eso es cuidarte, y cuidarte siempre vale.`,
        `${m} en ${categoria} anotados. Gasto necesario, cero culpa.`,
      ],
      Normal: [
        `${m} en ${categoria}: esto sí cuenta como inversión. Bien ahí.`,
        `${m} en ${categoria} anotados. Ese dinero trabaja para ti.`,
      ],
      Realista: [
        `${m} en ${categoria}. Gasto esencial: entra al presupuesto, no al recorte.`,
        `${m} en ${categoria} registrados. Este no es el gasto que hay que revisar.`,
      ],
      Rudo: [
        `${m} en ${categoria}. Aquí no tengo nada que decirte: se necesitaba y ya.`,
        `${m} en ${categoria}. Por esto nunca te voy a regañar, que quede claro.`,
      ],
    },
    mixto: {
      Optimista: [
        `${m} en ${categoria}. Comer bien también es parte del plan.`,
        `${m} en ${categoria} anotados. Todo bien, solo que quede registrado.`,
      ],
      Normal: [
        `${m} en ${categoria} registrados. Comer es necesario; pedirlo a domicilio es una decisión.`,
        `${m} en ${categoria}. Que sea la última de hoy.`,
      ],
      Realista: [
        `${m} en ${categoria}. Comer es fijo; comer fuera es la parte variable, y esa es la que se puede mover.`,
        `${m} en ${categoria} registrados. Vale la pena separar despensa de antojo: no cuestan lo mismo al mes.`,
      ],
      Rudo: [
        `${m} en ${categoria}. Comer se entiende. Pedirlo tres veces por semana ya no.`,
        `${m} en ${categoria}. Si esto fue despensa, perfecto. Si fue antojo de la madrugada, ya sabes lo que pienso.`,
      ],
    },
    gusto: {
      Optimista: [
        `${m} en ${categoria}. Date el gusto, para eso trabajas — solo que quede anotado.`,
        `${m} en ${categoria} registrados. Disfrútalo, que también cuenta como vivir.`,
      ],
      Normal: [
        `${m} más en ${categoria}. Tu cartera acaba de suspirar.`,
        `${m} en ${categoria}: la dopamina duró 12 minutos, el cargo dura al mes.`,
        `${m} en ${categoria}. Nadie te dice nada, pero la dona ya se movió.`,
      ],
      Realista: [
        `${m} en ${categoria}. Gasto evitable: va directo a la cuenta de lo que pudo ser ahorro.`,
        `${m} en ${categoria} registrados. Esta es la categoría donde sí tienes margen para recortar.`,
      ],
      Rudo: [
        `${m} en ${categoria}. ¿De verdad hacía falta? Los dos sabemos la respuesta.`,
        `${m} en ${categoria}. Ahí va otro pedazo de tu quincena por un gusto de diez minutos.`,
        `${m} en ${categoria}. Anotado, y no lo anoto con gusto.`,
      ],
    },
  };

  const pool = (POR_VIBRA[vibra] || POR_VIBRA.mixto)[tono] || POR_VIBRA.mixto.Normal;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Mensaje efímero al registrar un ingreso. */
export function textoDeIngreso({ tono, fuente, monto }) {
  const m = dinero(monto);
  const POR_TONO = {
    Optimista: `+${m} de ${fuente}. Ese es el número que importa: sigue por ahí.`,
    Normal: `+${m} de ${fuente}. Que dure más que el mes pasado.`,
    Realista: `+${m} de ${fuente} registrados. Todo lo demás se mide contra este número.`,
    Rudo: `+${m} de ${fuente}. Bien. Ahora no te lo acabes en tres días como la vez pasada.`,
  };
  return POR_TONO[tono] || POR_TONO.Normal;
}

/* ------------------------------------------------------- motivación de ingresos */

/** Lo que Nivis dice de cada fuente de ingreso, para que le sigas dando. */
const POR_FUENTE = {
  Sueldo: {
    Optimista: 'Tu sueldo es tu base y llega puntual. Sobre ese piso firme se construye todo lo demás.',
    Normal: 'El sueldo es tu piso. Sigue apartando algo el mismo día que cae y hará más de lo que aparenta.',
    Realista: 'El sueldo es tu ingreso predecible: es el único con el que puedes planear meses hacia adelante. Presupuesta sobre él, no sobre los extras.',
    Rudo: 'El sueldo llega solo. Justo por eso es el que más rápido se te va: apártale algo antes de tocarlo.',
  },
  Freelance: {
    Optimista: 'El freelance te está saliendo bien. Cada proyecto que entregas te abre el siguiente: sigue por ahí.',
    Normal: 'Sigue tomando trabajos por fuera: es el ingreso que más rápido crece cuando le dedicas horas.',
    Realista: 'El freelance es tu ingreso escalable: subir tarifas o repetir clientes multiplica más que ahorrar. Ahí está tu mayor palanca.',
    Rudo: 'El freelance es lo que sí depende de ti. Si quieres más dinero, esa es la puerta: consigue un cliente más, no un café menos.',
  },
  Venta: {
    Optimista: 'Vender lo que ya no usas es dinero que estaba dormido en tu casa. Buenísimo movimiento.',
    Normal: 'Vender lo que no usas convierte cosas muertas en efectivo. Da una vuelta al clóset, siempre sale algo más.',
    Realista: 'Las ventas son ingreso de una sola vez: sirven para tapar huecos o arrancar un fondo, no para presupuestar con ellas.',
    Rudo: 'Bien vendido. Ahora la pregunta incómoda: ¿por qué compraste algo que terminaste revendiendo a menos?',
  },
  Regalo: {
    Optimista: 'Un regalo también es ingreso, y qué bueno que lo anotas. Disfrútalo sin culpa.',
    Normal: 'Dinero regalado cuenta igual. El truco es no tratarlo como si no contara.',
    Realista: 'Los regalos son ingreso no recurrente: no los metas al presupuesto mensual, mándalos al ahorro.',
    Rudo: 'Ese dinero no te costó trabajo, y por eso es el que más rápido se evapora. Mándalo al ahorro hoy mismo.',
  },
  Otro: {
    Optimista: 'Ingreso extra anotado. Toda entrada suma, por chica que parezca.',
    Normal: 'Ingresos varios: bien anotados. Lo que no se registra, no se cuenta.',
    Realista: 'Ingreso no clasificado. Si se repite, vale la pena identificarlo bien: los ingresos que se entienden se pueden repetir a propósito.',
    Rudo: 'Anótalo bien la próxima. Si no sabes de dónde vino tu dinero, tampoco vas a saber cómo conseguir más.',
  },
};

export const mensajeDeFuente = (fuente, tono) => {
  const grupo = POR_FUENTE[fuente] || POR_FUENTE.Otro;
  return grupo[tono] || grupo.Normal;
};

/** Encabezado de la hoja de ingresos. */
export const TITULAR_INGRESOS = {
  vacio: {
    Optimista: 'Todavía no anotas ingresos, y ese es el mejor lugar para empezar. Registra lo que entra y verás el panorama completo.',
    Normal: 'Sin ingresos anotados en este periodo. Anota aunque sea uno: es la mitad de la historia que falta.',
    Realista: 'Cero ingresos registrados. Sin ese dato, ningún porcentaje de esta app significa nada.',
    Rudo: 'No hay ni un ingreso anotado. Me estás pidiendo que cuide un dinero que no me dejas ver.',
  },
  conDatos: {
    Optimista: ({ total, mejor, pctMejor }) =>
      `${total} entraron este periodo y ${pctMejor}% vino de ${mejor}. Eso ya es una racha: síguele por ahí que claramente te funciona.`,
    Normal: ({ total, mejor, pctMejor }) =>
      `${total} de ingresos, y ${mejor} puso el ${pctMejor}%. Esa es tu mejor fuente hoy: dale más horas y verás el efecto.`,
    Realista: ({ total, mejor, pctMejor }) =>
      `${total} de ingresos totales. ${mejor} aporta el ${pctMejor}%, así que es donde un esfuerzo extra rinde más. Diversificar viene después.`,
    Rudo: ({ total, mejor, pctMejor }) =>
      `${total} de ingresos y el ${pctMejor}% salió de ${mejor}. Si quieres que la cuenta cierre, deja de recortar cafés y súbele ahí: es donde de verdad se mueve la aguja.`,
  },
};

/** Cierre motivacional de la hoja de ingresos, según cómo van los números. */
export const CIERRE_INGRESOS = {
  creciendo: {
    Optimista: 'Tus ingresos superan tus gastos. Vas ganando, disfrútalo y sigue haciendo exactamente lo que estás haciendo.',
    Normal: 'Entra más de lo que sale. Ese es el único resumen que de verdad importa: mantenlo.',
    Realista: 'Balance positivo. Con este margen, lo siguiente no es gastar menos sino decidir a dónde mandar lo que sobra.',
    Rudo: 'Vas en positivo. Bien. No lo celebres gastándotelo, que es exactamente lo que ibas a hacer.',
  },
  parejo: {
    Optimista: 'Entra casi lo mismo que sale. Con un ingreso extra chiquito ya la libras: vas más cerca de lo que crees.',
    Normal: 'Entra casi lo mismo que sale. No estás mal, pero no hay colchón: un ingreso extra cambiaría el panorama.',
    Realista: 'Ingresos y gastos casi iguales: margen cero. Cualquier imprevisto se paga con deuda. Subir el ingreso es más viable que recortar más.',
    Rudo: 'Estás gastando casi todo lo que ganas. Vives al día y no lo estás notando. Sube el ingreso o baja el ritmo, pero haz algo.',
  },
  corto: {
    Optimista: 'Este periodo salió más de lo que entró, y se arregla: un trabajo extra o una venta y le das la vuelta.',
    Normal: 'Sale más de lo que entra. Recortar ayuda, pero el movimiento grande está del lado del ingreso: busca de dónde sacar uno más.',
    Realista: 'Tus gastos superan tus ingresos. Recortar tiene límite; el ingreso no. Un cliente, un turno o una venta más cambia el número más rápido que cualquier ahorro.',
    Rudo: 'Gastaste más de lo que ganaste. No hay vuelta: o entra más dinero o sale menos. Elige hoy, porque el próximo periodo empieza con este hoyo.',
  },
};

/* ------------------------------------------------------ lectura de tickets */

/**
 * Lo que Nivis dice cuando acaba de leer la foto de un ticket.
 *
 * Dos reglas que ningún tono rompe:
 *
 *   1. Nivis NO decide. Acompaña la revisión, nunca da el dato por bueno ni
 *      empuja a guardar. El gasto se registra cuando el usuario lo diga.
 *   2. Sigue sin reclamar por lo esencial. Al leer un ticket todavía no se
 *      sabe qué se compró con certeza, así que en cuanto la categoría
 *      sugerida es de las que valen la pena, hasta el tono Rudo se guarda el
 *      comentario y solo pide que se revise.
 *
 * `situacion` la calcula el dominio a partir de lo que se pudo extraer:
 *   completo → los cuatro datos, con buena confianza.
 *   parcial  → falta algo, pero hay de dónde partir.
 *   dudoso   → confianza baja: el aviso pesa más que el resultado.
 *   vacio    → no se sacó nada útil de la foto.
 */
const TICKET = {
  completo: {
    Optimista: 'Creo que ya encontré casi todo. Échale un ojo antes de guardarlo.',
    Normal: 'Listo. Hice el trabajo pesado, ahora solo confirma que no me equivoqué.',
    Realista: 'Estos son los datos detectados. Verifica el monto antes de registrarlo.',
    Rudo: '¿Otra compra? Bueno… mínimo deja que revise el ticket antes de seguir vaciando la cartera.',
  },
  parcial: {
    Optimista: 'Saqué lo que se alcanzaba a leer. Completa lo que falte y queda listo en un segundo.',
    Normal: 'Rescaté lo que se dejó leer. Lo que quedó vacío te toca a ti, que para eso tienes el ticket enfrente.',
    Realista: 'Faltaron datos que la foto no permitió leer. Complétalos y revisa los que sí salieron.',
    Rudo: 'La foto no daba para más. Llena los huecos tú, que yo no adivino.',
  },
  dudoso: {
    Optimista: 'Esta me costó trabajo. Échale un ojo con calma y corrige lo que haga falta antes de guardar.',
    Normal: 'No me fío mucho de esta lectura. Revísala bien antes de darle guardar.',
    Realista: 'Confianza baja: la foto no se lee con claridad. Revisa dato por dato, sobre todo el monto.',
    Rudo: 'Con esa foto ni tú lo lees. Revisa todo antes de guardar, porque me pudo salir cualquier número.',
  },
  vacio: {
    Optimista: 'De esta foto no saqué nada, pero no pasa nada: anótalo a mano y seguimos.',
    Normal: 'No saqué nada de esa foto. Prueba con otra más de cerca o anótalo a mano.',
    Realista: 'No se pudo extraer ningún dato de la imagen. Vuelve a tomarla con más luz o captúralo manualmente.',
    Rudo: 'No leí absolutamente nada. Acerca la cámara, endereza el ticket y vuelve a intentar.',
  },
};

/**
 * Versión sin picar para el tono Rudo cuando lo comprado es de lo necesario.
 * El resto de los tonos ya no reclaman, así que no necesitan reemplazo.
 */
const TICKET_RUDO_ESENCIAL = {
  completo: 'Esto se necesitaba, así que hoy no hay sermón. Revisa el monto y guárdalo.',
  parcial: 'Es de lo que sí hace falta, no te voy a decir nada. Solo completa lo que quedó vacío.',
  dudoso: 'Se ve que era de lo necesario, pero la foto está horrible. Revisa los números antes de guardar.',
  vacio: 'No leí nada, y eso que parecía de lo necesario. Vuelve a tomar la foto.',
};

/**
 * @param {string}  tono      Tono ya normalizado.
 * @param {string}  situacion completo | parcial | dudoso | vacio.
 * @param {boolean} esencial  Si lo sugerido cae en las categorías que valen la pena.
 */
export function textoDeTicket({ tono, situacion, esencial }) {
  const grupo = TICKET[situacion] || TICKET.parcial;
  if (tono === 'Rudo' && esencial) return TICKET_RUDO_ESENCIAL[situacion] || TICKET_RUDO_ESENCIAL.parcial;
  return grupo[tono] || grupo.Normal;
}
