import React, { useState } from 'react';
import { IonCardData } from '../data/chemistryData';
import { IonMasteryStat, getMasteryLabel } from '../utils/storageManager';
import { IonSymbolDisplay } from './FormulaDisplay';
import { ElementSpiritSvg } from './ElementSpiritSvg';
import { Eye } from 'lucide-react';

interface IonCardComponentProps {
  card: IonCardData;
  stat?: IonMasteryStat;
  isSelected?: boolean;
  onSelect?: (card: IonCardData) => void;
  hideValenceByRule?: boolean;
  onPeekValence?: (ionId: string) => void;
  royalSkin?: boolean;
  compact?: boolean;
}

export const IonCardComponent: React.FC<IonCardComponentProps> = ({
  card,
  stat,
  isSelected = false,
  onSelect,
  hideValenceByRule = false,
  onPeekValence,
  royalSkin = false,
  compact = false,
}) => {
  const [peeked, setPeeked] = useState(false);
  const isCation = card.charge > 0;
  const effectiveHide = hideValenceByRule && !peeked;
  const masteryLevel = stat?.masteryLevel ?? 0;
  const successCount = stat?.successCount ?? 0;

  const handlePeek = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPeeked(true);
    if (onPeekValence) onPeekValence(card.id);
  };

  return (
    <div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={() => onSelect && onSelect(card)}
      onKeyDown={(e) => {
        if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect(card);
        }
      }}
      className={`group relative text-left rounded-xl transition-transform duration-150 select-none ${
        compact ? 'p-3' : 'p-3.5'
      } ${
        onSelect ? 'cursor-pointer hover:-translate-y-1 active:scale-[0.98]' : ''
      } ${
        isSelected
          ? isCation
            ? 'bg-sky-950/90 border-2 border-sky-400 shadow-lg shadow-sky-500/20'
            : 'bg-rose-950/90 border-2 border-rose-400 shadow-lg shadow-rose-500/20'
          : royalSkin
          ? 'bg-slate-900/95 border border-amber-400/60 hover:border-amber-300'
          : 'bg-slate-900/90 border border-slate-800 hover:border-slate-600'
      }`}
    >
      {/* Top Row: Ion Name & Charge Symbol */}
      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-bold text-slate-100 truncate">
            {card.name}
          </div>
          <div className="text-[11px] text-slate-400 truncate mt-0.5">
            {card.isPolyatomic ? '多原子離子（根）' : isCation ? '單原子陽離子' : '單原子陰離子'}
            <span aria-hidden="true"> · </span>
            <span>{card.cosmeticTier}</span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <IonSymbolDisplay
            baseFormula={card.baseFormula}
            charge={card.charge}
            hideCharge={effectiveHide}
            className="text-lg font-bold text-white"
          />
        </div>
      </div>

      {/* Center: Cute Element Spirit Illustration */}
      <div className={`flex items-center justify-center ${compact ? 'my-1.5' : 'my-2.5'} relative`}>
        <ElementSpiritSvg
          ionId={card.id}
          charge={card.charge}
          isPolyatomic={card.isPolyatomic}
          accentHex={card.accentHex}
          className={compact ? 'w-12 h-12' : 'w-16 h-16 group-hover:scale-105 transition-transform duration-150'}
        />

        {/* Charge readout or Active Recall Peek Button */}
        {effectiveHide ? (
          <button
            type="button"
            onClick={handlePeek}
            title="主動回憶中：點擊偷看價數"
            className="absolute bottom-0 right-0 px-2 py-0.5 text-[11px] font-medium bg-amber-500/20 hover:bg-amber-500/35 text-amber-200 border border-amber-400/40 rounded flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <Eye className="w-3 h-3" />
            <span>看價數</span>
          </button>
        ) : (
          <span
            className={`font-chem text-xs font-bold tabular-nums ${
              isCation ? 'text-sky-300' : 'text-rose-300'
            }`}
          >
            電荷 {isCation ? `+${card.charge}` : card.charge}
          </span>
        )}
      </div>

      {/* Bottom Metadata Line (Zero-Pill Unboxed Metadata with Separators) */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 tabular-nums">
        <span className="truncate">{ card.spiritName }</span>
        <span className="shrink-0 text-slate-300">
          {getMasteryLabel(masteryLevel)} · {successCount}次
        </span>
      </div>
    </div>
  );
};
