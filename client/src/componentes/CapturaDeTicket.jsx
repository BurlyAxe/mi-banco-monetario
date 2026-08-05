import { useRef } from 'react';
import { TIPOS_ACEPTADOS } from '../lib/ticket';

const CONSEJOS = [
  'Apoya el ticket en una superficie plana y estíralo.',
  'Que se vea completo, sobre todo la línea del TOTAL.',
  'Busca luz pareja: sin sombras encima ni flash quemado.',
];

/**
 * Elegir la foto: tomarla o sacarla de la galería.
 *
 * Son dos inputs escondidos y dos botones de verdad. El input de archivo nativo
 * no se puede estilizar y en el celular se ve fuera de lugar; lo que sí se
 * puede es dispararlo desde un botón que sí encaja con el resto de la app.
 *
 * `capture="environment"` es lo que abre la cámara trasera directo en vez del
 * selector. En escritorio el navegador lo ignora y abre el explorador de
 * archivos, que es exactamente lo que ahí tiene sentido.
 */
export default function CapturaDeTicket({ onElegir }) {
  const camara = useRef(null);
  const galeria = useRef(null);

  const alElegir = (evento) => {
    const archivo = evento.target.files?.[0];
    // Se limpia el input para que elegir DOS VECES la misma foto vuelva a
    // disparar el evento: sin esto, reintentar con el mismo archivo no hace nada.
    evento.target.value = '';
    if (archivo) onElegir(archivo);
  };

  return (
    <div className="ticket-captura">
      <p className="ticket-captura__intro">
        Toma una foto del ticket y la IA rellena el gasto por ti. Tú lo revisas y decides si se
        guarda: nada se registra solo.
      </p>

      <div className="ticket-captura__botones">
        <button type="button" className="boton-primario" onClick={() => camara.current.click()}>
          Tomar fotografía
        </button>
        <button type="button" className="boton-suave" onClick={() => galeria.current.click()}>
          Elegir una imagen
        </button>
      </div>

      <ul className="ticket-consejos">
        {CONSEJOS.map((consejo) => (
          <li key={consejo}>{consejo}</li>
        ))}
      </ul>

      <input
        ref={camara}
        type="file"
        accept="image/*"
        capture="environment"
        className="oculto"
        onChange={alElegir}
        tabIndex={-1}
        aria-hidden="true"
      />
      <input
        ref={galeria}
        type="file"
        accept={TIPOS_ACEPTADOS}
        className="oculto"
        onChange={alElegir}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
