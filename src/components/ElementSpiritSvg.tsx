import React from 'react';

interface ElementSpiritSvgProps {
  ionId: string;
  charge: number;
  isPolyatomic: boolean;
  accentHex: string;
  className?: string;
}

/**
 * Hand-crafted cute Japanese fantasy Elemental Spirit illustrations for each ion card.
 */
export const ElementSpiritSvg: React.FC<ElementSpiritSvgProps> = ({
  ionId,
  charge,
  isPolyatomic,
  accentHex,
  className = 'w-16 h-16',
}) => {
  const absCharge = Math.abs(charge);
  const isCation = charge > 0;

  // Deterministic variation by ionId
  const seed = ionId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const earStyle = seed % 3; // 0: crystal horns, 1: fluffy alchemical ears, 2: crown wings
  const eyeStyle = (seed >> 1) % 3;

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`glow-${ionId}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accentHex} stopOpacity="0.45" />
          <stop offset="100%" stopColor={accentHex} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`body-${ionId}`} x1="20" y1="20" x2="80" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={accentHex} />
          <stop offset="100%" stopColor={isCation ? '#1e3a8a' : '#4c1d95'} />
        </linearGradient>
      </defs>

      {/* Magical Aura */}
      <circle cx="50" cy="52" r="42" fill={`url(#glow-${ionId})`} />

      {/* Polyatomic Orbital Ring for Radical Ions (原子團專屬星環) */}
      {isPolyatomic && (
        <ellipse
          cx="50"
          cy="56"
          rx="41"
          ry="14"
          transform="rotate(-16 50 56)"
          stroke={accentHex}
          strokeWidth="2"
          strokeDasharray="5 3"
          opacity="0.85"
        />
      )}

      {/* Charge Orbiting Stars / Crystals */}
      {Array.from({ length: absCharge }).map((_, idx) => {
        const angle = (idx * (360 / absCharge) - 90) * (Math.PI / 180);
        const cx = 50 + Math.cos(angle) * 36;
        const cy = 46 + Math.sin(angle) * 32;
        return (
          <g key={idx}>
            <circle cx={cx} cy={cy} r="5.5" fill={isCation ? '#38bdf8' : '#fb7185'} stroke="#fff" strokeWidth="1.2" />
            {isCation ? (
              <path
                d={`M${cx - 2.5} ${cy}H${cx + 2.5}M${cx} ${cy - 2.5}V${cy + 2.5}`}
                stroke="#0f172a"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            ) : (
              <path
                d={`M${cx - 2.5} ${cy}H${cx + 2.5}`}
                stroke="#0f172a"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            )}
          </g>
        );
      })}

      {/* Ears / Horns */}
      {earStyle === 0 && (
        <>
          <polygon points="28,34 20,14 38,26" fill={accentHex} stroke="#f8fafc" strokeWidth="1.5" />
          <polygon points="72,34 80,14 62,26" fill={accentHex} stroke="#f8fafc" strokeWidth="1.5" />
        </>
      )}
      {earStyle === 1 && (
        <>
          <ellipse cx="27" cy="28" rx="8" ry="14" transform="rotate(-25 27 28)" fill={`url(#body-${ionId})`} stroke="#f8fafc" strokeWidth="1.5" />
          <ellipse cx="73" cy="28" rx="8" ry="14" transform="rotate(25 73 28)" fill={`url(#body-${ionId})`} stroke="#f8fafc" strokeWidth="1.5" />
        </>
      )}
      {earStyle === 2 && (
        <polygon points="50,11 42,27 58,27" fill="#fbbf24" stroke="#fff" strokeWidth="1.5" />
      )}

      {/* Main Spirit Body (Slime / Crystal Sprite) */}
      {isCation ? (
        <path
          d="M24 58 C24 34, 35 25, 50 25 C65 25, 76 34, 76 58 C76 74, 66 82, 50 82 C34 82, 24 74, 24 58 Z"
          fill={`url(#body-${ionId})`}
          stroke="#f8fafc"
          strokeWidth="2.2"
        />
      ) : (
        <polygon
          points="50,22 76,40 70,76 30,76 24,40"
          fill={`url(#body-${ionId})`}
          stroke="#f8fafc"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      )}

      {/* Gloss Highlight */}
      <ellipse cx="39" cy="37" rx="7" ry="3.8" transform="rotate(-20 39 37)" fill="#ffffff" fillOpacity="0.45" />

      {/* Eyes */}
      {eyeStyle === 0 ? (
        <>
          <circle cx="39" cy="53" r="4.5" fill="#0f172a" />
          <circle cx="61" cy="53" r="4.5" fill="#0f172a" />
          <circle cx="37.5" cy="51.5" r="1.7" fill="#ffffff" />
          <circle cx="59.5" cy="51.5" r="1.7" fill="#ffffff" />
        </>
      ) : eyeStyle === 1 ? (
        <>
          <ellipse cx="39" cy="53" rx="4" ry="5.2" fill="#0f172a" />
          <ellipse cx="61" cy="53" rx="4" ry="5.2" fill="#0f172a" />
          <circle cx="38" cy="51" r="1.8" fill="#fef08a" />
          <circle cx="60" cy="51" r="1.8" fill="#fef08a" />
        </>
      ) : (
        <>
          <path d="M34 53 Q39 48 44 53" stroke="#0f172a" strokeWidth="2.8" strokeLinecap="round" />
          <circle cx="61" cy="53" r="4.5" fill="#0f172a" />
          <circle cx="59.5" cy="51.5" r="1.7" fill="#ffffff" />
        </>
      )}

      {/* Cute Cheeks & Smile */}
      <ellipse cx="32" cy="59" rx="3.5" ry="2" fill="#fb7185" fillOpacity="0.65" />
      <ellipse cx="68" cy="59" rx="3.5" ry="2" fill="#fb7185" fillOpacity="0.65" />
      <path d="M45 60 Q50 65 55 60" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </svg>
  );
};
