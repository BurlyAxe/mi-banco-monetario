import Nivis from './Nivis.jsx';

export default function TarjetaConsejo({ consejo, etiqueta = 'NIVIS DICE', onOtro }) {
  return (
    <section className="consejo">
      <Nivis pose="tip" ancho={40} alto={40} className="consejo__cara" />

      <div className="consejo__cuerpo">
        <span className="consejo__etiqueta">{etiqueta}</span>
        <p className="consejo__texto">{consejo}</p>
        <button type="button" className="boton-suave boton-suave--claro" onClick={onOtro}>
          Otro consejo
        </button>
      </div>
    </section>
  );
}
