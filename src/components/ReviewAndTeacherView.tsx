import React, { useState, useMemo } from 'react';
import { ION_CARDS, ION_MAP } from '../data/chemistryData';
import { CHAPTERS_DATA } from '../data/chaptersData';
import {
  PlayerProgressState,
  getMasteryLabel,
  evaluateFlowState,
} from '../utils/storageManager';
import { IonSymbolDisplay, CompoundFormulaDisplay } from './FormulaDisplay';
import {
  BookCheck,
  GraduationCap,
  Play,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface ReviewAndTeacherViewProps {
  progress: PlayerProgressState;
  onStartSpacedReviewSession: (ionIds: string[]) => void;
  onMarkMistakeResolved: (mistakeId: string) => void;
}

export const ReviewAndTeacherView: React.FC<ReviewAndTeacherViewProps> = ({
  progress,
  onStartSpacedReviewSession,
  onMarkMistakeResolved,
}) => {
  const [activeTab, setActiveTab] = useState<'student_review' | 'teacher_dashboard'>('student_review');
  const [teacherDataSource, setTeacherDataSource] = useState<'current_student' | 'class_cohort'>('current_student');

  const flowInfo = evaluateFlowState(progress.recentAccuracyWindow);

  // Identify ions that need spaced repetition review
  const weakOrUnpracticedIons = useMemo(() => {
    return ION_CARDS.map((card) => {
      const st = progress.ionStats[card.id];
      return {
        card,
        stat: st,
        priorityScore:
          (st?.mistakeCount ?? 0) * 3 +
          (st?.needsSpacedReview ? 4 : 0) -
          (st?.masteryLevel ?? 0),
      };
    })
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 6);
  }, [progress.ionStats]);

  const accuracyPercent =
    progress.totalAttemptsCount > 0
      ? Math.round((progress.totalSynthSuccessCount / progress.totalAttemptsCount) * 100)
      : 100;

  // Compute Category Mastery for Teacher Dashboard
  const categoryStats = useMemo(() => {
    const groups = [
      {
        label: '+1 價陽離子（H⁺、Na⁺、K⁺、Ag⁺）',
        filter: (id: string) => ION_MAP[id]?.charge === 1 && !ION_MAP[id]?.isPolyatomic,
        simulatedClassRate: 92,
      },
      {
        label: '+2 價陽離子（Mg²⁺、Ca²⁺、Ba²⁺、Cu²⁺、Zn²⁺）',
        filter: (id: string) =>
          ION_MAP[id]?.charge === 2 && !['Fe2+', 'Pb2+'].includes(id),
        simulatedClassRate: 84,
      },
      {
        label: '+3 價與多價金屬（Al³⁺、Fe³⁺、Fe²⁺、Pb²⁺）',
        filter: (id: string) => ['Al3+', 'Fe3+', 'Fe2+', 'Pb2+'].includes(id),
        simulatedClassRate: 71,
      },
      {
        label: '單原子陰離子（Cl⁻、Br⁻、I⁻、O²⁻、S²⁻）',
        filter: (id: string) => ION_MAP[id]?.charge < 0 && !ION_MAP[id]?.isPolyatomic,
        simulatedClassRate: 88,
      },
      {
        label: '多原子離子／原子團（OH⁻、NO₃⁻、HCO₃⁻、SO₄²⁻、CO₃²⁻、PO₄³⁻、NH₄⁺）',
        filter: (id: string) => Boolean(ION_MAP[id]?.isPolyatomic),
        simulatedClassRate: 66,
      },
    ];

    return groups.map((g) => {
      const matchingIons = ION_CARDS.filter((c) => g.filter(c.id));
      const masteredCount = matchingIons.filter(
        (c) => (progress.ionStats[c.id]?.masteryLevel ?? 0) >= 1
      ).length;
      const studentRate = Math.round((masteredCount / Math.max(1, matchingIons.length)) * 100);
      return {
        label: g.label,
        ionCount: matchingIons.length,
        masteredCount,
        rate: teacherDataSource === 'class_cohort' ? g.simulatedClassRate : studentRate,
      };
    });
  }, [progress.ionStats, teacherDataSource]);

  const handleExportCsvReport = () => {
    const headers = ['離子代號,離子名稱,電荷,是否為原子團,熟練度等級,成功合成次數,錯誤次數\n'];
    const rows = ION_CARDS.map((c) => {
      const st = progress.ionStats[c.id];
      return `${c.id},${c.name},${c.charge > 0 ? `+${c.charge}` : c.charge},${
        c.isPolyatomic ? '是' : '否'
      },${getMasteryLabel(st?.masteryLevel ?? 0)},${st?.successCount ?? 0},${
        st?.mistakeCount ?? 0
      }`;
    });
    const csvContent = '\uFEFF' + headers.concat(rows.join('\n')).join('');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `價數鍊金師_學習診斷報告_${progress.playerName}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('student_review')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'student_review'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <BookCheck className="w-3.5 h-3.5" />
            <span>錯題複習與間隔練習</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('teacher_dashboard')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'teacher_dashboard'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>教師教學診斷儀表板</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 font-chem tabular-nums">
          化學式書寫正確率：<span className="text-emerald-400 font-bold">{accuracyPercent}%</span> · 累計成功合成：<span className="text-white font-bold">{progress.totalSynthSuccessCount} 次</span>
        </div>
      </div>

      {/* TAB 1: Student Spaced Repetition & Mistake Review */}
      {activeTab === 'student_review' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 5 Cols: Spaced Repetition Queue */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="space-y-1">
              <div className="text-xs text-amber-300 font-semibold">
                間隔練習與提取系統（Spaced Repetition）
              </div>
              <h3 className="text-lg font-bold text-white">
                優先推薦複習的離子卡牌
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                系統會根據你的答錯紀錄與熟練度間隔，自動挑選最需要加強記憶的離子，避免只重複練習已經滾瓜爛熟的題目。
              </p>
            </div>

            <div className="space-y-2.5">
              {weakOrUnpracticedIons.map(({ card, stat }) => (
                <div
                  key={card.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <IonSymbolDisplay
                      baseFormula={card.baseFormula}
                      charge={card.charge}
                      className="text-xl font-bold text-white w-14"
                    />
                    <div>
                      <div className="text-sm font-bold text-slate-100">
                        {card.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-chem tabular-nums">
                        {getMasteryLabel(stat?.masteryLevel ?? 0)} · 成功 {stat?.successCount ?? 0} 次 · 待複習失誤 {stat?.mistakeCount ?? 0} 次
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onStartSpacedReviewSession([card.id])}
                    className="px-3 py-1.5 text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <Play className="w-3 h-3" />
                    <span>專項特訓</span>
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                onStartSpacedReviewSession(weakOrUnpracticedIons.map((w) => w.card.id))
              }
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>啟動綜合弱點間隔特訓（3 分鐘快速複習）</span>
            </button>
          </div>

          {/* Right 7 Cols: Diagnostic Mistake History */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  診斷式錯題與觀念釐清筆記
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  每次合成失誤都會自動記錄原因（電荷差距、未約分最簡整數比、或原子團括號遺漏）。
                </p>
              </div>
              <span className="text-xs font-chem text-slate-400 tabular-nums">
                共 {progress.mistakeLogs.length} 筆紀錄
              </span>
            </div>

            {progress.mistakeLogs.length === 0 ? (
              <div className="py-12 text-center space-y-2 border border-dashed border-slate-800 rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="text-sm font-bold text-slate-200">
                  目前沒有未釐清的錯題紀錄！
                </div>
                <p className="text-xs text-slate-400">
                  去挑戰更高章節的原子團森林或開啟「精通無提示模式」測試實力吧！
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {progress.mistakeLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 rounded-xl border ${
                      log.resolved
                        ? 'bg-slate-950/50 border-slate-800/80 opacity-70'
                        : 'bg-slate-950 border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>
                          {log.mistakeType === 'charge_imbalance'
                            ? '電荷未平衡'
                            : log.mistakeType === 'not_simplest_ratio'
                            ? '未化為最簡整數比'
                            : log.mistakeType === 'polyatomic_paren'
                            ? '多原子離子（根）括號錯誤'
                            : '化合物配對失誤'}
                        </span>
                        <span className="text-slate-400 font-normal">
                          · 涉及離子：{log.cationId} 與 {log.anionId}
                        </span>
                      </div>

                      {!log.resolved ? (
                        <button
                          type="button"
                          onClick={() => onMarkMistakeResolved(log.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded whitespace-nowrap shrink-0"
                        >
                          標記已學會
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-400">✓ 已複習訂正</span>
                      )}
                    </div>

                    <p className="text-xs text-slate-200 mt-2 leading-relaxed">
                      {log.diagnosticText}
                    </p>

                    <div className="mt-2 pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400 font-chem">
                      <span>
                        當時嘗試寫法：
                        <CompoundFormulaDisplay
                          formula={log.attemptedFormula || '無'}
                          className="text-rose-300 font-bold ml-1"
                        />
                      </span>
                      {log.targetFormula && (
                        <span>
                          目標正確化學式：
                          <CompoundFormulaDisplay
                            formula={log.targetFormula}
                            className="text-emerald-300 font-bold ml-1"
                          />
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Teacher Formative Assessment Dashboard */}
      {activeTab === 'teacher_dashboard' && (
        <div className="space-y-6">
          {/* Teacher Header Bar */}
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs text-sky-400 font-semibold">
                國中自然科學（理化）形成性評量與迷思診斷系統 · 隱私保護設計（不公開個人排名）
              </div>
              <h3 className="text-xl font-bold text-white">
                教師教學管理儀表板
              </h3>
              <p className="text-xs text-slate-400">
                可切換檢視「本機當前學生學習數據」或「八年級班級整體模擬分析（28 人）」，協助教師快速掌握課堂常見價數與化學式迷思。
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTeacherDataSource('current_student')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 ${
                    teacherDataSource === 'current_student'
                      ? 'bg-sky-500 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  當前學生數據
                </button>
                <button
                  type="button"
                  onClick={() => setTeacherDataSource('class_cohort')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 ${
                    teacherDataSource === 'class_cohort'
                      ? 'bg-sky-500 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  全班整體分析模擬 (28人)
                </button>
              </div>

              <button
                type="button"
                onClick={handleExportCsvReport}
                className="px-3.5 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>匯出 CSV 診斷報表</span>
              </button>
            </div>
          </div>

          {/* 4-Column Summary KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400">已掌握離子卡牌數</div>
              <div className="text-2xl font-bold text-white font-chem tabular-nums mt-1">
                {teacherDataSource === 'class_cohort'
                  ? '18.4 / 22'
                  : `${
                      ION_CARDS.filter(
                        (c) => (progress.ionStats[c.id]?.masteryLevel ?? 0) >= 1
                      ).length
                    } / ${ION_CARDS.length}`}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {teacherDataSource === 'class_cohort'
                  ? '全班平均已熟悉 83% 離子價數'
                  : `心流狀態：${flowInfo.stateLabel}`}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400">化學式書寫正確率</div>
              <div className="text-2xl font-bold text-emerald-400 font-chem tabular-nums mt-1">
                {teacherDataSource === 'class_cohort' ? '78.6%' : `${accuracyPercent}%`}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                含電荷平衡、最簡整數比與括號檢核
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400">無提示主動提取次數</div>
              <div className="text-2xl font-bold text-sky-300 font-chem tabular-nums mt-1">
                {teacherDataSource === 'class_cohort'
                  ? '平均 14.2 次'
                  : `${progress.blindSynthSuccessCount} 次`}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                在隱藏價數下成功回憶並完成合成
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400">多原子離子括號掌握率</div>
              <div className="text-2xl font-bold text-amber-300 font-chem tabular-nums mt-1">
                {teacherDataSource === 'class_cohort'
                  ? '68.5%'
                  : `${progress.parenSynthSuccessCount} 次成功`}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                如 Ca(OH)₂、Al₂(SO₄)₃、(NH₄)₂SO₄
              </div>
            </div>
          </div>

          {/* 2-Column Detailed Analysis: Valence Mastery Matrix vs Common Misconceptions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 6 Cols: Valence Category Mastery & Chapter Progress */}
            <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
              <h4 className="text-base font-bold text-white">
                各類價數與原子團掌握度分析
              </h4>
              <div className="space-y-3.5">
                {categoryStats.map((cat, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-200 font-medium">{cat.label}</span>
                      <span className="font-chem font-bold text-sky-300 tabular-nums">
                        {cat.rate}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-sky-500 transition-all duration-300"
                        style={{ width: `${cat.rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white">
                  五章節課程完成情形
                </h4>
                <div className="space-y-2">
                  {CHAPTERS_DATA.map((ch) => {
                    const doneCount = ch.challenges.filter((q) =>
                      progress.completedChallenges.includes(q.id)
                    ).length;
                    const bossDone = progress.defeatedBosses.includes(ch.boss.id);
                    const pct =
                      teacherDataSource === 'class_cohort'
                        ? Math.max(25, 100 - (ch.id - 1) * 18)
                        : Math.round(
                            ((doneCount + (bossDone ? 1 : 0)) /
                              (ch.challenges.length + 1)) *
                              100
                          );
                    return (
                      <div
                        key={ch.id}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 flex items-center justify-between text-xs font-chem tabular-nums"
                      >
                        <span className="text-slate-200 font-sans font-semibold">
                          {ch.title}（{ch.valenceFocus}）
                        </span>
                        <span className="text-emerald-400 font-bold">
                          完成度 {pct}% {bossDone && teacherDataSource === 'current_student' ? '· 魔王已討伐' : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right 6 Cols: Top Misconceptions & Pedagogical Action Guide */}
            <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div>
                <h4 className="text-base font-bold text-white">
                  容易答錯的價數與化學式迷思診斷
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  針對學生在合成時最常觸發的錯誤類型，提供具體課堂教學建議。
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-300">
                      迷思一：多原子離子（原子團）個數 ≥ 2 時漏寫括號
                    </span>
                    <span className="font-chem text-slate-400 tabular-nums">
                      高發於第四章
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    學生常理解 Ca²⁺ 需配 2 個 OH⁻，但寫成 CaOH₂（誤為 1 個氧、2 個氫）而非正確的 Ca(OH)₂；或將硫酸鋁寫成 Al₂SO₄₃。
                  </p>
                  <div className="text-[11px] text-sky-300 pt-1">
                    教學建議：請學生在工坊勾選「手動挑戰原子團括號 () 判斷」，強化「把根當成整體打包」的視覺概念。
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-300">
                      迷思二：碳酸根（CO₃²⁻）與碳酸氫根（HCO₃⁻）價數混淆
                    </span>
                    <span className="font-chem text-slate-400 tabular-nums">
                      蘇打 vs 小蘇打
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    容易把小蘇打（碳酸氫鈉 NaHCO₃）誤記成 Na₂HCO₃。可引導學生推導：CO₃²⁻（−2）結合 1 個 H⁺（+1）後，整體只剩 −1 電荷！
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-300">
                      迷思三：+2 配 −2 時忘記約分為「最簡整數比」
                    </span>
                    <span className="font-chem text-slate-400 tabular-nums">
                      高發於第二章
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    使用十字交叉法時，部分學生會將 Mg²⁺ 與 O²⁻ 直接交叉寫成 Mg₂O₂ 或 Ca₂(SO₄)₂，需提醒離子化合物必取最簡整數比 1 : 1（MgO、CaSO₄）。
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-300">
                      迷思四：鐵離子（Fe³⁺）與亞鐵離子（Fe²⁺）命名對應
                    </span>
                    <span className="font-chem text-slate-400 tabular-nums">
                      高發於第三章
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    題目要求「氧化鐵」時誤選 Fe²⁺ 合成出 FeO（氧化亞鐵）。強調口訣：「高價正常叫（鐵 +3），低價加個亞（亞鐵 +2）」。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
