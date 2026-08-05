import { ADVERTENCIA_BAJA, ASPECTO_CONFIANZA } from '../lib/ticket';

/**
 * Qué tan segura está la IA de lo que leyó, en una barra y una palabra.
 *
 * Es lo primero que ve el usuario al abrirse el formulario, y por eso está
 * arriba: le dice cuánta atención merece revisar antes de guardar. Cuando la
 * confianza es baja el aviso es explícito, porque ahí el riesgo real no es que
 * falte un dato sino que haya uno mal y se guarde sin que nadie lo note.
 */
export default function MedidorDeConfianza({ nivel, etiqueta }) {
  const aspecto = ASPECTO_CONFIANZA[nivel] || ASPECTO_CONFIANZA.baja;

  return (
    <div className={`confianza ${aspecto.clase}`}>
      <div className="confianza__cabecera">
        <span className="confianza__label">CONFIANZA DE LA LECTURA</span>
        <strong className="confianza__nivel">{etiqueta}</strong>
      </div>

      {/* Decorativo: el nivel ya va escrito ahí arriba, en texto. */}
      <div className="confianza__pista" aria-hidden="true">
        <div className="confianza__relleno" style={{ width: `${aspecto.llenado}%` }} />
      </div>

      {nivel === 'baja' && <p className="confianza__aviso">{ADVERTENCIA_BAJA}</p>}
    </div>
  );
}
