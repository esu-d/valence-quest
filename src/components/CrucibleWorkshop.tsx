import React, { useState, useEffect, useMemo } from 'react';
import {
  ION_CARDS,
  ION_MAP,
  VERIFIED_COMPOUNDS,
  IonCardData,
  VerifiedCompound,
} from '../data/chemistryData';
import {
  ChapterData,
  SynthesisChallenge,
  LAB_COSMETICS,
} from '../data/chaptersData';
import {
  PlayerProgressState,
  evaluateFlowState,
} from '../utils/storageManager';
import {
  evaluateSynthesis,
  SynthesisEvaluation,
} from '../utils/chemistryEngine';
import { IonCardComponent } from './IonCardComponent';
import {
  IonSymbolDisplay,
  CompoundFormulaDisplay,
} from './FormulaDisplay';
import { sfx } from '../utils/soundEffects';
import {
  Sparkles,
  Scale,
  RotateCcw,
  Shuffle,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Users,
  BookOpen,
  Swords,
  ChevronRight,
} from 'lucide-react';

interface CrucibleWorkshopProps {
  chapter: ChapterData;
  progress: PlayerProgressState;
  initialChallengeId?: string | null;
  spacedReviewIonIds?: string[] | null;
  onClearSpacedReview?: () => void;
  onSynthesisSuccess: (
    compound: VerifiedCompound,
    challengeId: string | null,
    usedPeekOrHint: boolean,
    wasHiddenValence: boolean
  ) => void;
  onSynthesisMistake: (evalResult: SynthesisEvaluation, targetFormula?: string) => void;
  onStartBossBattle: () => void;
}

type WorkshopMode = 'quest' | 'free' | 'coop';

