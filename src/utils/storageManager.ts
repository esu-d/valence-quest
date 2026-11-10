import { ION_CARDS } from '../data/chemistryData';
import { ALCHEMIST_TITLES } from '../data/chaptersData';

export interface IonMasteryStat {
  ionId: string;
  successCount: number;
  mistakeCount: number;
  masteryLevel: 0 | 1 | 2 | 3; // 0: 初識, 1: 熟悉, 2: 專精(自動隱藏價數練習), 3: 大師
  lastPracticedAt: number;
  needsSpacedReview: boolean;
}

export interface MistakeLogEntry {
  id: string;
  timestamp: number;
  cationId: string;
  anionId: string;
  attemptedFormula: string;
  targetFormula?: string;
  mistakeType: 'charge_imbalance' | 'not_simplest_ratio' | 'polyatomic_paren' | 'wrong_target';
  diagnosticText: string;
  resolved: boolean;
}

export interface DailyQuestItem {
  id: string;
  title: string;
  targetCount: number;
  currentCount: number;
  xpReward: number;
  crystalReward: number;
  claimed: boolean;
  type: 'synthesize_any' | 'polyatomic_synth' | 'no_hint_synth';
}

export interface PlayerProgressState {
  playerName: string;
  xp: number;
  crystals: number;
  completedChallenges: string[];
  defeatedBosses: string[];
  discoveredCompounds: string[];
  ionStats: Record<string, IonMasteryStat>;
  mistakeLogs: MistakeLogEntry[];
  unlockedCosmetics: string[];
  equippedCrucible: string;
  equippedCardSkin: string;
  unlockedAchievements: string[];
  blindSynthSuccessCount: number;
  parenSynthSuccessCount: number;
  totalSynthSuccessCount: number;
  totalAttemptsCount: number;
  recentAccuracyWindow: boolean[]; // Last 10 attempts for Flow difficulty adjustment
  dailyQuests: DailyQuestItem[];
  settings: {
    soundMuted: boolean;
    reduceMotion: boolean;
    blindMasteryMode: boolean; // 精通無提示模式（全部隱藏價數）
    autoHideMasteredValence: boolean; // 隨熟練度達 Lv.2 自動遮蔽價數鼓勵主動回憶
  };
}

const STORAGE_KEY = 'valence_alchemist_save_v1';

export function createInitialProgress(): PlayerProgressState {
  const initialIonStats: Record<string, IonMasteryStat> = {};
  ION_CARDS.forEach((card) => {
    initialIonStats[card.id] = {
      ionId: card.id,
      successCount: 0,
      mistakeCount: 0,
      masteryLevel: 0,
      lastPracticedAt: 0,
      needsSpacedReview: false,
    };
  });

  return {
    playerName: '艾莉絲',
    xp: 0,
    crystals: 50,
    completedChallenges: [],
    defeatedBosses: [],
    discoveredCompounds: [],
    ionStats: initialIonStats,
    mistakeLogs: [],
    unlockedCosmetics: ['crucible-bronze'],
    equippedCrucible: 'crucible-bronze',
    equippedCardSkin: 'default',
    unlockedAchievements: [],
    blindSynthSuccessCount: 0,
    parenSynthSuccessCount: 0,
    totalSynthSuccessCount: 0,
    totalAttemptsCount: 0,
    recentAccuracyWindow: [true, true, true],
    dailyQuests: generateFreshDailyQuests(),
    settings: {
      soundMuted: false,
      reduceMotion: false,
      blindMasteryMode: false,
      autoHideMasteredValence: true,
    },
  };
}

