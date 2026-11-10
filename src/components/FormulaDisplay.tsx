import React from 'react';

interface IonSymbolDisplayProps {
  baseFormula: string; // e.g., "SO4", "NH4", "Ca", "CH3COO", "HCO3"
  charge?: number; // e.g., +1, +2, -1, -2, -3
  hideCharge?: boolean; // when active recall hides the valence
  className?: string;
}

/**
 * Formats a base formula string (like "SO4", "CH3COO", "Al2(SO4)3", "(NH4)2CO3")
 * so all numbers after letters or closing parentheses become proper HTML <sub> tags.
 */
export function renderSubscriptedFormula(formula: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let i = 0;
  while (i < formula.length) {
    const ch = formula[i];
    if (ch >= '0' && ch <= '9') {
      let numStr = ch;
      while (i + 1 < formula.length && formula[i + 1] >= '0' && formula[i + 1] <= '9') {
        i++;
        numStr += formula[i];
      }
      parts.push(
        <sub key={`sub-${i}`} className="text-[0.72em] leading-none align-baseline relative -bottom-[0.18em] font-semibold">
          {numStr}
        </sub>
      );
    } else {
      let textStr = ch;
      while (
        i + 1 < formula.length &&
        !(formula[i + 1] >= '0' && formula[i + 1] <= '9')
      ) {
        i++;
        textStr += formula[i];
      }
      parts.push(<span key={`txt-${i}`}>{textStr}</span>);
    }
    i++;
  }
  return parts;
}

export function formatChargeSuperscript(charge: number): string {
  const abs = Math.abs(charge);
  const sign = charge > 0 ? '+' : '−';
  return abs === 1 ? sign : `${abs}${sign}`;
}

export const IonSymbolDisplay: React.FC<IonSymbolDisplayProps> = ({
  baseFormula,
  charge,
  hideCharge = false,
  className = '',
}) => {
  return (
    <span className={`font-chem inline-flex items-baseline tracking-tight ${className}`}>
      <span>{renderSubscriptedFormula(baseFormula)}</span>
      {charge !== undefined && (
        <sup
          className={`text-[0.66em] leading-none relative -top-[0.48em] ml-[1px] font-bold ${
            hideCharge
              ? 'text-amber-400 bg-amber-500/20 px-1 rounded'
              : charge > 0
              ? 'text-sky-300'
              : 'text-rose-300'
          }`}
        >
          {hideCharge ? '?' : formatChargeSuperscript(charge)}
        </sup>
      )}
    </span>
  );
};

interface CompoundFormulaDisplayProps {
  formula: string; // e.g., "Al2(SO4)3", "Ca(OH)2", "NaCl"
  className?: string;
}

export const CompoundFormulaDisplay: React.FC<CompoundFormulaDisplayProps> = ({
  formula,
  className = '',
}) => {
  return (
    <span className={`font-chem inline-flex items-baseline tracking-tight ${className}`}>
      {renderSubscriptedFormula(formula)}
    </span>
  );
};
