/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { CHAPTERS_DATA, ACHIEVEMENTS_LIST, LabCosmeticItem } from './data/chaptersData';
import { VerifiedCompound } from './data/chemistryData';
import { SynthesisEvaluation } from './utils/chemistryEngine';
import {
  PlayerProgressState,
  loadPlayerProgress,
  savePlayerProgress,
  createInitialProgress,
  calculateLevelInfo,
  computeMasteryLevel,
  generateFreshDailyQuests,
} from './utils/storageManager';
import { sfx } from './utils/soundEffects';
import { AdventureWorldMap } from './components/AdventureWorldMap';
import { CrucibleWorkshop } from './components/CrucibleWorkshop';
import { BossBattleArena } from './components/BossBattleArena';
import { CodexAndLabView } from './components/CodexAndLabView';
import { ReviewAndTeacherView } from './components/ReviewAndTeacherView';
import { CompoundFormulaDisplay, IonSymbolDisplay } from './components/FormulaDisplay';
import {
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

type ActiveView = 'TITLE' | 'MAP' | 'WORKSHOP' | 'BOSS' | 'CODEX' | 'REVIEW';

export default function App() {
  const [progress, setProgress] = useState<PlayerProgressState>(() => loadPlayerProgress());
  const [activeView, setActiveView] = useState<ActiveView>('TITLE');
  const [selectedChapterId, setSelectedChapterId] = useState<number>(1);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [spacedReviewIonIds, setSpacedReviewIonIds] = useState<string[] | null>(null);
  const [heroImgBroken, setHeroImgBroken] = useState<boolean>(false);
  const [confirmResetModal, setConfirmResetModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync audio mute & save progress to localStorage
  useEffect(() => {
    sfx.muted = progress.settings.soundMuted;
    savePlayerProgress(progress);
  }, [progress]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3400);
  }, []);

  // Keyboard shortcuts for Title Screen & Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeView === 'TITLE' && (e.key === 'Enter' || e.key === ' ')) {
        if (document.activeElement?.tagName !== 'BUTTON') {
          e.preventDefault();
          setActiveView('MAP');
        }
      } else if (e.key === 'Escape' && activeView !== 'TITLE' && activeView !== 'MAP') {
        setActiveView('MAP');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeView]);

  const currentChapter =
    CHAPTERS_DATA.find((c) => c.id === selectedChapterId) || CHAPTERS_DATA[0];
  const levelInfo = calculateLevelInfo(progress.xp);

  // Evaluate and award newly unlocked achievements
  const checkAndUnlockAchievements = useCallback(
    (nextState: PlayerProgressState): PlayerProgressState => {
      const newlyUnlocked: string[] = [];
      let bonusXp = 0;

      const check = (id: string, condition: boolean) => {
        if (condition && !nextState.unlockedAchievements.includes(id)) {
          newlyUnlocked.push(id);
          const ach = ACHIEVEMENTS_LIST.find((a) => a.id === id);
          if (ach) bonusXp += ach.xpBonus;
        }
      };

      check('ach-first-synth', nextState.totalSynthSuccessCount >= 1);
      check(
        'ach-cross-valence',
        nextState.discoveredCompounds.some((f) =>
          ['Al2O3', 'Fe2O3', 'Al2(SO4)3', 'Fe2(SO4)3', 'Ca3(PO4)2'].includes(f)
        )
      );
      check('ach-paren-pro', nextState.parenSynthSuccessCount >= 5);
      check('ach-memory-recall', nextState.blindSynthSuccessCount >= 5);
      check('ach-boss-slayer', nextState.defeatedBosses.length >= 1);
      check(
        'ach-collector',
        Object.values(nextState.ionStats).filter((s) => s.masteryLevel >= 1).length >= 10
      );

      if (newlyUnlocked.length > 0) {
        const firstAch = ACHIEVEMENTS_LIST.find((a) => a.id === newlyUnlocked[0]);
        if (firstAch) {
          showToast(`達成成就：「${firstAch.title}」(+${bonusXp} EXP)`);
        }
        return {
          ...nextState,
          xp: nextState.xp + bonusXp,
          unlockedAchievements: [...nextState.unlockedAchievements, ...newlyUnlocked],
        };
      }
      return nextState;
    },
    [showToast]
  );

  // Record a successful compound synthesis
  const handleSynthesisSuccess = (
    compound: VerifiedCompound,
    challengeId: string | null,
    usedPeekOrHint: boolean,
    wasHiddenValence: boolean
  ) => {
    setProgress((prev) => {
      const oldLevel = calculateLevelInfo(prev.xp).level;

      // Update Cation & Anion Mastery
      const cOld = prev.ionStats[compound.cationId] || {
        ionId: compound.cationId,
        successCount: 0,
        mistakeCount: 0,
        masteryLevel: 0,
        lastPracticedAt: 0,
        needsSpacedReview: false,
      };
      const aOld = prev.ionStats[compound.anionId] || {
        ionId: compound.anionId,
        successCount: 0,
        mistakeCount: 0,
        masteryLevel: 0,
        lastPracticedAt: 0,
        needsSpacedReview: false,
      };

      const nextIonStats = {
        ...prev.ionStats,
        [compound.cationId]: {
          ...cOld,
          successCount: cOld.successCount + 1,
          masteryLevel: computeMasteryLevel(cOld.successCount + 1),
          lastPracticedAt: Date.now(),
          needsSpacedReview: false,
        },
        [compound.anionId]: {
          ...aOld,
          successCount: aOld.successCount + 1,
          masteryLevel: computeMasteryLevel(aOld.successCount + 1),
          lastPracticedAt: Date.now(),
          needsSpacedReview: false,
        },
      };

      const isFirstChallengeClear =
        challengeId && !prev.completedChallenges.includes(challengeId);
      const baseXp = isFirstChallengeClear ? 90 : 45;
      const bonusMultiplier = wasHiddenValence ? 1.25 : 1.0;
      const earnedXp = Math.round(baseXp * bonusMultiplier);
      const earnedCrystals = isFirstChallengeClear ? 35 : 15;

      const hasPolyatomic =
        compound.needsCationParens ||
        compound.needsAnionParens ||
        ['OH-', 'NO3-', 'HCO3-', 'SO42-', 'CO32-', 'PO43-', 'NH4+'].includes(
          compound.cationId
        ) ||
        ['OH-', 'NO3-', 'HCO3-', 'SO42-', 'CO32-', 'PO43-', 'NH4+'].includes(
          compound.anionId
        );

      const updatedDaily = prev.dailyQuests.map((dq) => {
        if (dq.claimed) return dq;
        if (dq.type === 'synthesize_any') {
          return { ...dq, currentCount: Math.min(dq.targetCount, dq.currentCount + 1) };
        }
        if (dq.type === 'polyatomic_synth' && hasPolyatomic) {
          return { ...dq, currentCount: Math.min(dq.targetCount, dq.currentCount + 1) };
        }
        if (dq.type === 'no_hint_synth' && !usedPeekOrHint) {
          return { ...dq, currentCount: Math.min(dq.targetCount, dq.currentCount + 1) };
        }
        return dq;
      });

      const nextState: PlayerProgressState = {
        ...prev,
        xp: prev.xp + earnedXp,
        crystals: prev.crystals + earnedCrystals,
        completedChallenges:
          challengeId && !prev.completedChallenges.includes(challengeId)
            ? [...prev.completedChallenges, challengeId]
            : prev.completedChallenges,
        discoveredCompounds: prev.discoveredCompounds.includes(compound.formula)
          ? prev.discoveredCompounds
          : [...prev.discoveredCompounds, compound.formula],
        ionStats: nextIonStats,
        blindSynthSuccessCount: wasHiddenValence
          ? prev.blindSynthSuccessCount + 1
          : prev.blindSynthSuccessCount,
        parenSynthSuccessCount:
          compound.needsCationParens || compound.needsAnionParens
            ? prev.parenSynthSuccessCount + 1
            : prev.parenSynthSuccessCount,
        totalSynthSuccessCount: prev.totalSynthSuccessCount + 1,
        totalAttemptsCount: prev.totalAttemptsCount + 1,
        recentAccuracyWindow: [...prev.recentAccuracyWindow.slice(-9), true],
        dailyQuests: updatedDaily,
      };

      const finalState = checkAndUnlockAchievements(nextState);
      const newLevel = calculateLevelInfo(finalState.xp).level;
      if (newLevel > oldLevel) {
        sfx.playLevelUp();
        showToast(
          `恭喜升級！晉升為 Lv.${newLevel}「${calculateLevelInfo(finalState.xp).title}」！`
        );
      }

      return finalState;
    });
  };

  // Record a synthesis mistake for spaced repetition & formative analytics
  const handleSynthesisMistake = (
    evalResult: SynthesisEvaluation,
    targetFormula?: string
  ) => {
    if (!evalResult.cation || !evalResult.anion || !evalResult.mistakeType) return;
    const cationId = evalResult.cation.id;
    const anionId = evalResult.anion.id;
    const mType = evalResult.mistakeType;

    setProgress((prev) => {
      const cOld = prev.ionStats[cationId];
      const aOld = prev.ionStats[anionId];

      const nextIonStats = {
        ...prev.ionStats,
        [cationId]: cOld
          ? { ...cOld, mistakeCount: cOld.mistakeCount + 1, needsSpacedReview: true }
          : prev.ionStats[cationId],
        [anionId]: aOld
          ? { ...aOld, mistakeCount: aOld.mistakeCount + 1, needsSpacedReview: true }
          : prev.ionStats[anionId],
      };

      const newLog = {
        id: `err-${Date.now()}`,
        timestamp: Date.now(),
        cationId,
        anionId,
        attemptedFormula: evalResult.constructedFormula,
        targetFormula,
        mistakeType: mType,
        diagnosticText: `${evalResult.feedbackTitle}：${evalResult.feedbackMessage}`,
        resolved: false,
      };

      return {
        ...prev,
        ionStats: nextIonStats,
        mistakeLogs: [newLog, ...prev.mistakeLogs.slice(0, 29)],
        totalAttemptsCount: prev.totalAttemptsCount + 1,
        recentAccuracyWindow: [...prev.recentAccuracyWindow.slice(-9), false],
      };
    });
  };

  const handleBossDefeated = (
    bossId: string,
    xpReward: number,
    crystalReward: number
  ) => {
    setProgress((prev) => {
      const oldLevel = calculateLevelInfo(prev.xp).level;
      const nextState: PlayerProgressState = {
        ...prev,
        xp: prev.xp + xpReward,
        crystals: prev.crystals + crystalReward,
        defeatedBosses: prev.defeatedBosses.includes(bossId)
          ? prev.defeatedBosses
          : [...prev.defeatedBosses, bossId],
      };
      const finalState = checkAndUnlockAchievements(nextState);
      const newLevel = calculateLevelInfo(finalState.xp).level;
      if (newLevel > oldLevel) {
        showToast(
          `恭喜升級！晉升為 Lv.${newLevel}「${calculateLevelInfo(finalState.xp).title}」！`
        );
      }
      return finalState;
    });
  };

  const handleClaimDailyQuest = (questId: string) => {
    sfx.playSynthesisSuccess();
    setProgress((prev) => {
      const target = prev.dailyQuests.find((q) => q.id === questId);
      if (!target || target.claimed) return prev;
      return {
        ...prev,
        xp: prev.xp + target.xpReward,
        crystals: prev.crystals + target.crystalReward,
        dailyQuests: prev.dailyQuests.map((q) =>
          q.id === questId ? { ...q, claimed: true } : q
        ),
      };
    });
  };

  const handleUnlockOrEquipCosmetic = (item: LabCosmeticItem) => {
    sfx.playCardTap(1);
    setProgress((prev) => {
      const alreadyUnlocked = prev.unlockedCosmetics.includes(item.id);
      if (alreadyUnlocked) {
        return {
          ...prev,
          equippedCrucible:
            item.category === 'crucible' ? item.id : prev.equippedCrucible,
          equippedCardSkin:
            item.category === 'cardSkin'
              ? prev.equippedCardSkin === item.id
                ? 'default'
                : item.id
              : prev.equippedCardSkin,
        };
      }
      if (prev.crystals < item.crystalCost) return prev;
      showToast(`成功解鎖並裝備：「${item.name}」！`);
      return {
        ...prev,
        crystals: prev.crystals - item.crystalCost,
        unlockedCosmetics: [...prev.unlockedCosmetics, item.id],
        equippedCrucible:
          item.category === 'crucible' ? item.id : prev.equippedCrucible,
        equippedCardSkin:
          item.category === 'cardSkin' ? item.id : prev.equippedCardSkin,
      };
    });
  };

  const handleResetNewGame = () => {
    const fresh = createInitialProgress();
    setProgress(fresh);
    savePlayerProgress(fresh);
    setConfirmResetModal(false);
    setSelectedChapterId(1);
    setActiveView('MAP');
    showToast('已開始全新冒險旅程！');
  };

  // ============================================================================
  // VIEW 1: FULL-VIEWPORT GAME TITLE SCREEN (遊戲首頁)
  // ============================================================================
  if (activeView === 'TITLE') {
    return (
      <div
        className={`relative min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden ${
          progress.settings.reduceMotion ? 'reduce-motion' : ''
        }`}
      >
        {/* Background Layer with Generated Alchemy Lab Art + Measured Contrast Scrim */}
        <div className="absolute inset-0 z-0">
          {!heroImgBroken ? (
            <img
              src="/src/assets/images/alchemy_lab_hero_bg_1794327719790.jpg"
              alt="價數鍊金師魔法實驗室背景"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgBroken(true)}
              className="w-full h-full object-cover opacity-55 scale-105 transition-transform duration-1000"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/45" />
        </div>

        {/* Top Perimeter Bar on Title Screen */}
        <div className="relative z-10 max-w-7xl w-full mx-auto px-6 py-5 flex items-center justify-between">
          <div className="text-xs font-chem text-slate-300 tabular-nums">
            台灣國中理化（八、九年級）離子價數與化學式冒險遊戲
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setProgress((p) => ({
                  ...p,
                  settings: { ...p.settings, soundMuted: !p.settings.soundMuted },
                }))
              }
              className="px-3 py-1.5 text-xs font-medium bg-slate-900/85 hover:bg-slate-800 border border-slate-700 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              {progress.settings.soundMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  <span>音效已關閉</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>音效開啟</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setProgress((p) => ({
                  ...p,
                  settings: { ...p.settings, reduceMotion: !p.settings.reduceMotion },
                }))
              }
              className="px-3 py-1.5 text-xs font-medium bg-slate-900/85 hover:bg-slate-800 border border-slate-700 rounded-lg whitespace-nowrap shrink-0"
            >
              {progress.settings.reduceMotion ? '已減少動畫' : '標準動畫'}
            </button>
          </div>
        </div>

        {/* Center Hero Lockup with Bespoke Inline SVG Emblem */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-8 text-center space-y-6 my-auto">
          {/* Bespoke Alchemical Balance SVG Crest */}
          <div className="flex justify-center">
            <svg
              viewBox="0 0 180 76"
              className="w-40 h-16 animate-float-slow"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle cx="90" cy="38" r="32" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 3" />
              <polygon points="90,10 116,54 64,54" stroke="#38bdf8" strokeWidth="2" fill="#0f172a" fillOpacity="0.6" />
              <polygon points="90,66 116,22 64,22" stroke="#fb7185" strokeWidth="2" fill="none" />
              <circle cx="40" cy="38" r="12" fill="#0284c7" fillOpacity="0.3" stroke="#38bdf8" strokeWidth="2" />
              <text x="40" y="42" textAnchor="middle" fill="#e0f2fe" fontSize="11" fontWeight="bold" fontFamily="monospace">+2</text>
              <circle cx="140" cy="38" r="12" fill="#e11d48" fillOpacity="0.3" stroke="#fb7185" strokeWidth="2" />
              <text x="140" y="42" textAnchor="middle" fill="#ffe4e6" fontSize="11" fontWeight="bold" fontFamily="monospace">−2</text>
              <circle cx="90" cy="38" r="7" fill="#fbbf24" />
            </svg>
          </div>

          <div className="space-y-3">
            <div className="text-xs sm:text-sm font-semibold text-amber-300 tracking-wide">
              元素卡牌收集 · 電荷平衡合成 · 回合制弱點戰鬥
            </div>
            <h1
              className="font-display font-bold text-white tracking-tight"
              style={{ fontSize: 'clamp(2.25rem, 5vw, 4rem)', textWrap: 'balance' }}
            >
              價數鍊金師：元素王國
            </h1>
            <p className="text-sm sm:text-base text-slate-200 max-w-2xl mx-auto leading-relaxed">
              化身為王國見習鍊金師，召喚 22 位正負離子精靈，在黃金天平坩堝中調合出電中性的純淨化合物結晶，擊破五大區域的元素魔王！
            </p>
          </div>

          {/* Interactive Formula Preview Showcase Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto pt-2">
            <div className="bg-slate-900/85 border border-slate-800 rounded-xl p-3 text-center">
              <div className="text-[11px] text-slate-400">單價電荷平衡 (1 : 1)</div>
              <div className="mt-1 flex items-center justify-center gap-1.5 text-sm font-bold text-white">
                <IonSymbolDisplay baseFormula="Na" charge={1} />
                <span>+</span>
                <IonSymbolDisplay baseFormula="Cl" charge={-1} />
                <span>→</span>
                <CompoundFormulaDisplay formula="NaCl" className="text-amber-300" />
              </div>
            </div>

            <div className="bg-slate-900/85 border border-slate-800 rounded-xl p-3 text-center">
              <div className="text-[11px] text-slate-400">原子團括號鐵則 (1 : 2)</div>
              <div className="mt-1 flex items-center justify-center gap-1.5 text-sm font-bold text-white">
                <IonSymbolDisplay baseFormula="Ca" charge={2} />
                <span>+ 2</span>
                <IonSymbolDisplay baseFormula="OH" charge={-1} />
                <span>→</span>
                <CompoundFormulaDisplay formula="Ca(OH)2" className="text-emerald-300" />
              </div>
            </div>

            <div className="bg-slate-900/85 border border-slate-800 rounded-xl p-3 text-center">
              <div className="text-[11px] text-slate-400">最小公倍數交叉 (2 : 3)</div>
              <div className="mt-1 flex items-center justify-center gap-1.5 text-sm font-bold text-white">
                <span>2</span>
                <IonSymbolDisplay baseFormula="Al" charge={3} />
                <span>+ 3</span>
                <IonSymbolDisplay baseFormula="SO4" charge={-2} />
                <span>→</span>
                <CompoundFormulaDisplay formula="Al2(SO4)3" className="text-sky-300" />
              </div>
            </div>
          </div>

          {/* Primary Start Game CTA & New Game Option */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                sfx.playSynthesisSuccess();
                setActiveView('MAP');
              }}
              className="px-8 py-4 rounded-xl font-bold text-base text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-xl shadow-amber-500/25 flex items-center gap-2.5 transition-transform active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>
                {progress.totalSynthSuccessCount > 0
                  ? `繼續冒險（Lv.${levelInfo.level} ${levelInfo.title}）`
                  : '開始新冒險（進入元素王國）'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                sfx.playCardTap(1);
                setSelectedChapterId(1);
                setSelectedChallengeId('ch1-q1');
                setActiveView('WORKSHOP');
              }}
              className="px-5 py-4 rounded-xl font-bold text-sm text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700 flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>立即試玩第一關合成</span>
            </button>

            {progress.totalSynthSuccessCount > 0 && (
              <button
                type="button"
                onClick={() => setConfirmResetModal(true)}
                className="px-4 py-4 rounded-xl font-semibold text-xs text-slate-300 hover:text-white bg-slate-900/70 hover:bg-slate-900 border border-slate-800 flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重開新局</span>
              </button>
            )}
          </div>
        </div>

        {/* Single Flat Control-Hint Line at Bottom */}
        <div className="relative z-10 max-w-7xl w-full mx-auto px-6 py-4 text-center text-xs text-slate-400 font-chem">
          操作提示：Enter / Space 開始遊戲 · 點擊卡牌投入坩堝 · 調整正負離子數量使淨電荷為 0 · Esc 返回冒險地圖
        </div>

        {/* Reset Confirmation Modal */}
        {confirmResetModal && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-4 text-center">
              <h3 className="text-lg font-bold text-white">確定要重新開始新遊戲嗎？</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                這將會重置目前的等級、已解鎖的化合物秘方與熟練度紀錄，從「第一章：元素新手村」重新開始。
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmResetModal(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleResetNewGame}
                  className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg"
                >
                  確認重置並開始新遊戲
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // VIEW 2: ACTIVE GAME SHELL (TOP BAR CONTRACT + MAIN WORKSPACE)
  // ============================================================================
  return (
    <div
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col ${
        progress.settings.reduceMotion ? 'reduce-motion' : ''
      }`}
    >
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-slate-950/95 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => setActiveView('TITLE')}
          className="text-lg font-display font-bold tracking-tight text-white hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          價數鍊金師：元素王國
        </button>

        {/* Zone 2: 5 Clean Single-Line Text Navigation Links */}
        <nav className="flex items-center gap-5 overflow-x-auto text-sm font-medium text-slate-300">
          <button
            type="button"
            onClick={() => setActiveView('MAP')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeView === 'MAP'
                ? 'text-amber-300 underline underline-offset-8 decoration-2'
                : 'hover:text-white'
            }`}
          >
            冒險地圖
          </button>
          <button
            type="button"
            onClick={() => setActiveView('WORKSHOP')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeView === 'WORKSHOP'
                ? 'text-amber-300 underline underline-offset-8 decoration-2'
                : 'hover:text-white'
            }`}
          >
            化學合成工坊
          </button>
          <button
            type="button"
            onClick={() => setActiveView('BOSS')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeView === 'BOSS'
                ? 'text-amber-300 underline underline-offset-8 decoration-2'
                : 'hover:text-white'
            }`}
          >
            魔王討伐戰
          </button>
          <button
            type="button"
            onClick={() => setActiveView('CODEX')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeView === 'CODEX'
                ? 'text-amber-300 underline underline-offset-8 decoration-2'
                : 'hover:text-white'
            }`}
          >
            卡牌圖鑑與養成
          </button>
          <button
            type="button"
            onClick={() => setActiveView('REVIEW')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeView === 'REVIEW'
                ? 'text-amber-300 underline underline-offset-8 decoration-2'
                : 'hover:text-white'
            }`}
          >
            錯題複習與教師模式
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveView('CODEX')}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 font-chem tabular-nums cursor-pointer"
          >
            Lv.{levelInfo.level} · {progress.xp} EXP
          </button>
        </div>
      </header>

      {/* Sub-Header Chapter Selector & Audio/Accessibility Controls Strip */}
      <div className="bg-slate-900/65 border-b border-slate-800/80 px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Chapter Quick Switcher */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs text-slate-400 mr-1 whitespace-nowrap shrink-0">
              當前區域：
            </span>
            {CHAPTERS_DATA.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => {
                  setSelectedChapterId(ch.id);
                  setSelectedChallengeId(null);
                }}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  selectedChapterId === ch.id
                    ? 'bg-slate-800 text-amber-300 border border-amber-400/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {ch.title}
              </button>
            ))}
          </div>

          {/* Right Utility Toggles: Sound, Auto-Hide Valence, Reduce Motion */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <button
              type="button"
              onClick={() =>
                setProgress((p) => ({
                  ...p,
                  settings: {
                    ...p.settings,
                    autoHideMasteredValence: !p.settings.autoHideMasteredValence,
                  },
                }))
              }
              className="hover:text-white whitespace-nowrap shrink-0"
            >
              {progress.settings.autoHideMasteredValence
                ? '✓ 專精卡牌自動隱藏價數'
                : '○ 永遠顯示價數'}
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() =>
                setProgress((p) => ({
                  ...p,
                  settings: { ...p.settings, soundMuted: !p.settings.soundMuted },
                }))
              }
              className="hover:text-white flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              {progress.settings.soundMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  <span>靜音</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>音效開</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border-2 border-amber-400 text-amber-200 px-4 py-3 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Container (1440px Desktop Baseline) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeView === 'MAP' && (
          <AdventureWorldMap
            progress={progress}
            selectedChapterId={selectedChapterId}
            onSelectChapterAndEnterWorkshop={(chId, qId) => {
              setSelectedChapterId(chId);
              setSelectedChallengeId(qId || null);
              setSpacedReviewIonIds(null);
              setActiveView('WORKSHOP');
            }}
            onSelectChapterAndEnterBoss={(chId) => {
              setSelectedChapterId(chId);
              setActiveView('BOSS');
            }}
            onClaimDailyQuest={handleClaimDailyQuest}
            onRefreshDailyQuests={() => {
              setProgress((p) => ({
                ...p,
                dailyQuests: generateFreshDailyQuests(),
              }));
              showToast('已刷新今日公會短任務！');
            }}
            onToggleBlindMasteryMode={() => {
              setProgress((p) => ({
                ...p,
                settings: {
                  ...p.settings,
                  blindMasteryMode: !p.settings.blindMasteryMode,
                },
              }));
            }}
          />
        )}

        {activeView === 'WORKSHOP' && (
          <CrucibleWorkshop
            chapter={currentChapter}
            progress={progress}
            initialChallengeId={selectedChallengeId}
            spacedReviewIonIds={spacedReviewIonIds}
            onClearSpacedReview={() => setSpacedReviewIonIds(null)}
            onSynthesisSuccess={handleSynthesisSuccess}
            onSynthesisMistake={handleSynthesisMistake}
            onStartBossBattle={() => setActiveView('BOSS')}
          />
        )}

        {activeView === 'BOSS' && (
          <BossBattleArena
            chapter={currentChapter}
            progress={progress}
            onBossDefeated={handleBossDefeated}
            onSynthesisRecorded={(comp, wasHidden) =>
              handleSynthesisSuccess(comp, null, false, wasHidden)
            }
            onMistakeRecorded={(evalRes) => handleSynthesisMistake(evalRes)}
            onExitBattle={() => setActiveView('WORKSHOP')}
            onAdvanceNextChapter={() => {
              if (selectedChapterId < 5) {
                setSelectedChapterId((id) => id + 1);
                setActiveView('WORKSHOP');
              }
            }}
          />
        )}

        {activeView === 'CODEX' && (
          <CodexAndLabView
            progress={progress}
            onUnlockOrEquipCosmetic={handleUnlockOrEquipCosmetic}
            onUpdatePlayerName={(newName) =>
              setProgress((p) => ({ ...p, playerName: newName }))
            }
          />
        )}

        {activeView === 'REVIEW' && (
          <ReviewAndTeacherView
            progress={progress}
            onStartSpacedReviewSession={(ionIds) => {
              setSpacedReviewIonIds(ionIds);
              setActiveView('WORKSHOP');
            }}
            onMarkMistakeResolved={(mistakeId) => {
              setProgress((p) => ({
                ...p,
                mistakeLogs: p.mistakeLogs.map((m) =>
                  m.id === mistakeId ? { ...m, resolved: true } : m
                ),
              }));
            }}
          />
        )}
      </main>
    </div>
  );
}
