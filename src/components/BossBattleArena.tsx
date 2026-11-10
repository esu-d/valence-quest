import React, { useState, useMemo } from 'react';
import {
  ION_MAP,
  IonCardData,
  VerifiedCompound,
} from '../data/chemistryData';
import { ChapterData } from '../data/chaptersData';
import {
  PlayerProgressState,
  calculateLevelInfo,
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
  Swords,
  Shield,
  Zap,
  RotateCcw,
  Trophy,
  AlertCircle,
  ArrowLeft,
  Heart,
  Flame,
} from 'lucide-react';

interface BossBattleArenaProps {
  chapter: ChapterData;
  progress: PlayerProgressState;
  onBossDefeated: (bossId: string, xpReward: number, crystalReward: number) => void;
  onSynthesisRecorded: (compound: VerifiedCompound, wasHiddenValence: boolean) => void;
  onMistakeRecorded: (evalResult: SynthesisEvaluation) => void;
  onExitBattle: () => void;
  onAdvanceNextChapter?: () => void;
}

type CombatStance = 'strike' | 'barrier' | 'overcharge';

export const BossBattleArena: React.FC<BossBattleArenaProps> = ({
  chapter,
  progress,
  onBossDefeated,
  onSynthesisRecorded,
  onMistakeRecorded,
  onExitBattle,
  onAdvanceNextChapter,
}) => {
  const boss = chapter.boss;
  const levelInfo = calculateLevelInfo(progress.xp);

  // Combat State
  const [bossHp, setBossHp] = useState<number>(boss.maxHp);
  const [playerHp, setPlayerHp] = useState<number>(levelInfo.maxHp);
  const [playerShield, setPlayerShield] = useState<number>(15);
  const [overcharged, setOvercharged] = useState<boolean>(false);
  const [turn, setTurn] = useState<number>(1);
  const [shieldIndex, setShieldIndex] = useState<number>(0);
  const [stance, setStance] = useState<CombatStance>('strike');

  // Crucible selection in battle
  const [selectedCationId, setSelectedCationId] = useState<string | null>(null);
  const [selectedAnionId, setSelectedAnionId] = useState<string | null>(null);
  const [cationCount, setCationCount] = useState<number>(1);
  const [anionCount, setAnionCount] = useState<number>(1);

  // Battle Log & Visual Effects
  const [battleLog, setBattleLog] = useState<string[]>([
    `遭遇守關魔王「${boss.name}」！看準它的元素護盾弱點，合成電中性化合物發動攻擊！`,
  ]);
  const [bossHitShake, setBossHitShake] = useState<boolean>(false);
  const [playerHitShake, setPlayerHitShake] = useState<boolean>(false);
  const [bossImgBroken, setBossImgBroken] = useState<boolean>(false);
  const [avatarImgBroken, setAvatarImgBroken] = useState<boolean>(false);
  const [battleOutcome, setBattleOutcome] = useState<'playing' | 'victory' | 'defeat'>('playing');

  const currentShield = boss.shields[shieldIndex % boss.shields.length];

  const availableCards = useMemo(() => {
    return boss.availableIonIds
      .map((id) => ION_MAP[id])
      .filter((c): c is IonCardData => Boolean(c));
  }, [boss.availableIonIds]);

  const cations = useMemo(
    () => availableCards.filter((c) => c.type === 'cation'),
    [availableCards]
  );
  const anions = useMemo(
    () => availableCards.filter((c) => c.type === 'anion'),
    [availableCards]
  );

  const liveEval = useMemo(() => {
    return evaluateSynthesis(selectedCationId, selectedAnionId, cationCount, anionCount);
  }, [selectedCationId, selectedAnionId, cationCount, anionCount]);

  const handleRestartBattle = () => {
    setBossHp(boss.maxHp);
    setPlayerHp(levelInfo.maxHp);
    setPlayerShield(15);
    setOvercharged(false);
    setTurn(1);
    setShieldIndex(0);
    setSelectedCationId(null);
    setSelectedAnionId(null);
    setCationCount(1);
    setAnionCount(1);
    setBattleOutcome('playing');
    setBattleLog([`重新挑戰「${boss.name}」！保持冷靜，計算正負電荷最小公倍數！`]);
  };

  const handleCardSelect = (card: IonCardData) => {
    if (battleOutcome !== 'playing') return;
    sfx.playCardTap(card.charge);
    if (card.type === 'cation') {
      if (selectedCationId === card.id) {
        setCationCount((n) => (n < 4 ? n + 1 : 1));
      } else {
        setSelectedCationId(card.id);
        setCationCount(1);
      }
    } else {
      if (selectedAnionId === card.id) {
        setAnionCount((n) => (n < 4 ? n + 1 : 1));
      } else {
        setSelectedAnionId(card.id);
        setAnionCount(1);
      }
    }
  };

  const handleExecuteCombatTurn = () => {
    if (battleOutcome !== 'playing') return;

    if (liveEval.status !== 'SUCCESS' || !liveEval.compound) {
      sfx.playImbalanceHint();
      onMistakeRecorded(liveEval);
      setBattleLog((prev) => [
        `【合成失誤】${liveEval.feedbackTitle} — ${liveEval.feedbackMessage}`,
        ...prev.slice(0, 5),
      ]);
      return;
    }

    const comp = liveEval.compound;
    onSynthesisRecorded(comp, progress.settings.blindMasteryMode);

    // Calculate Damage & Weakness Multiplier
    const isExactWeakness = currentShield.preferredFormulas.includes(comp.formula);
    const isCategoryWeakness =
      !isExactWeakness &&
      currentShield.preferredCategory &&
      comp.category === currentShield.preferredCategory;

    let baseDamage = 75 + (levelInfo.level - 1) * 8;
    if (stance === 'barrier') baseDamage = Math.round(baseDamage * 0.65);
    if (stance === 'overcharge') baseDamage = Math.round(baseDamage * 0.5);

    let multiplier = 1.0;
    if (isExactWeakness) multiplier = 2.4;
    else if (isCategoryWeakness) multiplier = 1.65;

    if (overcharged) {
      multiplier *= 1.75;
    }

    const finalDamage = Math.round(baseDamage * multiplier);
    const newBossHp = Math.max(0, bossHp - finalDamage);

    sfx.playBossHit(isExactWeakness || isCategoryWeakness);
    if (!progress.settings.reduceMotion) {
      setBossHitShake(true);
      setTimeout(() => setBossHitShake(false), 380);
    }

    let nextShield = playerShield;
    let nextPlayerHp = playerHp;
    let nextOvercharge = false;

    const actionNotes: string[] = [];
    if (isExactWeakness) {
      actionNotes.push(`觸發弱點破甲（×2.4）！`);
    } else if (isCategoryWeakness) {
      actionNotes.push(`屬性克制（×1.65）！`);
    }
    if (overcharged) {
      actionNotes.push(`催化蓄能釋放！`);
    }

    if (stance === 'barrier') {
      nextShield += 42;
      actionNotes.push(`張開 +42 晶盾防禦！`);
    } else if (stance === 'overcharge') {
      nextPlayerHp = Math.min(levelInfo.maxHp, playerHp + 30);
      nextOvercharge = true;
      actionNotes.push(`回復 30 HP 並進入下回合催化增幅！`);
    }

    setBossHp(newBossHp);
    setOvercharged(nextOvercharge);

    // Clear crucible for next turn
    setSelectedCationId(null);
    setSelectedAnionId(null);
    setCationCount(1);
    setAnionCount(1);

    // Check if Boss is defeated
    if (newBossHp <= 0) {
      sfx.playLevelUp();
      setBattleOutcome('victory');
      setBattleLog((prev) => [
        `【致命一擊】合成「${comp.name}（${comp.formula}）」造成 ${finalDamage} 點傷害，徹底擊破「${boss.name}」！`,
        ...prev,
      ]);
      onBossDefeated(boss.id, boss.xpReward, boss.crystalReward);
      return;
    }

    // Boss Counterattack Phase
    const rawIncoming = isExactWeakness
      ? Math.round(currentShield.telegraphDamage * 0.5) // Weakness stagger halves boss damage!
      : currentShield.telegraphDamage;

    const absorbed = Math.min(nextShield, rawIncoming);
    const remainingShield = nextShield - absorbed;
    const hpDamage = rawIncoming - absorbed;
    const finalPlayerHp = Math.max(0, nextPlayerHp - hpDamage);

    setPlayerShield(remainingShield);
    setPlayerHp(finalPlayerHp);

    if (hpDamage > 0 && !progress.settings.reduceMotion) {
      setTimeout(() => {
        setPlayerHitShake(true);
        setTimeout(() => setPlayerHitShake(false), 360);
      }, 220);
    }

    const logEntry = `第 ${turn} 回合：合成「${comp.name} (${comp.formula})」造成 ${finalDamage} 傷害！${actionNotes.join(
      ' '
    )} 魔王發動「${currentShield.telegraphAttackName}」${
      isExactWeakness ? '（因護盾破碎威力減半）' : ''
    }，護盾抵擋 ${absorbed} 點，受到 ${hpDamage} 點傷害。`;

    setBattleLog((prev) => [logEntry, ...prev.slice(0, 5)]);

    if (finalPlayerHp <= 0 || turn >= boss.turnLimit) {
      setBattleOutcome('defeat');
      return;
    }

    setTurn((t) => t + 1);
    setShieldIndex((idx) => idx + 1);
  };

  return (
    <div className="space-y-6">
      {/* Top Combat HUD Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/95 border border-slate-800 rounded-xl p-4">
        <button
          type="button"
          onClick={onExitBattle}
          className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>返回章節工坊</span>
        </button>

        <div className="text-center">
          <div className="text-xs text-rose-400 font-semibold">
            {boss.subtitle} · 回合 {turn} / {boss.turnLimit}
          </div>
          <h2 className="text-lg font-bold text-white">{boss.name}</h2>
        </div>

        <button
          type="button"
          onClick={handleRestartBattle}
          className="px-3 py-1.5 text-xs font-semibold text-amber-300 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>重新開始戰鬥</span>
        </button>
      </div>

      {/* Main Arena Split: Alchemist Status (Left) vs Boss Status & Weakness (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Player Alchemist Status Card */}
        <div
          className={`lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between transition-transform ${
            playerHitShake ? 'animate-shake border-rose-500' : ''
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden border border-amber-400/50 bg-slate-950 shrink-0 flex items-center justify-center">
              {!avatarImgBroken ? (
                <img
                  src="/src/assets/images/alchemist_protagonist_avatar_1794327720324.jpg"
                  alt="見習鍊金師頭像"
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarImgBroken(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Shield className="w-8 h-8 text-amber-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-amber-300 font-semibold">
                Lv.{levelInfo.level} {levelInfo.title}
              </div>
              <div className="text-base font-bold text-white truncate">
                {progress.playerName}
              </div>

              {/* Player HP & Shield Readout */}
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-chem tabular-nums">
                  <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                    <Heart className="w-3.5 h-3.5" />
                    生命值 HP: {playerHp} / {levelInfo.maxHp}
                  </span>
                  <span className="text-sky-300 font-semibold">
                    晶盾防禦: +{playerShield}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-200"
                    style={{ width: `${Math.round((playerHp / levelInfo.maxHp) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tactical Stance Selector (3 Viable Combat Strategies) */}
          <div className="mt-5 pt-4 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">選擇本回合戰術姿態：</span>
              {overcharged && (
                <span className="text-amber-300 font-bold">
                  ★ 催化增幅生效中（傷害 ×1.75）
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStance('strike')}
                className={`p-2.5 rounded-xl border text-left transition-colors ${
                  stance === 'strike'
                    ? 'bg-rose-950/90 border-rose-400 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                  <Swords className="w-3.5 h-3.5" />
                  <span>強擊合成</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  100% 基礎威力，配合弱點 2.4 倍破甲
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStance('barrier')}
                className={`p-2.5 rounded-xl border text-left transition-colors ${
                  stance === 'barrier'
                    ? 'bg-sky-950/90 border-sky-400 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300">
                  <Shield className="w-3.5 h-3.5" />
                  <span>晶盾防禦</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  65% 傷害，並獲得 +42 護盾抵擋強敵
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStance('overcharge')}
                className={`p-2.5 rounded-xl border text-left transition-colors ${
                  stance === 'overcharge'
                    ? 'bg-amber-950/90 border-amber-400 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <Zap className="w-3.5 h-3.5" />
                  <span>催化蓄能</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  回復 30 HP，且下回合合成傷害 ×1.75
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Boss Showcase & Elemental Shield Weakness Panel */}
        <div
          className={`lg:col-span-7 bg-slate-900/95 border border-rose-900/60 rounded-2xl p-5 flex flex-col justify-between transition-transform ${
            bossHitShake ? 'animate-shake border-amber-400' : ''
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* Boss Visual Portrait */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-rose-500/50 bg-slate-950 shrink-0 flex items-center justify-center relative">
              {boss.imageUrl && !bossImgBroken ? (
                <img
                  src={boss.imageUrl}
                  alt={boss.name}
                  referrerPolicy="no-referrer"
                  onError={() => setBossImgBroken(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg viewBox="0 0 100 100" className="w-24 h-24">
                  <polygon
                    points="50,10 88,35 76,85 24,85 12,35"
                    fill={boss.accentColor}
                    fillOpacity="0.25"
                    stroke={boss.accentColor}
                    strokeWidth="3"
                  />
                  <circle cx="38" cy="48" r="5" fill="#f43f5e" />
                  <circle cx="62" cy="48" r="5" fill="#f43f5e" />
                  <path d="M35 66 L50 60 L65 66" stroke="#f8fafc" strokeWidth="3" fill="none" />
                </svg>
              )}
            </div>

            {/* Boss HP & Active Shield Info */}
            <div className="flex-1 w-full space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-white">{boss.name}</span>
                <span className="font-chem text-sm font-bold text-rose-300 tabular-nums">
                  魔王 HP: {bossHp} / {boss.maxHp}
                </span>
              </div>

              <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-amber-500 transition-all duration-200"
                  style={{ width: `${Math.round((bossHp / boss.maxHp) * 100)}%` }}
                />
              </div>

              {/* Active Shield Weakness Telegraph Box */}
              <div className="bg-slate-950/90 border border-amber-500/40 rounded-xl p-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300">
                    當前護盾：{currentShield.shieldName}
                  </span>
                  <span className="text-rose-300 font-chem tabular-nums flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    預告攻擊：{currentShield.telegraphAttackName}（傷害 {currentShield.telegraphDamage}）
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {currentShield.description}
                </p>
              </div>
            </div>
          </div>

          {/* Battle Combat Log */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="text-xs text-slate-300 font-medium truncate">
              戰況紀錄：{battleLog[0]}
            </div>
          </div>
        </div>
      </div>

      {/* Victory or Defeat Modal Overlay */}
      {battleOutcome !== 'playing' && (
        <div className="bg-slate-900 border-2 border-amber-400 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          {battleOutcome === 'victory' ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mx-auto">
                <Trophy className="w-8 h-8 text-amber-300" />
              </div>
              <h3 className="text-2xl font-bold text-white">
                討伐成功！擊破「{boss.name}」
              </h3>
              <p className="text-sm text-slate-300 max-w-xl mx-auto">
                你運用精準的離子電荷平衡與弱點合成策略，成功瓦解了魔王的元素結界！
              </p>
              <div className="flex items-center justify-center gap-6 text-sm font-chem font-bold text-amber-300 tabular-nums">
                <span>獲得經驗值 +{boss.xpReward} EXP</span>
                <span>·</span>
                <span>獲得鍊金結晶 +{boss.crystalReward}</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRestartBattle}
                  className="px-4 py-2.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl whitespace-nowrap shrink-0"
                >
                  再次挑戰不同策略
                </button>
                <button
                  type="button"
                  onClick={onExitBattle}
                  className="px-4 py-2.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl whitespace-nowrap shrink-0"
                >
                  返回本章工坊
                </button>
                {onAdvanceNextChapter && chapter.id < 5 && (
                  <button
                    type="button"
                    onClick={onAdvanceNextChapter}
                    className="px-5 py-2.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl whitespace-nowrap shrink-0"
                  >
                    前往下一章冒險 →
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-400/50 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-rose-300" />
              </div>
              <h3 className="text-xl font-bold text-white">
                鍊金護盾耗盡，挑戰未竟全功！
              </h3>
              <p className="text-xs text-slate-300 max-w-lg mx-auto">
                別氣餒！針對魔王的護盾提示合成「2.4 倍弱點化合物」可使魔王當回合攻擊力減半，也可善用「晶盾防禦」或「催化蓄能」回復生命！
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRestartBattle}
                  className="px-5 py-2.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl whitespace-nowrap shrink-0"
                >
                  立即重新挑戰
                </button>
                <button
                  type="button"
                  onClick={onExitBattle}
                  className="px-4 py-2.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl whitespace-nowrap shrink-0"
                >
                  回工坊複習秘笈
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Combat Crucible Action Strip */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Cation Quick Control */}
          <div className="md:col-span-4 bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-sky-400 font-semibold">陽離子（+）</div>
              {selectedCationId && ION_MAP[selectedCationId] ? (
                <div className="flex items-center gap-2 mt-0.5">
                  <IonSymbolDisplay
                    baseFormula={ION_MAP[selectedCationId].baseFormula}
                    charge={ION_MAP[selectedCationId].charge}
                    className="text-lg font-bold text-white"
                  />
                  <span className="text-xs text-slate-300">
                    {ION_MAP[selectedCationId].name}
                  </span>
                </div>
              ) : (
                <div className="text-xs text-slate-500 mt-0.5">請點選下方陽離子</div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCationCount(n)}
                  className={`w-7 h-7 rounded font-chem text-xs font-bold tabular-nums ${
                    cationCount === n
                      ? 'bg-sky-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Center Formula & Fire Button */}
          <div className="md:col-span-4 flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">合成預覽：</span>
              {liveEval.constructedFormula ? (
                <CompoundFormulaDisplay
                  formula={liveEval.constructedFormula}
                  className="text-2xl font-bold text-amber-300"
                />
              ) : (
                <span className="text-xs text-slate-500">尚未選擇</span>
              )}
              <span className="text-xs font-chem text-slate-400 tabular-nums">
                ({liveEval.netCharge === 0 && selectedCationId && selectedAnionId ? '電中性' : `淨電荷 ${liveEval.netCharge >= 0 ? `+${liveEval.netCharge}` : liveEval.netCharge}`})
              </span>
            </div>

            <button
              type="button"
              onClick={handleExecuteCombatTurn}
              disabled={battleOutcome !== 'playing'}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Swords className="w-4 h-4" />
              <span>發動合成詠唱（執行本回合）</span>
            </button>
          </div>

          {/* Anion Quick Control */}
          <div className="md:col-span-4 bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-rose-400 font-semibold">陰離子（−）</div>
              {selectedAnionId && ION_MAP[selectedAnionId] ? (
                <div className="flex items-center gap-2 mt-0.5">
                  <IonSymbolDisplay
                    baseFormula={ION_MAP[selectedAnionId].baseFormula}
                    charge={ION_MAP[selectedAnionId].charge}
                    className="text-lg font-bold text-white"
                  />
                  <span className="text-xs text-slate-300">
                    {ION_MAP[selectedAnionId].name}
                  </span>
                </div>
              ) : (
                <div className="text-xs text-slate-500 mt-0.5">請點選下方陰離子</div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setAnionCount(n)}
                  className={`w-7 h-7 rounded font-chem text-xs font-bold tabular-nums ${
                    anionCount === n
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Battle Hand Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="text-xs font-bold text-sky-300">
            戰鬥手牌：陽離子（+）
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {cations.map((card) => (
              <IonCardComponent
                key={card.id}
                card={card}
                stat={progress.ionStats[card.id]}
                isSelected={selectedCationId === card.id}
                onSelect={handleCardSelect}
                hideValenceByRule={progress.settings.blindMasteryMode}
                royalSkin={progress.equippedCardSkin === 'skin-royal'}
                compact
              />
            ))}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="text-xs font-bold text-rose-300">
            戰鬥手牌：陰離子（−）
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {anions.map((card) => (
              <IonCardComponent
                key={card.id}
                card={card}
                stat={progress.ionStats[card.id]}
                isSelected={selectedAnionId === card.id}
                onSelect={handleCardSelect}
                hideValenceByRule={progress.settings.blindMasteryMode}
                royalSkin={progress.equippedCardSkin === 'skin-royal'}
                compact
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