export const CrucibleWorkshop: React.FC<CrucibleWorkshopProps> = ({
  chapter,
  progress,
  initialChallengeId,
  spacedReviewIonIds,
  onClearSpacedReview,
  onSynthesisSuccess,
  onSynthesisMistake,
  onStartBossBattle,
}) => {
  const [mode, setMode] = useState<WorkshopMode>('quest');
  const [activeChallengeIndex, setActiveChallengeIndex] = useState<number>(0);
  const [randomChallenge, setRandomChallenge] = useState<SynthesisChallenge | null>(null);
  const [showLessonDrawer, setShowLessonDrawer] = useState<boolean>(false);

  // Selected Ions & Counts in the Crucible
  const [selectedCationId, setSelectedCationId] = useState<string | null>(null);
  const [selectedAnionId, setSelectedAnionId] = useState<string | null>(null);
  const [cationCount, setCationCount] = useState<number>(1);
  const [anionCount, setAnionCount] = useState<number>(1);

  // Interactive Parentheses Quiz Toggle for Polyatomic Ions
  const [manualParenQuiz, setManualParenQuiz] = useState<boolean>(false);
  const [userCationParen, setUserCationParen] = useState<boolean>(false);
  const [userAnionParen, setUserAnionParen] = useState<boolean>(false);

  // Co-op Pass & Play Relay Step (1 = Player 1 picks Cation, 2 = Player 2 balances Anion)
  const [coopTurn, setCoopTurn] = useState<1 | 2>(1);
  const [coopScore, setCoopScore] = useState<number>(0);

  // Feedback & Particle States
  const [lastEvaluation, setLastEvaluation] = useState<SynthesisEvaluation | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [usedPeekOrHint, setUsedPeekOrHint] = useState<boolean>(false);
  const [burstParticles, setBurstParticles] = useState<
    { id: number; tx: number; ty: number; color: string }[]
  >([]);
  const [shakeCrucible, setShakeCrucible] = useState<boolean>(false);

  // Select initial challenge if passed
  useEffect(() => {
    if (initialChallengeId) {
      const idx = chapter.challenges.findIndex((c) => c.id === initialChallengeId);
      if (idx !== -1) {
        setActiveChallengeIndex(idx);
        setRandomChallenge(null);
        setMode('quest');
      }
    }
  }, [initialChallengeId, chapter]);

  // If spacedReviewIonIds is passed, generate a targeted review quest!
  useEffect(() => {
    if (spacedReviewIonIds && spacedReviewIonIds.length > 0) {
      const targetIon = spacedReviewIonIds[0];
      const matchingCompounds = VERIFIED_COMPOUNDS.filter(
        (c) => c.cationId === targetIon || c.anionId === targetIon
      );
      if (matchingCompounds.length > 0) {
        const picked = matchingCompounds[Math.floor(Math.random() * matchingCompounds.length)];
        setRandomChallenge({
          id: `review-${Date.now()}`,
          chapterId: chapter.id,
          title: `弱點間隔特訓：${picked.name}`,
          storyPrompt: `根據你的學習紀錄，系統為你安排了「${ION_MAP[targetIon]?.name || targetIon}」的間隔提取練習！請合成「${picked.name}」！`,
          targetFormula: picked.formula,
          targetName: picked.name,
          hintText: `${ION_MAP[picked.cationId]?.name}（+${ION_MAP[picked.cationId]?.charge}）配 ${ION_MAP[picked.anionId]?.name}（${ION_MAP[picked.anionId]?.charge}）。`,
          availableIonIds: Array.from(
            new Set([
              picked.cationId,
              picked.anionId,
              'Na+',
              'Ca2+',
              'Al3+',
              'Cl-',
              'O2-',
              'OH-',
              'SO42-',
            ])
          ),
          xpReward: 130,
          crystalReward: 45,
        });
        setMode('quest');
      }
    }
  }, [spacedReviewIonIds, chapter.id]);

  const currentChallenge: SynthesisChallenge | null = useMemo(() => {
    if (mode === 'free') return null;
    if (randomChallenge) return randomChallenge;
    return chapter.challenges[activeChallengeIndex] || chapter.challenges[0];
  }, [mode, randomChallenge, chapter.challenges, activeChallengeIndex]);

  // Available Ion Cards for current mode
  const availableIons: IonCardData[] = useMemo(() => {
    if (mode === 'free') {
      return ION_CARDS;
    }
    if (currentChallenge) {
      return currentChallenge.availableIonIds
        .map((id) => ION_MAP[id])
        .filter((c): c is IonCardData => Boolean(c));
    }
    return ION_CARDS.filter((c) => c.unlockChapter <= chapter.id);
  }, [mode, currentChallenge, chapter.id]);

  const cations = useMemo(
    () => availableIons.filter((c) => c.type === 'cation'),
    [availableIons]
  );
  const anions = useMemo(
    () => availableIons.filter((c) => c.type === 'anion'),
    [availableIons]
  );

  // Auto-update parens if manualParenQuiz is OFF
  const selectedCation = selectedCationId ? ION_MAP[selectedCationId] || null : null;
  const selectedAnion = selectedAnionId ? ION_MAP[selectedAnionId] || null : null;

  useEffect(() => {
    if (!manualParenQuiz) {
      setUserCationParen(Boolean(selectedCation?.isPolyatomic && cationCount > 1));
      setUserAnionParen(Boolean(selectedAnion?.isPolyatomic && anionCount > 1));
    }
  }, [manualParenQuiz, selectedCation, selectedAnion, cationCount, anionCount]);

  // Live preview of charge balance
  const liveEval = useMemo(() => {
    return evaluateSynthesis(
      selectedCationId,
      selectedAnionId,
      cationCount,
      anionCount,
      manualParenQuiz ? userCationParen : undefined,
      manualParenQuiz ? userAnionParen : undefined
    );
  }, [
    selectedCationId,
    selectedAnionId,
    cationCount,
    anionCount,
    manualParenQuiz,
    userCationParen,
    userAnionParen,
  ]);

  const resetCrucible = () => {
    setSelectedCationId(null);
    setSelectedAnionId(null);
    setCationCount(1);
    setAnionCount(1);
    setUserCationParen(false);
    setUserAnionParen(false);
    setLastEvaluation(null);
    setShowHint(false);
    setUsedPeekOrHint(false);
    setCoopTurn(1);
  };

  // Generate a random procedural quest for replayability
  const handleGenerateRandomQuest = () => {
    const chapterIonSet = new Set(
      ION_CARDS.filter((c) => c.unlockChapter <= chapter.id).map((c) => c.id)
    );
    const eligibleCompounds = VERIFIED_COMPOUNDS.filter(
      (comp) => chapterIonSet.has(comp.cationId) && chapterIonSet.has(comp.anionId)
    );
    const pool = eligibleCompounds.length > 0 ? eligibleCompounds : VERIFIED_COMPOUNDS;
    const picked = pool[Math.floor(Math.random() * pool.length)];

    // Pick 3 distractor ions
    const extraCations = ION_CARDS.filter(
      (c) => c.type === 'cation' && c.id !== picked.cationId && c.unlockChapter <= Math.max(2, chapter.id)
    )
      .slice(0, 2)
      .map((c) => c.id);
    const extraAnions = ION_CARDS.filter(
      (c) => c.type === 'anion' && c.id !== picked.anionId && c.unlockChapter <= Math.max(2, chapter.id)
    )
      .slice(0, 2)
      .map((c) => c.id);

    setRandomChallenge({
      id: `rand-${Date.now()}`,
      chapterId: chapter.id,
      title: `隨機秘境委託：合成「${picked.name}」`,
      storyPrompt: picked.commonName
        ? `王國工坊隨機委託：請合成俗稱「${picked.commonName}」的「${picked.name}」！`
        : `王國工坊隨機委託：請根據名稱由右向左推導並合成「${picked.name}」！`,
      targetFormula: picked.formula,
      targetName: picked.name,
      hintText: `由「${ION_MAP[picked.cationId]?.name}」與「${ION_MAP[picked.anionId]?.name}」組成，注意電荷平衡！`,
      availableIonIds: [picked.cationId, ...extraCations, picked.anionId, ...extraAnions],
      xpReward: 110,
      crystalReward: 40,
    });
    resetCrucible();
  };

  const handleCardSelect = (card: IonCardData) => {
    sfx.playCardTap(card.charge);
    if (card.type === 'cation') {
      if (selectedCationId === card.id) {
        setCationCount((prev) => (prev < 4 ? prev + 1 : 1));
      } else {
        setSelectedCationId(card.id);
        setCationCount(1);
      }
    } else {
      if (selectedAnionId === card.id) {
        setAnionCount((prev) => (prev < 4 ? prev + 1 : 1));
      } else {
        setSelectedAnionId(card.id);
        setAnionCount(1);
      }
    }
    setLastEvaluation(null);
  };

  const triggerParticles = (colorHex: string) => {
    if (progress.settings.reduceMotion) return;
    const parts = Array.from({ length: 18 }).map((_, i) => {
      const angle = (i / 18) * Math.PI * 2;
      const dist = 55 + Math.random() * 65;
      return {
        id: Date.now() + i,
        tx: Math.cos(angle) * dist,
        ty: Math.sin(angle) * dist,
        color: i % 2 === 0 ? colorHex : '#fbbf24',
      };
    });
    setBurstParticles(parts);
    setTimeout(() => setBurstParticles([]), 700);
  };

  const handleSynthesize = () => {
    const result = liveEval;

    // Check if in Quest or Co-op mode and whether the synthesized compound matches the target
    if (result.status === 'SUCCESS' && result.compound) {
      if (
        (mode === 'quest' || mode === 'coop') &&
        currentChallenge &&
        result.compound.formula !== currentChallenge.targetFormula
      ) {
        sfx.playImbalanceHint();
        setLastEvaluation({
          ...result,
          status: 'UNSTABLE_OR_UNKNOWN',
          feedbackTitle: `你成功合成了電中性的「${result.compound.name}（${result.compound.formula}）」！`,
          feedbackMessage: `電荷完全平衡！不過目前的任務目標是「${currentChallenge.targetName}（${currentChallenge.targetFormula}）」，請換一組離子試試看！`,
          mistakeType: 'wrong_target',
        });
        return;
      }

      // Genuine Synthesis Victory!
      sfx.playSynthesisSuccess();
      triggerParticles(result.cation?.accentHex || '#10b981');
      setLastEvaluation(result);

      if (mode === 'coop') {
        setCoopScore((s) => s + 1);
      }

      // Check if either card had hidden valence
      const cStat = progress.ionStats[result.compound.cationId];
      const aStat = progress.ionStats[result.compound.anionId];
      const wasHidden =
        progress.settings.blindMasteryMode ||
        (progress.settings.autoHideMasteredValence &&
          ((cStat && cStat.masteryLevel >= 2) || (aStat && aStat.masteryLevel >= 2)));

      onSynthesisSuccess(
        result.compound,
        currentChallenge ? currentChallenge.id : null,
        usedPeekOrHint,
        Boolean(wasHidden && !usedPeekOrHint)
      );
    } else {
      // Formative Diagnostic Feedback (No harsh Game Over!)
      sfx.playImbalanceHint();
      if (!progress.settings.reduceMotion) {
        setShakeCrucible(true);
        setTimeout(() => setShakeCrucible(false), 380);
      }
      setLastEvaluation(result);
      onSynthesisMistake(result, currentChallenge?.targetFormula);
    }
  };

  // Calculate beam tilt angle (-14 deg to +14 deg)
  const tiltAngle = Math.max(-14, Math.min(14, -liveEval.netCharge * 4.5));
  const equippedCrucibleObj =
    LAB_COSMETICS.find((c) => c.id === progress.equippedCrucible) || LAB_COSMETICS[0];
  const flowStatus = evaluateFlowState(progress.recentAccuracyWindow);

  return (
    <div className="space-y-6">
      {/* Top Sub-Toolbar: Mode Switcher + Chapter Quick Concept Guide + Boss Entry */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-xl p-4">
        {/* Functional Segmented Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setMode('quest');
              setRandomChallenge(null);
              resetCrucible();
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              mode === 'quest'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            章節任務試煉
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('free');
              resetCrucible();
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              mode === 'free'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            自由鍊金探索
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('coop');
              handleGenerateRandomQuest();
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              mode === 'coop'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>雙人合作接力</span>
          </button>
        </div>

        {/* Right Actions: Chapter Concept Guide & Boss Challenge CTA */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowLessonDrawer((prev) => !prev)}
            className="px-3.5 py-2 text-xs font-semibold text-sky-200 bg-sky-950/80 hover:bg-sky-900/80 border border-sky-700/60 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{showLessonDrawer ? '收起本章秘笈' : '本章價數秘笈'}</span>
          </button>

          <button
            type="button"
            onClick={onStartBossBattle}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <Swords className="w-3.5 h-3.5" />
            <span>挑戰本章魔王</span>
          </button>
        </div>
      </div>

      {/* Collapsible Chapter Concept Guide (新知教學) */}
      {showLessonDrawer && (
        <div className="bg-slate-900/95 border border-sky-800/60 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">
                {chapter.title} — 核心價數與化學式法則
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                重點範圍：{chapter.valenceFocus} · 心流狀態：{flowStatus.stateLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowLessonDrawer(false)}
              className="text-xs text-slate-400 hover:text-white whitespace-nowrap shrink-0"
            >
              關閉秘笈
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {chapter.lessonPoints.map((pt, i) => (
              <div key={i} className="bg-slate-950/80 border border-slate-800/90 rounded-lg p-4 space-y-2">
                <div className="text-sm font-bold text-amber-300">{pt.heading}</div>
                <p className="text-xs text-slate-300 leading-relaxed">{pt.content}</p>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <CompoundFormulaDisplay
                    formula={pt.exampleFormula}
                    className="text-base font-bold text-sky-300"
                  />
                  <span className="text-slate-400">{pt.exampleExplanation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Quest Banner or Mode Header */}
      {mode === 'quest' && currentChallenge && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              {/* Step Selector for Chapter Quests */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {chapter.challenges.map((ch, idx) => {
                  const isDone = progress.completedChallenges.includes(ch.id);
                  const isCurrent = !randomChallenge && activeChallengeIndex === idx;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => {
                        setRandomChallenge(null);
                        setActiveChallengeIndex(idx);
                        resetCrucible();
                      }}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        isCurrent
                          ? 'bg-sky-500 text-slate-950'
                          : isDone
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 hover:bg-emerald-900/60'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      試煉 {idx + 1}：{ch.targetName} {isDone ? '✓' : ''}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={handleGenerateRandomQuest}
                  className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                    randomChallenge
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
                  }`}
                >
                  <Shuffle className="w-3 h-3" />
                  <span>隨機挑戰題</span>
                </button>
                {spacedReviewIonIds && spacedReviewIonIds.length > 0 && onClearSpacedReview && (
                  <button
                    type="button"
                    onClick={() => {
                      onClearSpacedReview();
                      setRandomChallenge(null);
                    }}
                    className="px-2.5 py-1 text-xs text-slate-400 hover:text-white whitespace-nowrap shrink-0"
                  >
                    結束弱點特訓
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-white">
                  {currentChallenge.title}
                </h2>
                <span className="text-xs text-slate-400 tabular-nums">
                  獎勵 +{currentChallenge.xpReward} EXP · +{currentChallenge.crystalReward} 結晶
                </span>
              </div>
              <p className="text-sm text-slate-300">{currentChallenge.storyPrompt}</p>
            </div>

            {/* Target Compound Display Box */}
            <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 shrink-0">
              <div>
                <div className="text-xs text-slate-400">目標合成化合物</div>
                <div className="text-xl font-bold text-amber-300 mt-0.5">
                  {currentChallenge.targetName}
                </div>
              </div>
              <div className="h-8 w-[1px] bg-slate-800" />
              <button
                type="button"
                onClick={() => {
                  setShowHint((h) => !h);
                  setUsedPeekOrHint(true);
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>{showHint ? '隱藏提示' : '天平提示'}</span>
              </button>
            </div>
          </div>

          {showHint && (
            <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-amber-200 flex items-center justify-between">
              <span>鍊金導師提示：{currentChallenge.hintText}</span>
              <span className="text-slate-400">{flowStatus.advice}</span>
            </div>
          )}
        </div>
      )}

      {/* Co-op Relay Banner */}
      {mode === 'coop' && currentChallenge && (
        <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs text-amber-300 font-semibold">
              雙人合作接力模式 · 已合力完成 {coopScore} 道試煉
            </div>
            <h2 className="text-lg font-bold text-white">
              合作目標：合成「{currentChallenge.targetName}」
            </h2>
            <p className="text-xs text-slate-300">
              {coopTurn === 1
                ? '【第一棒：陽離子先鋒】請先選擇正確的「陽離子（+）」與數量，再點擊交棒給同學！'
                : '【第二棒：陰離子調合師】請根據隊友選好的正電荷，搭配正確的「陰離子（−）」與數量完成合成！'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setCoopTurn(coopTurn === 1 ? 2 : 1)}
              className="px-4 py-2 text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg whitespace-nowrap shrink-0"
            >
              {coopTurn === 1 ? '交棒給第二棒 (2P) →' : '← 切回第一棒 (1P)'}
            </button>
            <button
              type="button"
              onClick={handleGenerateRandomQuest}
              className="px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg whitespace-nowrap shrink-0"
            >
              換下一題
            </button>
          </div>
        </div>
      )}

      {/* Main Two-Zone Alchemy Stage: Crucible & Charge Balance Scale */}
      <div
        className={`relative bg-slate-900/95 border border-slate-800 rounded-2xl p-6 transition-transform ${
          shakeCrucible ? 'animate-shake' : ''
        }`}
      >
        {/* Particle Burst Layer */}
        {burstParticles.length > 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden z-20">
            {burstParticles.map((p) => (
              <span
                key={p.id}
                className="w-3 h-3 rounded-full absolute transition-all duration-700 ease-out"
                style={{
                  backgroundColor: p.color,
                  transform: `translate(${p.tx}px, ${p.ty}px) scale(0.2)`,
                  opacity: 0,
                }}
              />
            ))}
          </div>
        )}

        {/* Crucible Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Scale className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                {equippedCrucibleObj.name} · 電荷平衡天平
              </h3>
              <p className="text-xs text-slate-400">
                化學式書寫口訣：左正右負（陽離子在左、陰離子在右），中文讀法由右向左
              </p>
            </div>
          </div>

          {/* Mastery Parentheses Check Switch & Reset */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={manualParenQuiz}
                onChange={(e) => setManualParenQuiz(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500"
              />
              <span>手動挑戰「原子團括號 ()」判斷</span>
            </label>

            <button
              type="button"
              onClick={resetCrucible}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>清空坩堝</span>
            </button>
          </div>
        </div>

        {/* 3-Column Crucible Balance Workbench */}
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 items-center">
          {/* LEFT: Cation Crucible Slot (+ Positive) */}
          <div className="lg:col-span-4 bg-slate-950/90 border border-sky-900/60 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-sky-300">左盤：陽離子（正電 +）</span>
              <span className="font-chem font-bold text-sky-400 tabular-nums">
                總正電：+{liveEval.totalPositiveCharge}
              </span>
            </div>

            {selectedCation ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <IonSymbolDisplay
                      baseFormula={selectedCation.baseFormula}
                      charge={selectedCation.charge}
                      hideCharge={progress.settings.blindMasteryMode}
                      className="text-2xl font-bold text-white"
                    />
                    <div>
                      <div className="text-sm font-bold text-slate-100">
                        {selectedCation.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        單個電荷 +{selectedCation.charge}
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-chem">
                    <span className="text-xs text-slate-400">數量</span>
                    <div className="text-xl font-bold text-sky-300 tabular-nums">
                      × {cationCount}
                    </div>
                  </div>
                </div>

                {/* Quantity Selector Buttons (1 ~ 4) */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400">調整陽離子個數：</span>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          sfx.playCardTap(1);
                          setCationCount(num);
                        }}
                        className={`w-9 h-9 rounded-lg font-chem text-sm font-bold transition-colors tabular-nums ${
                          cationCount === num
                            ? 'bg-sky-500 text-slate-950 shadow-sm'
                            : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-sky-500/50'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual Parentheses Toggle when enabled or polyatomic note */}
                {selectedCation.isPolyatomic && (
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-300">
                      原子團 {selectedCation.baseFormula} 括號：
                    </span>
                    {manualParenQuiz ? (
                      <button
                        type="button"
                        onClick={() => setUserCationParen((p) => !p)}
                        className={`px-3 py-1 rounded font-chem font-semibold ${
                          userCationParen
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {userCationParen
                          ? `已加括號 (${selectedCation.baseFormula})`
                          : '未加括號'}
                      </button>
                    ) : (
                      <span className="text-amber-300 font-medium">
                        {cationCount > 1
                          ? `數量 ${cationCount} ≥ 2，自動加上 (${selectedCation.baseFormula})`
                          : '數量為 1，不需加括號'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-center border border-dashed border-slate-800 rounded-lg p-4 text-xs text-slate-400">
                <span>請從下方選擇 1 張「陽離子卡牌（+）」</span>
                <span className="text-[11px] text-slate-500 mt-1">
                  例如 Na⁺、Ca²⁺、Al³⁺、NH₄⁺
                </span>
              </div>
            )}
          </div>

          {/* CENTER: Visual Charge Scale & Formula Preview */}
          <div className="lg:col-span-3 flex flex-col items-center justify-center text-center space-y-4">
            {/* Balance Indicator */}
            <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="text-xs font-medium text-slate-400">
                即時化學式與淨電荷推導
              </div>

              {/* Dynamic Formula Preview */}
              <div className="min-h-[44px] flex items-center justify-center">
                {liveEval.constructedFormula ? (
                  <CompoundFormulaDisplay
                    formula={liveEval.constructedFormula}
                    className={`text-3xl font-bold ${
                      liveEval.netCharge === 0 && liveEval.gcdValue === 1
                        ? 'text-emerald-300'
                        : 'text-amber-300'
                    }`}
                  />
                ) : (
                  <span className="text-sm text-slate-500">等待投入正負離子...</span>
                )}
              </div>

              {/* Visual Tilting Balance Beam */}
              <div className="relative h-12 flex items-center justify-center">
                <div
                  className="w-44 h-2 rounded-full bg-slate-700 transition-transform duration-200 flex items-center justify-between px-2"
                  style={{ transform: `rotate(${tiltAngle}deg)` }}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-sky-400 -mt-2" />
                  <span className="w-3.5 h-3.5 rounded-full bg-rose-400 -mt-2" />
                </div>
                {/* Fulcrum Triangle */}
                <div className="absolute bottom-1 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] border-b-amber-400" />
              </div>

              {/* Net Charge Numeric Readout */}
              <div className="text-xs font-chem tabular-nums">
                {selectedCation && selectedAnion ? (
                  liveEval.netCharge === 0 ? (
                    <span className="text-emerald-400 font-bold">
                      ● 電荷平衡 (+{liveEval.totalPositiveCharge} 與 {liveEval.totalNegativeCharge} = 0)
                    </span>
                  ) : (
                    <span className="text-amber-300 font-bold">
                      ▲ 淨電荷差距：{liveEval.netCharge > 0 ? `+${liveEval.netCharge}` : liveEval.netCharge}
                    </span>
                  )
                ) : (
                  <span className="text-slate-400">尚未放滿正負離子</span>
                )}
              </div>
            </div>

            {/* Primary Synthesize Button */}
            <button
              type="button"
              onClick={handleSynthesize}
              className="w-full py-3 px-5 rounded-xl font-bold text-sm text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.99] transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>啟動鍊金合成</span>
            </button>
          </div>

          {/* RIGHT: Anion Crucible Slot (- Negative) */}
          <div className="lg:col-span-4 bg-slate-950/90 border border-rose-900/60 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-rose-300">右盤：陰離子（負電 −）</span>
              <span className="font-chem font-bold text-rose-400 tabular-nums">
                總負電：{liveEval.totalNegativeCharge}
              </span>
            </div>

            {selectedAnion ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <IonSymbolDisplay
                      baseFormula={selectedAnion.baseFormula}
                      charge={selectedAnion.charge}
                      hideCharge={progress.settings.blindMasteryMode}
                      className="text-2xl font-bold text-white"
                    />
                    <div>
                      <div className="text-sm font-bold text-slate-100">
                        {selectedAnion.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        單個電荷 {selectedAnion.charge}
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-chem">
                    <span className="text-xs text-slate-400">數量</span>
                    <div className="text-xl font-bold text-rose-300 tabular-nums">
                      × {anionCount}
                    </div>
                  </div>
                </div>

                {/* Quantity Selector Buttons (1 ~ 4) */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400">調整陰離子個數：</span>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          sfx.playCardTap(-1);
                          setAnionCount(num);
                        }}
                        className={`w-9 h-9 rounded-lg font-chem text-sm font-bold transition-colors tabular-nums ${
                          anionCount === num
                            ? 'bg-rose-500 text-white shadow-sm'
                            : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-rose-500/50'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual Parentheses Toggle or Auto Explanation */}
                {selectedAnion.isPolyatomic && (
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-300">
                      原子團 {selectedAnion.baseFormula} 括號：
                    </span>
                    {manualParenQuiz ? (
                      <button
                        type="button"
                        onClick={() => setUserAnionParen((p) => !p)}
                        className={`px-3 py-1 rounded font-chem font-semibold ${
                          userAnionParen
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {userAnionParen
                          ? `已加括號 (${selectedAnion.baseFormula})`
                          : '未加括號'}
                      </button>
                    ) : (
                      <span className="text-amber-300 font-medium">
                        {anionCount > 1
                          ? `數量 ${anionCount} ≥ 2，自動加上 (${selectedAnion.baseFormula})`
                          : '數量為 1，不需加括號'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-center border border-dashed border-slate-800 rounded-lg p-4 text-xs text-slate-400">
                <span>請從下方選擇 1 張「陰離子卡牌（−）」</span>
                <span className="text-[11px] text-slate-500 mt-1">
                  例如 Cl⁻、O²⁻、OH⁻、SO₄²⁻
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Formative Synthesis Result / Diagnostic Feedback Banner */}
        {lastEvaluation && (
          <div
            className={`mt-6 rounded-xl p-4 border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              lastEvaluation.status === 'SUCCESS'
                ? 'bg-emerald-950/75 border-emerald-500/60 text-emerald-100'
                : 'bg-amber-950/70 border-amber-500/60 text-amber-100'
            }`}
          >
            <div className="flex items-start gap-3">
              {lastEvaluation.status === 'SUCCESS' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="text-sm font-bold flex items-center gap-2">
                  <span>{lastEvaluation.feedbackTitle}</span>
                  {lastEvaluation.compound?.commonName && (
                    <span className="text-xs font-normal text-emerald-300">
                      · 俗稱：{lastEvaluation.compound.commonName}
                    </span>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-slate-200">
                  {lastEvaluation.feedbackMessage}
                </p>
                <p className="text-xs text-slate-300 font-chem">
                  {lastEvaluation.detailedPrinciple}
                </p>
              </div>
            </div>

            {/* Next Quest Button on Success */}
            {lastEvaluation.status === 'SUCCESS' && mode === 'quest' && (
              <div className="flex items-center gap-2 shrink-0">
                {!randomChallenge && activeChallengeIndex < chapter.challenges.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveChallengeIndex((i) => i + 1);
                      resetCrucible();
                    }}
                    className="px-4 py-2 text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-lg flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <span>下一道試煉</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onStartBossBattle}
                    className="px-4 py-2 text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Swords className="w-4 h-4" />
                    <span>前往決戰本章魔王</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ion Card Deck Selection Grid: Split clearly into Cations (+) and Anions (-) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cation Deck */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-sky-300">
              陽離子卡牌區（帶正電 +，寫在化學式左邊）
            </h4>
            <span className="text-xs text-slate-400">
              點擊卡牌放入左盤（重複點擊可增加數量）
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {cations.map((card) => {
              const stat = progress.ionStats[card.id];
              const hideValence =
                progress.settings.blindMasteryMode ||
                (progress.settings.autoHideMasteredValence && (stat?.masteryLevel ?? 0) >= 2);
              return (
                <IonCardComponent
                  key={card.id}
                  card={card}
                  stat={stat}
                  isSelected={selectedCationId === card.id}
                  onSelect={handleCardSelect}
                  hideValenceByRule={hideValence}
                  onPeekValence={() => setUsedPeekOrHint(true)}
                  royalSkin={progress.equippedCardSkin === 'skin-royal'}
                  compact
                />
              );
            })}
          </div>
        </div>

        {/* Anion Deck */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-rose-300">
              陰離子卡牌區（帶負電 −，寫在化學式右邊）
            </h4>
            <span className="text-xs text-slate-400">
              點擊卡牌放入右盤（重複點擊可增加數量）
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {anions.map((card) => {
              const stat = progress.ionStats[card.id];
              const hideValence =
                progress.settings.blindMasteryMode ||
                (progress.settings.autoHideMasteredValence && (stat?.masteryLevel ?? 0) >= 2);
              return (
                <IonCardComponent
                  key={card.id}
                  card={card}
                  stat={stat}
                  isSelected={selectedAnionId === card.id}
                  onSelect={handleCardSelect}
                  hideValenceByRule={hideValence}
                  onPeekValence={() => setUsedPeekOrHint(true)}
                  royalSkin={progress.equippedCardSkin === 'skin-royal'}
                  compact
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