export function generateFreshDailyQuests(): DailyQuestItem[] {
  return [
    {
      id: 'dq-1',
      title: '完成 3 次電中性化合物合成',
      targetCount: 3,
      currentCount: 0,
      xpReward: 80,
      crystalReward: 30,
      claimed: false,
      type: 'synthesize_any',
    },
    {
      id: 'dq-2',
      title: '成功合成 2 次含「原子團（根）」的化合物',
      targetCount: 2,
      currentCount: 0,
      xpReward: 100,
      crystalReward: 40,
      claimed: false,
      type: 'polyatomic_synth',
    },
    {
      id: 'dq-3',
      title: '在不查看提示或隱藏價數狀態下完成 2 次合成',
      targetCount: 2,
      currentCount: 0,
      xpReward: 120,
      crystalReward: 45,
      claimed: false,
      type: 'no_hint_synth',
    },
  ];
}

export function loadPlayerProgress(): PlayerProgressState {
  if (typeof window === 'undefined') return createInitialProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialProgress();
    const parsed = JSON.parse(raw) as Partial<PlayerProgressState>;
    const defaults = createInitialProgress();
    const mergedIonStats = { ...defaults.ionStats, ...(parsed.ionStats || {}) };
    return {
      ...defaults,
      ...parsed,
      ionStats: mergedIonStats,
      settings: {
        ...defaults.settings,
        ...(parsed.settings || {}),
      },
    };
  } catch {
    return createInitialProgress();
  }
}

export function savePlayerProgress(state: PlayerProgressState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function calculateLevelInfo(xp: number) {
  const level = Math.min(5, Math.floor(xp / 250) + 1);
  const currentLevelStartXp = (level - 1) * 250;
  const nextLevelXp = level * 250;
  const progressPercent =
    level >= 5 ? 100 : Math.min(100, Math.round(((xp - currentLevelStartXp) / 250) * 100));
  const titleObj = ALCHEMIST_TITLES.find((t) => t.level === level) || ALCHEMIST_TITLES[0];
  const maxHp = 100 + (level - 1) * 20;

  return {
    level,
    title: titleObj.title,
    perkDescription: titleObj.perkDescription,
    xpInCurrentLevel: xp - currentLevelStartXp,
    xpRequiredForNext: 250,
    nextLevelXp,
    progressPercent,
    maxHp,
  };
}

export function computeMasteryLevel(successCount: number): 0 | 1 | 2 | 3 {
  if (successCount >= 8) return 3;
  if (successCount >= 4) return 2;
  if (successCount >= 1) return 1;
  return 0;
}

export function getMasteryLabel(level: 0 | 1 | 2 | 3): string {
  switch (level) {
    case 0:
      return 'Lv.0 初識';
    case 1:
      return 'Lv.1 熟悉';
    case 2:
      return 'Lv.2 專精';
    case 3:
      return 'Lv.3 大師';
  }
}

/**
 * Flow Theory State Evaluator:
 * Analyzes recent accuracy window to determine whether the student is in Flow, Needs Support, or Ready for Mastery Challenge.
 */
export function evaluateFlowState(recentWindow: boolean[]): {
  stateLabel: string;
  advice: string;
  recommendedMode: 'assist' | 'flow' | 'challenge';
} {
  if (recentWindow.length === 0) {
    return {
      stateLabel: '探索暖身中',
      advice: '系統正根據你的合成表現自動調節提示強度。',
      recommendedMode: 'flow',
    };
  }
  const correctCount = recentWindow.filter(Boolean).length;
  const rate = correctCount / recentWindow.length;

  if (rate >= 0.85 && recentWindow.length >= 4) {
    return {
      stateLabel: '高昂心流（建議開啟無提示挑戰）',
      advice: '你的近期電荷平衡準確率超過 85%！系統已為專精卡牌隱藏價數，鍛鍊主動提取記憶。',
      recommendedMode: 'challenge',
    };
  }
  if (rate < 0.5) {
    return {
      stateLabel: '階梯引導輔助中',
      advice: '別急！系統已自動展開最小公倍數天平提示，先看清楚正負電荷差距再調整數量。',
      recommendedMode: 'assist',
    };
  }
  return {
    stateLabel: '穩定心流狀態',
    advice: '挑戰難度與你的熟練度完美匹配，繼續保持！',
    recommendedMode: 'flow',
  };
}
