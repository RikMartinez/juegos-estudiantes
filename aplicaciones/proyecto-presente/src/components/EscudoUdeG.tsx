import React from 'react';
import { ESCUDO_UDEG_DATA_URI } from '../assets/escudoDataUri';

export interface EscudoUdeGProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  alt?: string;
  onClick?: () => void;
}

export interface EscudoUdeGGroupProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  transform?: string;
  onClick?: () => void;
}

/**
 * Native SVG element for embedding the official Wikipedia/UdeG Coat of Arms
 * directly into SVG drawings (such as the campus map) with crisp vector rendering.
 */
export const EscudoUdeGGroup: React.FC<EscudoUdeGGroupProps> = ({
  x = 0,
  y = 0,
  width = 82,
  height = 111,
  transform = '',
  onClick,
}) => {
  return (
    <g id="escudo-oficial-udeg" transform={transform} onClick={onClick}>
      <image
        href={ESCUDO_UDEG_DATA_URI}
        xlinkHref={ESCUDO_UDEG_DATA_URI}
        x={x}
        y={y}
        width={width}
        height={height}
        preserveAspectRatio="xMidYMid meet"
      />
    </g>
  );
};

/**
 * Standard HTML <img> component for embedding the official Wikipedia/UdeG Coat of Arms
 * in headers, modals, cards, and print reports.
 */
export const EscudoUdeG: React.FC<EscudoUdeGProps> = ({
  width = 65,
  height = 88,
  className = '',
  alt = 'Escudo Oficial de la Universidad de Guadalajara',
  onClick,
}) => {
  return (
    <img
      src={ESCUDO_UDEG_DATA_URI}
      alt={alt}
      width={width}
      height={height}
      className={`inline-block object-contain select-none ${className}`}
      onClick={onClick}
      loading="eager"
    />
  );
};
