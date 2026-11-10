import { ION_MAP, VERIFIED_COMPOUNDS, VerifiedCompound, IonCardData } from '../data/chemistryData';

export type SynthesisStatus =
  | 'EMPTY'
  | 'MISSING_ION'
  | 'CHARGE_IMBALANCE'
  | 'NOT_SIMPLEST_RATIO'
  | 'PAREN_MISTAKE'
  | 'UNSTABLE_OR_UNKNOWN'
  | 'SUCCESS';

export interface SynthesisEvaluation {
  status: SynthesisStatus;
  cation: IonCardData | null;
  anion: IonCardData | null;
  cationCount: number;
  anionCount: number;
  totalPositiveCharge: number;
  totalNegativeCharge: number;
  netCharge: number;
  gcdValue: number;
  constructedFormula: string;
  wrongParenFormula?: string;
  compound: VerifiedCompound | null;
  feedbackTitle: string;
  feedbackMessage: string;
  detailedPrinciple: string;
  mistakeType?: 'charge_imbalance' | 'not_simplest_ratio' | 'polyatomic_paren' | 'wrong_target';
}

export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

export function buildChemicalFormulaString(
  cation: IonCardData,
  anion: IonCardData,
  cationCount: number,
  anionCount: number,
  useCationParens: boolean,
  useAnionParens: boolean
): string {
  // Special case: H+ and OH- -> H2O
  if (cation.id === 'H+' && anion.id === 'OH-' && cationCount === 1 && anionCount === 1) {
    return 'H2O';
  }

  const cPart =
    cationCount === 1
      ? useCationParens
        ? `(${cation.baseFormula})`
        : cation.baseFormula
      : useCationParens
      ? `(${cation.baseFormula})${cationCount}`
      : `${cation.baseFormula}${cationCount}`;

  const aPart =
    anionCount === 1
      ? useAnionParens
        ? `(${anion.baseFormula})`
        : anion.baseFormula
      : useAnionParens
      ? `(${anion.baseFormula})${anionCount}`
      : `${anion.baseFormula}${anionCount}`;

  return `${cPart}${aPart}`;
}

