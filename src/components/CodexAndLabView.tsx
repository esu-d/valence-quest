import React, { useState, useMemo } from 'react';
import {
  ION_CARDS,
  VERIFIED_COMPOUNDS,
  IonCardData,
} from '../data/chemistryData';
import {
  LAB_COSMETICS,
  ACHIEVEMENTS_LIST,
  ALCHEMIST_TITLES,
  LabCosmeticItem,
} from '../data/chaptersData';
import {
  PlayerProgressState,
  calculateLevelInfo,
  getMasteryLabel,
} from '../utils/storageManager';
import { IonCardComponent } from './IonCardComponent';
import {
  IonSymbolDisplay,
  CompoundFormulaDisplay,
} from './FormulaDisplay';
import {
  Sparkles,
  Award,
  Check,
  Lock,
} from 'lucide-react';

interface CodexAndLabViewProps {
  progress: PlayerProgressState;
  initialSubTab?: 'ions' | 'compounds' | 'lab';
  onUnlockOrEquipCosmetic: (item: LabCosmeticItem) => void;
  onUpdatePlayerName: (newName: string) => void;
}

export const CodexAndLabView: React.FC<CodexAndLabViewProps> = ({
  progress,
  initialSubTab = 'ions',
  onUnlockOrEquipCosmetic,
  onUpdatePlayerName,
}) => {
  const [subTab, setSubTab] = useState<'ions' | 'compounds' | 'lab'>(initialSubTab);
  const [ionFilter, setIonFilter] = useState<string>('all');
  const [selectedCard, setSelectedCard] = useState<IonCardData>(ION_CARDS[0]);
  const [compoundFilter, setCompoundFilter] = useState<string>('all');
  const [editingName, setEditingName] = useState<string>(progress.playerName);

  const levelInfo = calculateLevelInfo(progress.xp);

  const filteredIons = useMemo(() => {
    return ION_CARDS.filter((c) => {
      if (ionFilter === 'all') return true;
      if (ionFilter === 'poly') return c.isPolyatomic;
      if (ionFilter === '+1') return c.charge === 1;
      if (ionFilter === '+2') return c.charge === 2;
      if (ionFilter === '+3') return c.charge === 3;
      if (ionFilter === '-1') return c.charge === -1;
      if (ionFilter === '-2') return c.charge === -2;
      if (ionFilter === '-3') return c.charge === -3;
      return true;
    });
  }, [ionFilter]);

  const filteredCompounds = useMemo(() => {
    return VERIFIED_COMPOUNDS.filter((comp) => {
      if (compoundFilter === 'all') return true;
      if (compoundFilter === 'unlocked') {
        return progress.discoveredCompounds.includes(comp.formula);
      }
      return comp.category === compoundFilter;
    });
  }, [compoundFilter, progress.discoveredCompounds]);

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setSubTab('ions')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'ions'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            離子精靈卡牌 ({ION_CARDS.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('compounds')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'compounds'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            化合物秘方錄 ({progress.discoveredCompounds.length}/{VERIFIED_COMPOUNDS.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('lab')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'lab'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            鍊金師養成與成就
          </button>
        </div>

        <div className="text-xs text-slate-400 font-chem tabular-nums">
          持有鍊金結晶：<span className="text-amber-300 font-bold">{progress.crystals}</span> · 總經驗值：<span className="text-sky-300 font-bold">{progress.xp} EXP</span>
        </div>
      </div>

      {/* TAB 1: Ion Cards Collection & Detailed Inspector */}
      {subTab === 'ions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 Cols: Filterable Ion Grid */}
          <div className="lg:col-span-8 bg-slate-900/85 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: '全部離子' },
                { id: '+1', label: '+1 價' },
                { id: '+2', label: '+2 價' },
                { id: '+3', label: '+3 價' },
                { id: '-1', label: '−1 價' },
                { id: '-2', label: '−2 價' },
                { id: '-3', label: '−3 價' },
                { id: 'poly', label: '原子團（根）' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setIonFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    ionFilter === tab.id
                      ? 'bg-sky-500 text-slate-950'
                      : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredIons.map((card) => (
                <IonCardComponent
                  key={card.id}
                  card={card}
                  stat={progress.ionStats[card.id]}
                  isSelected={selectedCard.id === card.id}
                  onSelect={(c) => setSelectedCard(c)}
                  royalSkin={progress.equippedCardSkin === 'skin-royal'}
                />
              ))}
            </div>
          </div>

          {/* Right 4 Cols: Selected Ion Spirit Detail & Chemistry Mnemonic */}
          <div className="lg:col-span-4 bg-slate-900/95 border border-slate-800 rounded-2xl p-6 space-y-5 sticky top-20">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="text-xs text-amber-300 font-semibold">
                  {selectedCard.spiritName} · 第 {selectedCard.unlockChapter} 章登場
                </div>
                <h3 className="text-2xl font-bold text-white mt-1">
                  {selectedCard.name}
                </h3>
                <div className="text-xs text-slate-400 mt-1">
                  {selectedCard.isPolyatomic ? '多原子離子（原子團）' : '單原子離子'} · 收藏分級：{selectedCard.cosmeticTier}
                </div>
              </div>
              <IonSymbolDisplay
                baseFormula={selectedCard.baseFormula}
                charge={selectedCard.charge}
                className="text-3xl font-bold text-white"
              />
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1.5">
                <div className="font-bold text-sky-300">理化性質與生活應用</div>
                <p className="text-slate-200">{selectedCard.chemistryNote}</p>
              </div>

              <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-4 space-y-1.5">
                <div className="font-bold text-amber-300">價數秒記口訣</div>
                <p className="text-slate-200">{selectedCard.mnemonicTip}</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between font-chem tabular-nums">
                <div>
                  <div className="text-slate-400">當前熟練度</div>
                  <div className="text-sm font-bold text-emerald-300 mt-0.5">
                    {getMasteryLabel(progress.ionStats[selectedCard.id]?.masteryLevel ?? 0)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400">累計成功合成</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {progress.ionStats[selectedCard.id]?.successCount ?? 0} 次
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Verified Compounds Encyclopedia */}
      {subTab === 'compounds' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">
                王國認證化合物秘方錄（國中理化常見化合物）
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                在「章節任務」或「自由鍊金探索」中成功合成過的化合物將自動登錄於此圖鑑。
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: '全部秘方' },
                { id: 'unlocked', label: '已合成解鎖' },
                { id: '鹽類', label: '鹽類' },
                { id: '氧化物', label: '氧化物' },
                { id: '鹼類', label: '鹼類' },
                { id: '酸類', label: '酸類' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setCompoundFilter(f.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    compoundFilter === f.id
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompounds.map((comp) => {
              const isUnlocked = progress.discoveredCompounds.includes(comp.formula);
              return (
                <div
                  key={comp.formula}
                  className={`rounded-xl p-4 border transition-colors ${
                    isUnlocked
                      ? 'bg-slate-950/90 border-emerald-700/50'
                      : 'bg-slate-950/50 border-slate-800/80 opacity-80'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div>
                      <div className="text-base font-bold text-white flex items-center gap-2">
                        <span>{comp.name}</span>
                        {isUnlocked && (
                          <span className="text-xs font-normal text-emerald-400">✓ 已登錄</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        分類：{comp.category}
                        {comp.commonName ? ` · 俗稱：${comp.commonName}` : ''}
                      </div>
                    </div>
                    <CompoundFormulaDisplay
                      formula={comp.formula}
                      className="text-xl font-bold text-amber-300 shrink-0"
                    />
                  </div>

                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    {comp.description}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400 font-chem tabular-nums">
                    <span>
                      組成：{comp.cationCount} 個 {comp.cationId} + {comp.anionCount} 個 {comp.anionId}
                    </span>
                    <span>
                      {comp.needsCationParens || comp.needsAnionParens ? '含原子團括號' : '無括號'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Alchemist Character Progression, Cosmetics & Achievements */}
      {subTab === 'lab' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 5 Cols: Alchemist Character & Level Ranks */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="text-xs text-amber-300 font-semibold">
                  當前稱號 · Lv.{levelInfo.level} {levelInfo.title}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => {
                      if (editingName.trim()) onUpdatePlayerName(editingName.trim());
                    }}
                    aria-label="鍊金師名稱"
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-base font-bold text-white w-44 focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-xs text-slate-400">（可點擊修改名字）</span>
                </div>
              </div>
              <div className="text-right font-chem tabular-nums">
                <div className="text-xs text-slate-400">戰鬥最大生命</div>
                <div className="text-lg font-bold text-emerald-400">
                  HP {levelInfo.maxHp}
                </div>
              </div>
            </div>

            {/* Level Progression Ladder */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-300">
                鍊金師階級成長路線（隨學習進度自動晉升）
              </div>
              {ALCHEMIST_TITLES.map((rank) => {
                const reached = levelInfo.level >= rank.level;
                return (
                  <div
                    key={rank.level}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                      reached
                        ? 'bg-slate-950 border-amber-500/40 text-slate-100'
                        : 'bg-slate-950/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div>
                      <div className="font-bold">
                        Lv.{rank.level} · {rank.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {rank.perkDescription}
                      </div>
                    </div>
                    <span className="font-chem font-semibold shrink-0">
                      {reached ? '已達成' : `需 ${(rank.level - 1) * 250} EXP`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 7 Cols: Lab Cosmetics & Learning Achievements */}
          <div className="lg:col-span-7 space-y-6">
            {/* Lab Customization */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>鍊金實驗室裝飾與卡牌塗裝</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    透過完成化學合成獲得「鍊金結晶」即可兌換外觀，無任何隨機抽卡或付費機制。
                  </p>
                </div>
                <div className="text-xs font-chem font-bold text-amber-300 tabular-nums">
                  持有結晶：{progress.crystals}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LAB_COSMETICS.map((item) => {
                  const isUnlocked = progress.unlockedCosmetics.includes(item.id);
                  const isEquipped =
                    progress.equippedCrucible === item.id ||
                    progress.equippedCardSkin === item.id;
                  const levelMet = levelInfo.level >= item.unlockLevel;
                  const canAfford = progress.crystals >= item.crystalCost;

                  return (
                    <div
                      key={item.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white">
                            {item.name}
                          </span>
                          <span
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: item.previewHex }}
                          />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                        <span className="text-[11px] text-slate-400 font-chem tabular-nums">
                          需要 Lv.{item.unlockLevel} · {item.crystalCost} 結晶
                        </span>

                        {isUnlocked ? (
                          <button
                            type="button"
                            onClick={() => onUnlockOrEquipCosmetic(item)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 whitespace-nowrap shrink-0 ${
                              isEquipped
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            }`}
                          >
                            {isEquipped ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>使用中</span>
                              </>
                            ) : (
                              <span>裝備外觀</span>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!levelMet || !canAfford}
                            onClick={() => onUnlockOrEquipCosmetic(item)}
                            className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 flex items-center gap-1 whitespace-nowrap shrink-0"
                          >
                            {!levelMet ? (
                              <>
                                <Lock className="w-3 h-3" />
                                <span>等級不足</span>
                              </>
                            ) : (
                              <span>兌換解鎖</span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Achievements List */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-sky-400" />
                <span>王國鍊金成就（知識里程碑）</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ACHIEVEMENTS_LIST.map((ach) => {
                  const unlocked = progress.unlockedAchievements.includes(ach.id);
                  return (
                    <div
                      key={ach.id}
                      className={`p-3.5 rounded-xl border ${
                        unlocked
                          ? 'bg-slate-950 border-sky-500/50'
                          : 'bg-slate-950/40 border-slate-800/80 opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{ach.title}</span>
                        <span
                          className={`font-chem font-semibold tabular-nums ${
                            unlocked ? 'text-emerald-400' : 'text-slate-500'
                          }`}
                        >
                          {unlocked ? '✓ 已達成' : `+${ach.xpBonus} EXP`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1">
                        {ach.description}
                      </p>
                      <div className="text-[11px] text-slate-400 mt-1.5">
                        條件：{ach.requirementText}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
