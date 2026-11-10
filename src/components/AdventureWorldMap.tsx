import React from 'react';
import { CHAPTERS_DATA, ChapterData } from '../data/chaptersData';
import {
  PlayerProgressState,
  calculateLevelInfo,
  evaluateFlowState,
} from '../utils/storageManager';
import { CompoundFormulaDisplay } from './FormulaDisplay';
import {
  Compass,
  Swords,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  EyeOff,
  Flame,
} from 'lucide-react';

interface AdventureWorldMapProps {
  progress: PlayerProgressState;
  selectedChapterId: number;
  onSelectChapterAndEnterWorkshop: (chapterId: number, challengeId?: string) => void;
  onSelectChapterAndEnterBoss: (chapterId: number) => void;
  onClaimDailyQuest: (questId: string) => void;
  onRefreshDailyQuests: () => void;
  onToggleBlindMasteryMode: () => void;
}

export const AdventureWorldMap: React.FC<AdventureWorldMapProps> = ({
  progress,
  selectedChapterId,
  onSelectChapterAndEnterWorkshop,
  onSelectChapterAndEnterBoss,
  onClaimDailyQuest,
  onRefreshDailyQuests,
  onToggleBlindMasteryMode,
}) => {
  const levelInfo = calculateLevelInfo(progress.xp);
  const flowInfo = evaluateFlowState(progress.recentAccuracyWindow);

  return (
    <div className="space-y-8">
      {/* Top Hero Overview Banner: Player Status, Flow Indicator & Mastery Toggle */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-7 space-y-2">
          <div className="text-xs font-semibold text-amber-300">
            元素王國冒險地圖 · Lv.{levelInfo.level} {levelInfo.title}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            選擇冒險區域，展開電中性調合試煉
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            自由選擇任一章節路線、合成任務或守關魔王。當離子卡牌熟練度達 Lv.2 專精時，系統將逐步隱藏價數，幫助你從視覺記憶進階到直覺秒答！
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400 font-chem tabular-nums">
            <span>當前心流診斷：<strong className="text-sky-300">{flowInfo.stateLabel}</strong></span>
            <span>·</span>
            <span>已登錄化合物：<strong className="text-emerald-300">{progress.discoveredCompounds.length} / 58</strong></span>
            <span>·</span>
            <span>已擊破魔王：<strong className="text-rose-300">{progress.defeatedBosses.length} / 5</strong></span>
          </div>
        </div>

        {/* Right 5 Cols: Mastery Blind Mode Switch & Quick Continue */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <EyeOff className="w-4 h-4" />
              <span>精通挑戰：全卡牌無提示模式</span>
            </div>
            <button
              type="button"
              onClick={onToggleBlindMasteryMode}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                progress.settings.blindMasteryMode
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {progress.settings.blindMasteryMode ? '已開啟（隱藏全部價數）' : '點擊開啟無提示挑戰'}
            </button>
          </div>
          <p className="text-xs text-slate-400">
            開啟後，所有離子卡牌上的 +1、+2、−2 等電荷將隱藏為「?」，考驗你對離子價數表的真實記憶，每次成功合成額外獲得 +25% 經驗值！
          </p>
        </div>
      </div>

      {/* 5 Kingdom Regions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {CHAPTERS_DATA.map((ch: ChapterData) => {
          const completedCount = ch.challenges.filter((q) =>
            progress.completedChallenges.includes(q.id)
          ).length;
          const bossDefeated = progress.defeatedBosses.includes(ch.boss.id);
          const isSelected = selectedChapterId === ch.id;

          return (
            <div
              key={ch.id}
              className={`rounded-2xl p-6 border flex flex-col justify-between transition-all ${
                isSelected
                  ? 'bg-slate-900 border-amber-400/80 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-900/85 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-4">
                {/* Chapter Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div
                      className="text-xs font-bold"
                      style={{ color: ch.accentColor }}
                    >
                      {ch.valenceFocus}
                    </div>
                    <h3 className="text-xl font-bold text-white mt-0.5">
                      {ch.title}
                    </h3>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {ch.subtitle}
                    </div>
                  </div>

                  <div className="text-right font-chem text-xs tabular-nums shrink-0">
                    <span className="text-slate-300 font-bold">
                      試煉 {completedCount}/{ch.challenges.length}
                    </span>
                    <div
                      className={`mt-0.5 font-semibold ${
                        bossDefeated ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {bossDefeated ? '★ 魔王已擊破' : '魔王待討伐'}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {ch.description}
                </p>

                {/* Quests Preview List */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] font-semibold text-slate-400">
                    本章代表合成試煉（點擊可直接進入）：
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {ch.challenges.map((q) => {
                      const done = progress.completedChallenges.includes(q.id);
                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => onSelectChapterAndEnterWorkshop(ch.id, q.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between border transition-colors ${
                            done
                              ? 'bg-emerald-950/50 border-emerald-700/40 text-emerald-200 hover:bg-emerald-900/50'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <span className="truncate font-medium">{q.targetName}</span>
                          <CompoundFormulaDisplay
                            formula={q.targetFormula}
                            className="text-[11px] font-bold text-amber-300 ml-1 shrink-0"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-5 mt-5 border-t border-slate-800 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onSelectChapterAndEnterWorkshop(ch.id)}
                  className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>進入合成工坊</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectChapterAndEnterBoss(ch.id)}
                  className="py-2.5 px-3.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Swords className="w-3.5 h-3.5" />
                  <span>討伐魔王</span>
                </button>
              </div>
            </div>
          );
        })}

        {/* 6th Grid Slot: Daily Short Quests Card (3-5 Minute Sessions, No Streak Pressure) */}
        <div className="bg-slate-900/95 border border-sky-800/60 rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-sky-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  <span>輕量日常委託（3～5 分鐘完成）</span>
                </div>
                <h3 className="text-xl font-bold text-white mt-0.5">
                  今日鍊金公會短任務
                </h3>
              </div>

              <button
                type="button"
                onClick={onRefreshDailyQuests}
                title="隨時刷新一組新的短任務"
                className="px-2.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <RefreshCw className="w-3 h-3" />
                <span>刷新委託</span>
              </button>
            </div>

            <p className="text-xs text-slate-400">
              不綁定連續登入天數，隨時打開玩一局就能累積經驗值與結晶！
            </p>

            <div className="space-y-2.5">
              {progress.dailyQuests.map((dq) => {
                const isReady = dq.currentCount >= dq.targetCount;
                return (
                  <div
                    key={dq.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-100 truncate">
                        {dq.title}
                      </div>
                      <div className="text-[11px] text-slate-400 font-chem tabular-nums mt-0.5">
                        進度 {dq.currentCount}/{dq.targetCount} · +{dq.xpReward} EXP · +{dq.crystalReward} 結晶
                      </div>
                    </div>

                    {dq.claimed ? (
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>已領取</span>
                      </span>
                    ) : isReady ? (
                      <button
                        type="button"
                        onClick={() => onClaimDailyQuest(dq.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1 whitespace-nowrap shrink-0 animate-pulse-scale"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>領取獎勵</span>
                      </button>
                    ) : (
                      <span className="text-xs font-chem text-slate-500 tabular-nums shrink-0">
                        進行中
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>完成任意章節合成皆可推進短任務進度</span>
            <span className="text-sky-300 font-semibold">隨時可重玩</span>
          </div>
        </div>
      </div>
    </div>
  );
};