export function evaluateSynthesis(
  cationId: string | null,
  anionId: string | null,
  cationCount: number,
  anionCount: number,
  userCationParen?: boolean, // Optional manual parenthesis check in Mastery Mode
  userAnionParen?: boolean
): SynthesisEvaluation {
  const cation = cationId ? ION_MAP[cationId] || null : null;
  const anion = anionId ? ION_MAP[anionId] || null : null;

  const totalPositiveCharge = cation ? cation.charge * cationCount : 0;
  const totalNegativeCharge = anion ? anion.charge * anionCount : 0;
  const netCharge = totalPositiveCharge + totalNegativeCharge;

  if (!cation && !anion) {
    return {
      status: 'EMPTY',
      cation: null,
      anion: null,
      cationCount: 0,
      anionCount: 0,
      totalPositiveCharge: 0,
      totalNegativeCharge: 0,
      netCharge: 0,
      gcdValue: 1,
      constructedFormula: '',
      compound: null,
      feedbackTitle: '請將離子卡牌放入鍊金坩堝',
      feedbackMessage: '從下方卡牌區選擇 1 種陽離子（+）與 1 種陰離子（−），並調整數量使總電荷達到 0（電中性）。',
      detailedPrinciple: '離子化合物必為「電中性」：陽離子總正電量 ＝ 陰離子總負電量。',
    };
  }

  if (!cation || !anion || cationCount <= 0 || anionCount <= 0) {
    return {
      status: 'MISSING_ION',
      cation,
      anion,
      cationCount,
      anionCount,
      totalPositiveCharge,
      totalNegativeCharge,
      netCharge,
      gcdValue: 1,
      constructedFormula: cation
        ? `${cation.baseFormula}`
        : anion
        ? `${anion.baseFormula}`
        : '',
      compound: null,
      feedbackTitle: !cation ? '尚未放入陽離子（正離子）' : '尚未放入陰離子（負離子）',
      feedbackMessage: !cation
        ? `目前已放入陰離子 ${anion?.name}（總負電 ${totalNegativeCharge}），請再選擇一種帶正電的陽離子來平衡電荷！`
        : `目前已放入陽離子 ${cation?.name}（總正電 +${totalPositiveCharge}），請再選擇一種帶負電的陰離子來平衡電荷！`,
      detailedPrinciple: '同種電荷彼此排斥，必須由帶正電的陽離子與帶負電的陰離子互相吸引才能結合。',
    };
  }

  const requiredCationParen = cation.isPolyatomic && cationCount > 1;
  const requiredAnionParen = anion.isPolyatomic && anionCount > 1;

  const effectiveCationParen =
    userCationParen !== undefined ? userCationParen : requiredCationParen;
  const effectiveAnionParen =
    userAnionParen !== undefined ? userAnionParen : requiredAnionParen;

  const constructedFormula = buildChemicalFormulaString(
    cation,
    anion,
    cationCount,
    anionCount,
    effectiveCationParen,
    effectiveAnionParen
  );

  // Step 1: Check Charge Balance
  if (netCharge !== 0) {
    const absPos = totalPositiveCharge;
    const absNeg = Math.abs(totalNegativeCharge);
    const lcm = (cation.charge * Math.abs(anion.charge)) / gcd(cation.charge, Math.abs(anion.charge));
    const idealCationCount = lcm / cation.charge;
    const idealAnionCount = lcm / Math.abs(anion.charge);

    return {
      status: 'CHARGE_IMBALANCE',
      cation,
      anion,
      cationCount,
      anionCount,
      totalPositiveCharge,
      totalNegativeCharge,
      netCharge,
      gcdValue: 1,
      constructedFormula,
      compound: null,
      feedbackTitle: `電荷尚未平衡（淨電荷 ${netCharge > 0 ? `+${netCharge}` : netCharge}）`,
      feedbackMessage:
        netCharge > 0
          ? `目前正電荷（+${absPos}）比負電荷（−${absNeg}）多了 +${netCharge}！請增加「${anion.name}」的數量，或減少「${cation.name}」。`
          : `目前負電荷（−${absNeg}）比正電荷（+${absPos}）多了 −${Math.abs(netCharge)}！請增加「${cation.name}」的數量，或減少「${anion.name}」。`,
      detailedPrinciple: `提示：${cation.name} 每個帶 +${cation.charge}，${anion.name} 每個帶 ${anion.charge}。正負電量的最小公倍數為 ${lcm}（建議比例 ${idealCationCount} : ${idealAnionCount}）。`,
      mistakeType: 'charge_imbalance',
    };
  }

  // Step 2: Check Simplest Whole-Number Ratio (最簡整數比)
  const commonDivisor = gcd(cationCount, anionCount);
  if (commonDivisor > 1) {
    const simpC = cationCount / commonDivisor;
    const simpA = anionCount / commonDivisor;
    const idealFormula = buildChemicalFormulaString(
      cation,
      anion,
      simpC,
      simpA,
      cation.isPolyatomic && simpC > 1,
      anion.isPolyatomic && simpA > 1
    );
    return {
      status: 'NOT_SIMPLEST_RATIO',
      cation,
      anion,
      cationCount,
      anionCount,
      totalPositiveCharge,
      totalNegativeCharge,
      netCharge: 0,
      gcdValue: commonDivisor,
      constructedFormula,
      compound: null,
      feedbackTitle: '電荷已平衡，但尚未化為「最簡整數比」！',
      feedbackMessage: `太棒了！+${totalPositiveCharge} 與 ${totalNegativeCharge} 確實達到電中性，但離子化合物的化學式必須用「最簡整數比」表示。請將 ${cationCount} : ${anionCount} 同除以 ${commonDivisor}，調整為 ${simpC} : ${simpA}（${idealFormula}）！`,
      detailedPrinciple: '離子晶體是由無數個正負離子規則排列而成，並非獨立分子，因此化學式只標示正負離子的「最簡個數比」。',
      mistakeType: 'not_simplest_ratio',
    };
  }

  // Step 3: Check Manual Parentheses if in Mastery Parenthesis Check Mode
  if (
    (userCationParen !== undefined && userCationParen !== requiredCationParen) ||
    (userAnionParen !== undefined && userAnionParen !== requiredAnionParen)
  ) {
    const correctFormula = buildChemicalFormulaString(
      cation,
      anion,
      cationCount,
      anionCount,
      requiredCationParen,
      requiredAnionParen
    );
    return {
      status: 'PAREN_MISTAKE',
      cation,
      anion,
      cationCount,
      anionCount,
      totalPositiveCharge,
      totalNegativeCharge,
      netCharge: 0,
      gcdValue: 1,
      constructedFormula,
      wrongParenFormula: constructedFormula,
      compound: null,
      feedbackTitle: '注意多原子離子（根）的括號規則！',
      feedbackMessage:
        requiredAnionParen && !userAnionParen
          ? `當原子團「${anion.name}（${anion.baseFormula}）」數量大於 1 個（目前為 ${anionCount} 個）時，必須加上括號寫作 ${correctFormula}，否則寫成 ${constructedFormula} 會改變原子個數意義！`
          : requiredCationParen && !userCationParen
          ? `當原子團「${cation.name}（${cation.baseFormula}）」數量為 ${cationCount} 個時，必須加上括號寫作 ${correctFormula}！`
          : `當原子團只有 1 個或為單原子離子時，不需要加括號喔！正確寫法為 ${correctFormula}。`,
      detailedPrinciple: '原子團括號鐵則：原子團（如 OH⁻、NO₃⁻、SO₄²⁻、CO₃²⁻、NH₄⁺）個數 ≥ 2 時必加括號；個數為 1 時不加括號。',
      mistakeType: 'polyatomic_paren',
    };
  }

  // Step 4: Match against Verified Compounds or Curriculum Rules
  if (cation.id === 'H+' && anion.id === 'OH-' && cationCount === 1 && anionCount === 1) {
    const waterCompound: VerifiedCompound = {
      formula: 'H2O',
      name: '水（酸鹼中和產物）',
      commonName: '純水',
      cationId: 'H+',
      anionId: 'OH-',
      cationCount: 1,
      anionCount: 1,
      needsCationParens: false,
      needsAnionParens: false,
      category: '氧化物',
      combatTags: ['neutral'],
      description: '酸性的 H⁺ 與鹼性的 OH⁻ 以 1:1 結合生成中性的水（H₂O），並釋放中和熱！',
    };
    return {
      status: 'SUCCESS',
      cation,
      anion,
      cationCount,
      anionCount,
      totalPositiveCharge,
      totalNegativeCharge,
      netCharge: 0,
      gcdValue: 1,
      constructedFormula: 'H2O',
      compound: waterCompound,
      feedbackTitle: '酸鹼中和成功！合成「水 (H₂O)」',
      feedbackMessage: 'H⁺（+1）+ OH⁻（−1）→ H₂O！這是酸鹼中和反應最核心的離子反應式。',
      detailedPrinciple: `正電 (+1) + 負電 (−1) = 0。`,
    };
  }

  const matched = VERIFIED_COMPOUNDS.find(
    (c) =>
      c.cationId === cation.id &&
      c.anionId === anion.id &&
      c.cationCount === cationCount &&
      c.anionCount === anionCount
  );

  if (matched) {
    return {
      status: 'SUCCESS',
      cation,
      anion,
      cationCount,
      anionCount,
      totalPositiveCharge,
      totalNegativeCharge,
      netCharge: 0,
      gcdValue: 1,
      constructedFormula: matched.formula,
      compound: matched,
      feedbackTitle: `鍊金成功！合成「${matched.name}（${matched.formula}）」`,
      feedbackMessage: matched.description,
      detailedPrinciple: `電荷平衡：${cationCount} × (+${cation.charge}) + ${anionCount} × (${anion.charge}) = +${totalPositiveCharge} − ${Math.abs(
        totalNegativeCharge
      )} = 0（電中性）。化學式左正右負、由右向左讀作「${matched.name}」。`,
    };
  }

  // Handle chemically unstable combinations in aqueous chemistry (e.g., Fe3+ + CO32-, Al3+ + CO32-, Ag+ + OH-)
  const unstablePairs: Record<string, string> = {
    'Al3+_CO32-': '鋁離子（Al³⁺）與碳酸根（CO₃²⁻）在水中會發生完全雙水解反應生成 Al(OH)₃ 沉澱與 CO₂ 氣體，無法穩定存在碳酸鋁鹽類喔！請改配對 O²⁻、Cl⁻、OH⁻ 或 SO₄²⁻。',
    'Fe3+_CO32-': '鐵離子（Fe³⁺）與碳酸根（CO₃²⁻）在水中會雙水解生成 Fe(OH)₃ 紅褐色沉澱與 CO₂，無法穩定形成碳酸鐵！請嘗試 Fe₂O₃ 或 Fe₂(SO₄)₃。',
    'Al3+_S2-': '硫化鋁在水中會立即水解產生氫氧化鋁與硫化氫氣體，建議改合成氧化鋁（Al₂O₃）或硫酸鋁 Al₂(SO₄)₃。',
    'Fe3+_I-': '三價鐵離子（Fe³⁺）具氧化性，遇到碘離子（I⁻）會發生氧化還原反應轉變為 Fe²⁺ 與 I₂，建議使用 Pb²⁺、Ag⁺ 或 K⁺ 與碘離子結合！',
    'Cu2+_I-': '二價銅離子（Cu²⁺）與碘離子（I⁻）會發生氧化還原生成白色碘化亞銅（CuI）與碘單質，建議改用 Cl⁻、SO₄²⁻、O²⁻ 或 S²⁻。',
    'Ag+_OH-': '氫氧化銀（AgOH）極不穩定，在常溫水中會迅速分解為褐色的氧化銀（Ag₂O）沉澱與水。',
    'NH4+_OH-': 'NH₄⁺ 與 OH⁻ 在水中主要以一水合氨（NH₃·H₂O，氨水）分子形式存在，一般不寫作離子晶體化學式。',
  };

  const pairKey = `${cation.id}_${anion.id}`;
  if (unstablePairs[pairKey]) {
    return {
      status: 'UNSTABLE_OR_UNKNOWN',
      cation,
      anion,
      cationCount,
      anionCount,
      totalPositiveCharge,
      totalNegativeCharge,
      netCharge: 0,
      gcdValue: 1,
      constructedFormula,
      compound: null,
      feedbackTitle: '形式電荷平衡，但此組合在化學上不穩定！',
      feedbackMessage: unstablePairs[pairKey],
      detailedPrinciple: '真實化學世界中，除了形式電荷平衡外，還需考慮離子在水溶液中的水解與氧化還原穩定性！',
    };
  }

  // For other valid neutral salts not in top 48 list, verify if they are standard stable salts
  // Wait: the prompt states: "所有合成結果必須使用經過驗證的化學資料，不可將所有形式上電荷平衡的組合都視為已知、可存在的化合物。"
  // So let's strictly validate against VERIFIED_COMPOUNDS (and let's also make sure any valid combination of our 22 ions that IS a real stable compound is either in VERIFIED_COMPOUNDS or explained clearly!).
  return {
    status: 'UNSTABLE_OR_UNKNOWN',
    cation,
    anion,
    cationCount,
    anionCount,
    totalPositiveCharge,
    totalNegativeCharge,
    netCharge: 0,
    gcdValue: 1,
    constructedFormula,
    compound: null,
    feedbackTitle: `電荷已平衡（${constructedFormula}），但不在本章認證秘方錄中`,
    feedbackMessage: `你正確推導出 ${cationCount} 個 ${cation.name} 與 ${anionCount} 個 ${anion.name} 的電荷平衡比例！不過王國圖鑑目前收錄的是國中理化最核心的 48 種實驗室認證化合物，試試看合成常見的氧化物、氯化物、硫酸鹽、碳酸鹽或氫氧化物吧！`,
    detailedPrinciple: `電荷計算正確：+${totalPositiveCharge} 與 ${totalNegativeCharge} 平衡。`,
  };
}
