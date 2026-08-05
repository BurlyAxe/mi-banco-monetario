/**
 * Nivis, la mascota. Cuatro poses tomadas tal cual del proyecto de diseño:
 *   cara   → el logo del encabezado y de la pantalla de acceso
 *   tip    → la cara junto al consejo (traza más clara, sin orejas internas)
 *   cuerpo → el cuerpo completo, recostado junto a la dona
 *   asoma  → se asoma arriba de las barras, con animación
 */
export default function Nivis({ pose = 'cara', className, ancho = 34, alto = 34 }) {
  if (pose === 'cuerpo') {
    return (
      <svg viewBox="0 0 110 150" className={className} width={ancho} height={alto} aria-hidden="true">
        <ellipse cx="24" cy="104" rx="24" ry="15" fill="#FFFFFF" stroke="#C9D8E4" strokeWidth="2.5" transform="rotate(-24 24 104)" />
        <ellipse cx="14" cy="97" rx="9" ry="7" fill="#E4EFF7" transform="rotate(-24 14 97)" />
        <ellipse cx="62" cy="97" rx="26" ry="31" fill="#FFFFFF" stroke="#C9D8E4" strokeWidth="2.5" />
        <rect x="48" y="118" width="11" height="16" rx="5.5" fill="#FFFFFF" stroke="#C9D8E4" strokeWidth="2.5" />
        <rect x="68" y="118" width="11" height="16" rx="5.5" fill="#FFFFFF" stroke="#C9D8E4" strokeWidth="2.5" />
        <polygon points="42,50 48,22 62,42" fill="#FFFFFF" stroke="#C9D8E4" strokeWidth="2.5" strokeLinejoin="round" />
        <polygon points="86,50 80,22 66,42" fill="#FFFFFF" stroke="#C9D8E4" strokeWidth="2.5" strokeLinejoin="round" />
        <polygon points="47,46 49,29 57,42" fill="#D6E7F3" />
        <polygon points="81,46 79,29 71,42" fill="#D6E7F3" />
        <circle cx="64" cy="54" r="22" fill="#FFFFFF" stroke="#C9D8E4" strokeWidth="2.5" />
        <polygon points="54,64 74,64 64,79" fill="#FFFFFF" stroke="#C9D8E4" strokeWidth="2.5" strokeLinejoin="round" />
        <ellipse cx="55" cy="52" rx="3" ry="3.6" fill="#26313D" />
        <ellipse cx="73" cy="52" rx="3" ry="3.6" fill="#26313D" />
        <circle cx="64" cy="70" r="2.8" fill="#1F7FC4" />
      </svg>
    );
  }

  if (pose === 'asoma') {
    return (
      <svg viewBox="0 0 90 70" className={className} aria-hidden="true">
        <polygon points="26,34 32,8 46,26" fill="#FFFFFF" stroke="#C9D8E4" strokeWidth="2.5" strokeLinejoin="round" />
        <polygon points="66,34 60,8 46,26" fill="#FFFFFF" stroke="#C9D8E4" strokeWidth="2.5" strokeLinejoin="round" />
        <polygon points="31,31 33,15 41,26" fill="#D6E7F3" />
        <polygon points="61,31 59,15 51,26" fill="#D6E7F3" />
        <circle cx="46" cy="38" r="20" fill="#FFFFFF" stroke="#C9D8E4" strokeWidth="2.5" />
        <polygon points="37,47 55,47 46,61" fill="#FFFFFF" stroke="#C9D8E4" strokeWidth="2.5" strokeLinejoin="round" />
        <ellipse cx="38" cy="36" rx="2.8" ry="3.4" fill="#26313D" />
        <ellipse cx="54" cy="36" rx="2.8" ry="3.4" fill="#26313D" />
        <circle cx="46" cy="53" r="2.6" fill="#1F7FC4" />
        <circle cx="22" cy="60" r="6" fill="#FFFFFF" stroke="#C9D8E4" strokeWidth="2.5" />
        <circle cx="70" cy="60" r="6" fill="#FFFFFF" stroke="#C9D8E4" strokeWidth="2.5" />
      </svg>
    );
  }

  const traza = pose === 'tip' ? '#C3D5E3' : '#C9D8E4';

  return (
    <svg viewBox="0 0 64 64" className={className} width={ancho} height={alto} aria-hidden="true">
      <polygon points="13,28 19,7 33,21" fill="#FFFFFF" stroke={traza} strokeWidth="2" strokeLinejoin="round" />
      <polygon points="51,28 45,7 31,21" fill="#FFFFFF" stroke={traza} strokeWidth="2" strokeLinejoin="round" />
      {pose !== 'tip' && (
        <>
          <polygon points="18,24 20,13 27,21" fill="#D6E7F3" />
          <polygon points="46,24 44,13 37,21" fill="#D6E7F3" />
        </>
      )}
      <circle cx="32" cy="34" r="17" fill="#FFFFFF" stroke={traza} strokeWidth="2" />
      <polygon points="24,42 40,42 32,54" fill="#FFFFFF" stroke={traza} strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="25" cy="32" rx="2.6" ry="3" fill="#26313D" />
      <ellipse cx="39" cy="32" rx="2.6" ry="3" fill="#26313D" />
      <circle cx="32" cy="46" r="2.4" fill="#1F7FC4" />
    </svg>
  );
}
