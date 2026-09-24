import React from 'react';

export interface BlueprintNorthGroupProps {
  x?: number;
  y?: number;
  scale?: number;
  className?: string;
  onClick?: () => void;
  title?: string;
}

/**
 * Native SVG group representing the authentic North architectural orientation
 * symbol directly from the original Preparatoria Regional de Chapala blueprint.
 */
export const BlueprintNorthGroup: React.FC<BlueprintNorthGroupProps> = ({
  x = 0,
  y = 0,
  scale = 1,
  className = '',
  onClick,
  title = 'Orientación Norte oficial del croquis de la escuela',
}) => {
  return (
    <g
      id="norte-oficial-croquis"
      transform={`translate(${x}, ${y}) scale(${scale})`}
      className={`select-none cursor-pointer transition-opacity ${className}`}
      onClick={onClick}
    >
      <title>{title}</title>
      <defs>
        {/* Shading gradient reproducing the architectural ink/wash style from the blueprint */}
        <linearGradient id="blueprint-north-shade" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="45%" stopColor="#334155" />
          <stop offset="85%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>

      {/* Stylized architectural teardrop/crescent pointer */}
      <path
        d="M -34 16
           C -27 5, -16 -16, 2 -24
           C 16 -30, 26 -20, 26 -6
           C 26 5, 20 18, 11 23
           A 16 16 0 0 1 -13 9
           L -34 16
           Z"
        fill="url(#blueprint-north-shade)"
        stroke="#0f172a"
        strokeWidth="0.8"
      />

      {/* Central blueprint circle */}
      <circle
        cx="0"
        cy="0"
        r="15"
        fill="#ffffff"
        stroke="#0f172a"
        strokeWidth="1.2"
      />

      {/* Crosshair Line 1: North Axis (tilted ~ -25° from vertical, pointing up-left) */}
      <line
        x1="12"
        y1="28"
        x2="-16"
        y2="-36"
        stroke="#0f172a"
        strokeWidth="1.3"
        strokeLinecap="round"
      />

      {/* Crosshair Line 2: Perpendicular axis passing through pointed tip */}
      <line
        x1="-35"
        y1="16"
        x2="28"
        y2="-13"
        stroke="#0f172a"
        strokeWidth="1.3"
        strokeLinecap="round"
      />

      {/* Authentic text "Norte" aligned with the architectural North axis */}
      <g transform="translate(14, -18) rotate(-65)">
        <text
          x="0"
          y="0"
          fontSize="10"
          fontWeight="800"
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="#0f172a"
          letterSpacing="0.4"
        >
          Norte
        </text>
      </g>
    </g>
  );
};
