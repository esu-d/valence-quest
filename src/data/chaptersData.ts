export interface SynthesisChallenge {
  id: string;
  chapterId: number;
  title: string;
  storyPrompt: string;
  targetFormula: string; // e.g., "NaCl", "CaCl2", "Al2(SO4)3"
  targetName: string; // e.g., "氯化鈉"
  hintText: string;
  availableIonIds: string[];
  xpReward: number;
  crystalReward: number;
  isSpecialTask?: boolean;
}

export interface BossShieldWeakness {
  shieldName: string;
  description: string;
  preferredFormulas: string[]; // 2.5x super effective
  preferredCategory?: '鹽類' | '氧化物' | '鹼類' | '酸類'; // 1.8x effective
  telegraphAttackName: string;
  telegraphDamage: number;
}

export interface ChapterBoss {
  id: string;
  chapterId: number;
  name: string;
  subtitle: string;
  lore: string;
  maxHp: number;
  turnLimit: number;
  imageUrl?: string;
  accentColor: string;
  availableIonIds: string[];
  shields: BossShieldWeakness[];
  xpReward: number;
  crystalReward: number;
}

export interface ChapterData {
  id: number;
  title: string;
  subtitle: string;
  valenceFocus: string;
  description: string;
  accentColor: string;
  lessonPoints: {
    heading: string;
    content: string;
    exampleFormula: string;
    exampleExplanation: string;
  }[];
  challenges: SynthesisChallenge[];
  boss: ChapterBoss;
}

export interface LabCosmeticItem {
  id: string;
  name: string;
  category: 'crucible' | 'decor' | 'cardSkin';
  unlockLevel: number;
  crystalCost: number;
  description: string;
  previewHex: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  requirementText: string;
  xpBonus: number;
}

export const CHAPTERS_DATA: ChapterData[] = [
  {
    id: 1,
    title: '第一章：元素新手村',
    subtitle: '單價離子的初遇（+1 與 −1）',
    valenceFocus: '+1 陽離子 ＆ −1 陰離子',
    description: '學習最基礎的 +1 與 −1 價離子，掌握「左正右負」書寫順序與 1 : 1 電荷平衡原則。',
    accentColor: '#38bdf8',
    lessonPoints: [
      {
        heading: '法則一：正負相吸，總電荷必為 0',
        content: '離子化合物對外不顯電性（電中性）。當 +1 價的鈉離子（Na⁺）遇上 −1 價的氯離子（Cl⁻），(+1) + (−1) = 0，兩者以 1 : 1 結合。',
        exampleFormula: 'NaCl',
        exampleExplanation: 'Na⁺ (+1) + Cl⁻ (−1) → NaCl（氯化鈉）',
      },
      {
        heading: '法則二：左正右負，讀法由右向左',
        content: '寫化學式時，永遠把「陽離子（+）寫在左邊、陰離子（−）寫在右邊」；但唸中文名稱時，要從右邊唸回左邊，讀作「某化某」。',
        exampleFormula: 'AgCl',
        exampleExplanation: '左邊寫 Ag⁺、右邊寫 Cl⁻ → 讀作「氯化銀」',
      },
      {
        heading: '法則三：最簡整數比與省略 1',
        content: '化學式右下角的數字代表離子個數比，當個數為 1 時省略不寫；若放入 2 個 Na⁺ 與 2 個 Cl⁻，必須約分為 1 : 1（NaCl）。',
        exampleFormula: 'KBr',
        exampleExplanation: '1 個 K⁺ 配 1 個 Br⁻，右下角的 1 皆省略',
      },
    ],
    challenges: [
      {
        id: 'ch1-q1',
        chapterId: 1,
        title: '村民的調味結晶',
        storyPrompt: '新手村廚師急需純淨的「食鹽（氯化鈉）」來保存食材，請在坩堝中合成它！',
        targetFormula: 'NaCl',
        targetName: '氯化鈉',
        hintText: '選擇 +1 價的鈉離子（Na⁺）與 −1 價的氯離子（Cl⁻）各 1 個。',
        availableIonIds: ['Na+', 'K+', 'Cl-', 'Br-'],
        xpReward: 60,
        crystalReward: 20,
      },
      {
        id: 'ch1-q2',
        chapterId: 1,
        title: '地下水氯離子檢驗',
        storyPrompt: '為了檢測井水是否混入海水，請合成遇氯離子會產生白色沉澱的「氯化銀」！',
        targetFormula: 'AgCl',
        targetName: '氯化銀',
        hintText: '銀離子（Ag⁺，+1）與氯離子（Cl⁻，−1）以 1 : 1 結合。',
        availableIonIds: ['Ag+', 'Na+', 'H+', 'Cl-', 'I-'],
        xpReward: 70,
        crystalReward: 25,
      },
      {
        id: 'ch1-q3',
        chapterId: 1,
        title: '祈雨祭壇的晶種',
        storyPrompt: '新手村久旱不雨，請合成結構與冰晶相似、可作為人造雨晶種的黃色「碘化銀」！',
        targetFormula: 'AgI',
        targetName: '碘化銀',
        hintText: '將 +1 價的銀離子（Ag⁺）與 −1 價的碘離子（I⁻）以 1 : 1 結合。',
        availableIonIds: ['Ag+', 'K+', 'Cl-', 'Br-', 'I-'],
        xpReward: 75,
        crystalReward: 25,
      },
      {
        id: 'ch1-q4',
        chapterId: 1,
        title: '鍊金胃液的秘密（特殊任務）',
        storyPrompt: '調配強酸性的「氯化氫（鹽酸）」水溶液，用來清除實驗室鐵器表面的頑垢！',
        targetFormula: 'HCl',
        targetName: '氯化氫（鹽酸）',
        hintText: '酸性的來源是氫離子（H⁺，+1），搭配氯離子（Cl⁻，−1）。',
        availableIonIds: ['H+', 'Na+', 'K+', 'Cl-', 'Br-', 'I-'],
        xpReward: 85,
        crystalReward: 30,
        isSpecialTask: true,
      },
    ],
    boss: {
      id: 'boss-ch1',
      chapterId: 1,
      name: '鹽晶史萊姆王・哈萊特',
      subtitle: '第一章守關魔王',
      lore: '盤踞在海灣鹽田的巨大結晶史萊姆，能操控單價鹵素離子形成護盾。看準它的弱點合成對應化合物即可一舉擊破！',
      maxHp: 240,
      turnLimit: 6,
      accentColor: '#38bdf8',
      availableIonIds: ['H+', 'Na+', 'K+', 'Ag+', 'Cl-', 'Br-', 'I-'],
      xpReward: 180,
      crystalReward: 70,
      shields: [
        {
          shieldName: '游離氯水障壁',
          description: '史萊姆王周圍充滿游離的氯離子與溴離子！合成「氯化銀 (AgCl)」或「碘化銀 (AgI)」沉澱可造成 2.5 倍破甲暴擊！',
          preferredFormulas: ['AgCl', 'AgBr', 'AgI'],
          telegraphAttackName: '滷水泡沫衝擊',
          telegraphDamage: 25,
        },
        {
          shieldName: '微鹼凝膠外殼',
          description: '外殼呈微鹼性黏液狀態！合成酸性的「鹽酸 (HCl)」或「氫溴酸 (HBr)」可觸發 2.5 倍中和暴擊！',
          preferredFormulas: ['HCl', 'HBr', 'HI'],
          preferredCategory: '酸類',
          telegraphAttackName: '結晶震波',
          telegraphDamage: 30,
        },
        {
          shieldName: '失衡滲透核心',
          description: '核心暴露！合成高純度「氯化鈉 (NaCl)」或「碘化鉀 (KI)」即可造成 2.5 倍終結重擊！',
          preferredFormulas: ['NaCl', 'KCl', 'KI'],
          telegraphAttackName: '海鹽風暴',
          telegraphDamage: 28,
        },
      ],
    },
  },
  {
    id: 2,
    title: '第二章：雙價礦坑',
    subtitle: '二價離子與跨價數平衡（+2 與 −2）',
    valenceFocus: '+2 陽離子 ＆ −2 陰離子',
    description: '深入地底礦坑，掌握 Mg²⁺、Ca²⁺、Cu²⁺、Zn²⁺ 與 O²⁻、S²⁻，學會 +2 配 −1（1 : 2）與 +2 配 −2（1 : 1）的電荷平衡。',
    accentColor: '#10b981',
    lessonPoints: [
      {
        heading: '法則一：+2 遇上 −2，依然是 1 : 1 最簡整數比！',
        content: '鎂離子（Mg²⁺）帶 +2 電，氧離子（O²⁻）帶 −2 電。1 個 Mg²⁺ 與 1 個 O²⁻ 加起來 (+2) + (−2) = 0，直接寫作 MgO（千萬別寫成 Mg₂O₂ 喔）！',
        exampleFormula: 'MgO',
        exampleExplanation: 'Mg²⁺ (+2) + O²⁻ (−2) → MgO（氧化鎂）',
      },
      {
        heading: '法則二：+2 遇上 −1，需要 2 個 −1 離子來平衡',
        content: '鈣離子（Ca²⁺）帶 +2 電，氯離子（Cl⁻）只帶 −1 電。因此需要 2 個 Cl⁻ 湊成 −2 電，寫作 CaCl₂。',
        exampleFormula: 'CaCl2',
        exampleExplanation: '1 個 Ca²⁺ (+2) + 2 個 Cl⁻ (2×−1) → CaCl₂（氯化鈣）',
      },
      {
        heading: '法則三：+1 遇上 −2，需要 2 個 +1 陽離子',
        content: '當 +1 價的銀離子（Ag⁺）或鈉離子（Na⁺）遇上 −2 價的硫離子（S²⁻），需要 2 個陽離子來平衡，寫作 Ag₂S 或 Na₂S。',
        exampleFormula: 'Ag2S',
        exampleExplanation: '2 個 Ag⁺ (2×+1) + 1 個 S²⁻ (−2) → Ag₂S（硫化銀）',
      },
    ],
    challenges: [
      {
        id: 'ch2-q1',
        chapterId: 2,
        title: '鍛造耐火熔爐磚',
        storyPrompt: '礦坑深處溫度極高，請合成熔點超過 2800°C 的白色「氧化鎂（MgO）」來修補耐火磚！',
        targetFormula: 'MgO',
        targetName: '氧化鎂',
        hintText: 'Mg²⁺（+2）與 O²⁻（−2）各 1 個即可達成電荷平衡（最簡整數比 1:1）。',
        availableIonIds: ['Mg2+', 'Ca2+', 'Na+', 'O2-', 'Cl-'],
        xpReward: 90,
        crystalReward: 30,
      },
      {
        id: 'ch2-q2',
        chapterId: 2,
        title: '礦坑除濕結界',
        storyPrompt: '礦道濕氣過重導致火把熄滅，請合成除濕盒最常用的強力吸水劑「氯化鈣（CaCl₂）」！',
        targetFormula: 'CaCl2',
        targetName: '氯化鈣',
        hintText: '1 個 +2 價的 Ca²⁺ 需要搭配 2 個 −1 價的 Cl⁻ 才能平衡電荷。',
        availableIonIds: ['Ca2+', 'Mg2+', 'Na+', 'Cl-', 'O2-'],
        xpReward: 100,
        crystalReward: 35,
      },
      {
        id: 'ch2-q3',
        chapterId: 2,
        title: '溫泉銀飾變黑之謎',
        storyPrompt: '探險隊員的銀徽章在硫磺礦泉旁變黑了，請合成這個黑色物質「硫化銀（Ag₂S）」以解析其成分！',
        targetFormula: 'Ag2S',
        targetName: '硫化銀',
        hintText: 'S²⁻ 帶 −2 電，而 Ag⁺ 只帶 +1 電，因此需要 2 個 Ag⁺ 配 1 個 S²⁻！',
        availableIonIds: ['Ag+', 'Cu2+', 'Zn2+', 'S2-', 'O2-', 'Cl-'],
        xpReward: 110,
        crystalReward: 35,
      },
      {
        id: 'ch2-q4',
        chapterId: 2,
        title: '電解實驗的藍色試劑（特殊任務）',
        storyPrompt: '啟動礦車需要配置「氯化銅（CuCl₂）」電解液，請準確推導它的正負離子比例！',
        targetFormula: 'CuCl2',
        targetName: '氯化銅',
        hintText: '銅離子 Cu²⁺ 帶 +2 電，氯離子 Cl⁻ 帶 −1 電 → CuCl₂。',
        availableIonIds: ['Cu2+', 'Zn2+', 'Ba2+', 'Cl-', 'S2-', 'O2-'],
        xpReward: 120,
        crystalReward: 40,
        isSpecialTask: true,
      },
    ],
    boss: {
      id: 'boss-ch2',
      chapterId: 2,
      name: '玄武岩石巨人・戈侖',
      subtitle: '第二章守關魔王',
      lore: '由堅硬玄武岩與翠綠鎂礦脈凝聚而成的遠古巨像。必須看穿它的元素護盾，合成對應的二價化合物才能擊碎其岩石裝甲！',
      maxHp: 320,
      turnLimit: 7,
      imageUrl: '/src/assets/images/boss_rock_golem_1794327722170.jpg',
      accentColor: '#10b981',
      availableIonIds: ['Na+', 'Ag+', 'Mg2+', 'Ca2+', 'Cu2+', 'Zn2+', 'Cl-', 'O2-', 'S2-'],
      xpReward: 240,
      crystalReward: 95,
      shields: [
        {
          shieldName: '玄武重岩防護罩',
          description: '岩石巨人展開高硬度防護罩！合成「氧化鎂 (MgO)」或「氧化銅 (CuO)」可觸發 2.5 倍貫穿破甲！',
          preferredFormulas: ['MgO', 'CuO', 'ZnO', 'CaO'],
          preferredCategory: '氧化物',
          telegraphAttackName: '翠晶重拳轟擊',
          telegraphDamage: 32,
        },
        {
          shieldName: '地底水霧再生盾',
          description: '巨人吸收洞窟水氣修補裂痕！合成強力乾燥劑「氯化鈣 (CaCl₂)」或「生石灰 (CaO)」可抽乾水氣並造成 2.5 倍暴擊！',
          preferredFormulas: ['CaCl2', 'CaO', 'MgCl2'],
          telegraphAttackName: '鐘乳岩崩落',
          telegraphDamage: 35,
        },
        {
          shieldName: '硫磺礦脈共振',
          description: '核心露出硫化物裂隙！合成「硫化銅 (CuS)」、「硫化鋅 (ZnS)」或「硫化銀 (Ag₂S)」可造成 2.5 倍封印傷害！',
          preferredFormulas: ['CuS', 'ZnS', 'Ag2S'],
          telegraphAttackName: '地脈震盪波',
          telegraphDamage: 36,
        },
      ],
    },
  },
  {
    id: 3,
    title: '第三章：三價火山',
    subtitle: '三價離子與最小公倍數交叉法（+3 與多價鐵）',
    valenceFocus: 'Al³⁺、Fe³⁺、Fe²⁺、Pb²⁺ 與最小公倍數',
    description: '踏入炙熱的三價火山，分辨鐵離子（+3）與亞鐵離子（+2），並用最小公倍數法征服 Al₂O₃ 與 Fe₂O₃！',
    accentColor: '#f97316',
    lessonPoints: [
      {
        heading: '法則一：+3 與 −2 的最小公倍數交叉法',
        content: '鋁離子（Al³⁺）帶 +3 電，氧離子（O²⁻）帶 −2 電。3 與 2 的最小公倍數是 6：需要 2 個 Al³⁺（+6）與 3 個 O²⁻（−6），寫作 Al₂O₃！',
        exampleFormula: 'Al2O3',
        exampleExplanation: '2 × (+3) + 3 × (−2) = +6 − 6 = 0 → Al₂O₃（氧化鋁）',
      },
      {
        heading: '法則二：分辨「鐵離子 Fe³⁺」與「亞鐵離子 Fe²⁺」',
        content: '鐵有兩種常見正價：較高的 +3 價稱為「鐵離子（Fe³⁺）」，如鐵鏽氧化鐵 Fe₂O₃；較低的 +2 價加「亞」字稱為「亞鐵離子（Fe²⁺）」，如氯化亞鐵 FeCl₂。',
        exampleFormula: 'Fe2O3',
        exampleExplanation: '氧化鐵由 Fe³⁺ 與 O²⁻ 組成 → Fe₂O₃；氧化亞鐵則為 FeO',
      },
      {
        heading: '法則三：黃金雨沉澱實驗（PbI₂）',
        content: '鉛離子（Pb²⁺，+2）遇上碘離子（I⁻，−1），以 1 : 2 結合生成鮮黃色的碘化鉛（PbI₂）沉澱。',
        exampleFormula: 'PbI2',
        exampleExplanation: '1 個 Pb²⁺ (+2) + 2 個 I⁻ (2×−1) → PbI₂（碘化鉛）',
      },
    ],
    challenges: [
      {
        id: 'ch3-q1',
        chapterId: 3,
        title: '紅寶石的緻密結晶',
        storyPrompt: '火山口的高溫需要「氧化鋁（Al₂O₃）」晶盾才能抵禦，請運用最小公倍數平衡 +3 與 −2 電荷！',
        targetFormula: 'Al2O3',
        targetName: '氧化鋁',
        hintText: 'Al³⁺ 為 +3、O²⁻ 為 −2，最小公倍數為 6 → 2 個 Al³⁺ 配 3 個 O²⁻。',
        availableIonIds: ['Al3+', 'Mg2+', 'Na+', 'O2-', 'Cl-'],
        xpReward: 120,
        crystalReward: 40,
      },
      {
        id: 'ch3-q2',
        chapterId: 3,
        title: '赤鐵礦高爐煉鐵',
        storyPrompt: '火山鐵匠鋪需要提煉赤鐵礦，請合成赤鐵礦的主要成分「氧化鐵（Fe₂O₃）」！（注意不是氧化亞鐵喔）',
        targetFormula: 'Fe2O3',
        targetName: '氧化鐵',
        hintText: '「氧化鐵」使用的是 +3 價的鐵離子（Fe³⁺），搭配 O²⁻（−2）形成 Fe₂O₃。',
        availableIonIds: ['Fe3+', 'Fe2+', 'Al3+', 'O2-', 'Cl-'],
        xpReward: 130,
        crystalReward: 45,
      },
      {
        id: 'ch3-q3',
        chapterId: 3,
        title: '電路板蝕刻魔液',
        storyPrompt: '機關師需要蝕刻精密銅製法陣，請合成黃褐色的「氯化鐵（FeCl₃）」溶液！',
        targetFormula: 'FeCl3',
        targetName: '氯化鐵',
        hintText: '1 個 +3 價的鐵離子（Fe³⁺）搭配 3 個 −1 價的氯離子（Cl⁻）。',
        availableIonIds: ['Fe3+', 'Fe2+', 'Pb2+', 'Cl-', 'I-', 'O2-'],
        xpReward: 130,
        crystalReward: 45,
      },
      {
        id: 'ch3-q4',
        chapterId: 3,
        title: '璀璨黃金雨試煉（特殊任務）',
        storyPrompt: '重現質量守恆定律中最著名的鮮黃色沉澱——請合成「碘化鉛（PbI₂）」！',
        targetFormula: 'PbI2',
        targetName: '碘化鉛',
        hintText: '1 個 +2 價的鉛離子（Pb²⁺）搭配 2 個 −1 價的碘離子（I⁻）。',
        availableIonIds: ['Pb2+', 'Fe3+', 'Al3+', 'I-', 'Cl-', 'O2-'],
        xpReward: 145,
        crystalReward: 50,
        isSpecialTask: true,
      },
    ],
    boss: {
      id: 'boss-ch3',
      chapterId: 3,
      name: '赤鐵熔岩領主・伊グニス',
      subtitle: '第三章守關魔王',
      lore: '誕生於三價火山熔岩核心的赤鐵巨靈，能在二價亞鐵與三價赤鐵形態間自由切換。唯有精準計算最小公倍數的鍊金師才能將其擊退！',
      maxHp: 400,
      turnLimit: 7,
      accentColor: '#f97316',
      availableIonIds: ['Al3+', 'Fe3+', 'Fe2+', 'Pb2+', 'Mg2+', 'O2-', 'Cl-', 'I-', 'S2-'],
      xpReward: 300,
      crystalReward: 120,
      shields: [
        {
          shieldName: '三價赤焰重鎧',
          description: '領主披上三價熔岩鎧甲！合成「氧化鋁 (Al₂O₃)」或「氧化鐵 (Fe₂O₃)」可造成 2.5 倍同調破甲傷害！',
          preferredFormulas: ['Al2O3', 'Fe2O3'],
          telegraphAttackName: '赤鐵火球齊射',
          telegraphDamage: 38,
        },
        {
          shieldName: '黃金雨封印陣',
          description: '領主蓄力準備噴發！合成鮮黃色沉澱「碘化鉛 (PbI₂)」或「氯化鋁 (AlCl₃)」可瞬間凝結熔岩造成 2.5 倍傷害！',
          preferredFormulas: ['PbI2', 'AlCl3', 'FeCl3'],
          telegraphAttackName: '火山灰燼風暴',
          telegraphDamage: 40,
        },
        {
          shieldName: '亞鐵還原核心',
          description: '領主切換為 +2 亞鐵形態！合成「氯化亞鐵 (FeCl₂)」或「氧化亞鐵 (FeO)」可觸發 2.5 倍精準打擊！',
          preferredFormulas: ['FeCl2', 'FeO', 'MgO'],
          telegraphAttackName: '熔核重擊',
          telegraphDamage: 42,
        },
      ],
    },
  },
  {
    id: 4,
    title: '第四章：原子團森林',
    subtitle: '多原子離子（根）與括號鐵則',
    valenceFocus: 'OH⁻、NO₃⁻、HCO₃⁻、SO₄²⁻、CO₃²⁻、NH₄⁺',
    description: '進入神祕的原子團森林，將「根」視為一個整體進行電荷平衡，並徹底掌握何時必須加上括號 ()！',
    accentColor: '#a855f7',
    lessonPoints: [
      {
        heading: '法則一：把「原子團（根）」當成一個整體看待',
        content: '硫酸根（SO₄²⁻）雖然含有 1 個硫原子和 4 個氧原子，但在合成時是一個整體帶 −2 電荷的團隊；同理，氫氧根（OH⁻）、硝酸根（NO₃⁻）整體帶 −1 電荷。',
        exampleFormula: 'CuSO4',
        exampleExplanation: 'Cu²⁺ (+2) + SO₄²⁻ (−2) → 1 : 1 結合寫作 CuSO₄（硫酸銅）',
      },
      {
        heading: '法則二：原子團數量 ≥ 2 時，必須加括號 ()！',
        content: '當 1 個 Ca²⁺（+2）搭配 2 個 OH⁻（−1）時，若不加括號寫成 CaOH₂ 會被誤認為只有 2 個氫、1 個氧！因此必須把 OH 括起來寫作 Ca(OH)₂。',
        exampleFormula: 'Ca(OH)2',
        exampleExplanation: '原子團個數為 2 個以上必加括號：Ca(OH)₂、Al₂(SO₄)₃、(NH₄)₂SO₄',
      },
      {
        heading: '法則三：原子團數量為 1 時，千萬不要加括號',
        content: '例如 2 個 Na⁺ 配 1 個 CO₃²⁻ 形成碳酸鈉（蘇打），因為 CO₃²⁻ 只有 1 個，直接寫作 Na₂CO₃ 即可，不寫成 Na₂(CO₃)。',
        exampleFormula: 'Na2CO3',
        exampleExplanation: '2 個 Na⁺ + 1 個 CO₃²⁻ → Na₂CO₃（碳酸鈉）',
      },
    ],
    challenges: [
      {
        id: 'ch4-q1',
        chapterId: 4,
        title: '調配澄清石灰水',
        storyPrompt: '森林長老需要檢驗迷霧中是否含有二氧化碳（CO₂），請合成水溶液即為澄清石灰水的「氫氧化鈣 Ca(OH)₂」！',
        targetFormula: 'Ca(OH)2',
        targetName: '氫氧化鈣',
        hintText: '1 個 Ca²⁺（+2）配 2 個 OH⁻（−1），OH 原子團有 2 個所以要加括號！',
        availableIonIds: ['Ca2+', 'Na+', 'OH-', 'Cl-', 'CO32-'],
        xpReward: 140,
        crystalReward: 50,
      },
      {
        id: 'ch4-q2',
        chapterId: 4,
        title: '大理石聖殿修復',
        storyPrompt: '森林中的白色大理石祭壇受損了，請合成大理石與貝殼的主要成分「碳酸鈣（CaCO₃）」！',
        targetFormula: 'CaCO3',
        targetName: '碳酸鈣',
        hintText: 'Ca²⁺（+2）與 CO₃²⁻（−2）以 1 : 1 平衡，CO₃²⁻ 只有 1 個故不需加括號。',
        availableIonIds: ['Ca2+', 'Na+', 'NH4+', 'CO32-', 'HCO3-', 'OH-'],
        xpReward: 145,
        crystalReward: 50,
      },
      {
        id: 'ch4-q3',
        chapterId: 4,
        title: '豐收農田的氮肥結晶',
        storyPrompt: '精靈果園需要補充氮肥，請用帶正電的銨根離子合成「硫酸銨 (NH₄)₂SO₄」！',
        targetFormula: '(NH4)2SO4',
        targetName: '硫酸銨',
        hintText: 'NH₄⁺ 帶 +1 電，SO₄²⁻ 帶 −2 電 → 需要 2 個 NH₄⁺ 配 1 個 SO₄²⁻，寫作 (NH₄)₂SO₄！',
        availableIonIds: ['NH4+', 'K+', 'Ca2+', 'SO42-', 'NO3-', 'CO32-'],
        xpReward: 160,
        crystalReward: 55,
      },
      {
        id: 'ch4-q4',
        chapterId: 4,
        title: '淨水明礬的終極試煉（特殊任務）',
        storyPrompt: '挑戰國中理化最經典的括號大魔王——請將鋁離子與硫酸根結合成「硫酸鋁 Al₂(SO₄)₃」！',
        targetFormula: 'Al2(SO4)3',
        targetName: '硫酸鋁',
        hintText: 'Al³⁺（+3）與 SO₄²⁻（−2）最小公倍數為 6 → 2 個 Al³⁺ 配 3 個 SO₄²⁻！',
        availableIonIds: ['Al3+', 'Ca2+', 'NH4+', 'SO42-', 'OH-', 'NO3-'],
        xpReward: 180,
        crystalReward: 65,
        isSpecialTask: true,
      },
    ],
    boss: {
      id: 'boss-ch4',
      chapterId: 4,
      name: '翠礬荊棘女王・薇特莉',
      subtitle: '第四章守關魔王',
      lore: '統御原子團森林的妖精女王，能編織酸性荊棘與硫酸藤蔓。唯有熟稔各種原子團價數與括號法則的鍊金師才能破解她的魔法陣！',
      maxHp: 460,
      turnLimit: 8,
      accentColor: '#a855f7',
      availableIonIds: ['Na+', 'Ca2+', 'Cu2+', 'Al3+', 'NH4+', 'OH-', 'NO3-', 'HCO3-', 'SO42-', 'CO32-'],
      xpReward: 360,
      crystalReward: 145,
      shields: [
        {
          shieldName: '強酸荊棘瘴氣',
          description: '女王釋放酸性瘴氣！合成鹼性的「氫氧化鈣 Ca(OH)₂」、「氫氧化鈉 NaOH」或「碳酸鈉 Na₂CO₃」可觸發 2.5 倍酸鹼中和暴擊！',
          preferredFormulas: ['Ca(OH)2', 'NaOH', 'Na2CO3', 'Al(OH)3', 'NaHCO3'],
          preferredCategory: '鹼類',
          telegraphAttackName: '腐蝕荊棘鞭擊',
          telegraphDamage: 40,
        },
        {
          shieldName: '多重根團結界',
          description: '結界需要「含有括號的多原子離子化合物」才能共鳴擊碎！合成「Al₂(SO₄)₃」、「(NH₄)₂SO₄」或「Cu(NO₃)₂」可造成 2.5 倍破陣暴擊！',
          preferredFormulas: ['Al2(SO4)3', '(NH4)2SO4', 'Cu(NO3)2', 'Ca(OH)2', 'Ca(HCO3)2', 'Al(OH)3'],
          telegraphAttackName: '翠礬結晶風暴',
          telegraphDamage: 44,
        },
        {
          shieldName: '無水檢驗之瞳',
          description: '女王凝聚水幻影分身！合成檢驗水分的「硫酸銅 (CuSO₄)」或大理石結晶「碳酸鈣 (CaCO₃)」即可識破真身造成 2.5 倍傷害！',
          preferredFormulas: ['CuSO4', 'CaCO3', 'NaHCO3'],
          telegraphAttackName: '森林魔力脈衝',
          telegraphDamage: 42,
        },
      ],
    },
  },
  {
    id: 5,
    title: '第五章：元素魔王城',
    subtitle: '全價數綜合實戰與 −3 磷酸根聖殿',
    valenceFocus: '全價數總複習（+1～+3、−1～−3）與沉澱／酸鹼策略',
    description: '決戰元素魔王城！解鎖 −3 價的磷酸根離子（PO₄³⁻），靈活運用全王國 22 種離子卡牌，破解終極魔王的多重元素結界！',
    accentColor: '#f43f5e',
    lessonPoints: [
      {
        heading: '法則一：−3 價磷酸根（PO₄³⁻）與雙重最小公倍數',
        content: '當 +2 價的鈣離子（Ca²⁺）遇上 −3 價的磷酸根（PO₄³⁻），最小公倍數為 6：需要 3 個 Ca²⁺（+6）配 2 個 PO₄³⁻（−6），寫作 Ca₃(PO₄)₂！',
        exampleFormula: 'Ca3(PO4)2',
        exampleExplanation: '3 個 Ca²⁺ (+6) + 2 個 PO₄³⁻ (−6) → Ca₃(PO₄)₂（磷酸鈣）',
      },
      {
        heading: '法則二：蘇打（Na₂CO₃）與小蘇打（NaHCO₃）的秒殺分辨',
        content: '碳酸根 CO₃²⁻ 帶 −2 電，所以碳酸鈉（蘇打）是 Na₂CO₃；碳酸氫根 HCO₃⁻ 只帶 −1 電，所以碳酸氫鈉（小蘇打）是 NaHCO₃！',
        exampleFormula: 'NaHCO3',
        exampleExplanation: '蘇打 Na₂CO₃（2:1） vs 小蘇打 NaHCO₃（1:1）',
      },
      {
        heading: '法則三：白色沉澱三大天王（BaSO₄、CaCO₃、AgCl）',
        content: '理化實驗最常考的三大白色沉澱：硫酸鋇（BaSO₄）、碳酸鈣（CaCO₃）、氯化銀（AgCl），在魔王戰中都是封鎖敵人行動的王牌！',
        exampleFormula: 'BaSO4',
        exampleExplanation: 'Ba²⁺ (+2) + SO₄²⁻ (−2) → BaSO₄（硫酸鋇白色沉澱）',
      },
    ],
    challenges: [
      {
        id: 'ch5-q1',
        chapterId: 5,
        title: '龍骨聖盾的基石',
        storyPrompt: '打造能抵擋龍息的聖盾需要骨骼與琺瑯質的核心礦物——請合成「磷酸鈣 Ca₃(PO₄)₂」！',
        targetFormula: 'Ca3(PO4)2',
        targetName: '磷酸鈣',
        hintText: 'Ca²⁺ 為 +2、PO₄³⁻ 為 −3，最小公倍數為 6 → 3 個 Ca²⁺ 配 2 個 PO₄³⁻！',
        availableIonIds: ['Ca2+', 'Na+', 'Al3+', 'PO43-', 'SO42-', 'CO32-'],
        xpReward: 190,
        crystalReward: 70,
      },
      {
        id: 'ch5-q2',
        chapterId: 5,
        title: '胃腸顯影的白晶結界',
        storyPrompt: '魔王城迷宮充滿暗影射線，請合成不溶於水也不溶於酸的 X 光顯影劑「硫酸鋇（BaSO₄）」！',
        targetFormula: 'BaSO4',
        targetName: '硫酸鋇',
        hintText: 'Ba²⁺（+2）與 SO₄²⁻（−2）以 1 : 1 結合形成 BaSO₄。',
        availableIonIds: ['Ba2+', 'Ca2+', 'Ag+', 'SO42-', 'CO32-', 'Cl-'],
        xpReward: 180,
        crystalReward: 65,
      },
      {
        id: 'ch5-q3',
        chapterId: 5,
        title: '乾粉滅火器的氣泡結晶',
        storyPrompt: '魔王城走廊燃起冥火，請合成受熱會分解產生二氧化碳來滅火的「小蘇打（碳酸氫鈉 NaHCO₃）」！',
        targetFormula: 'NaHCO3',
        targetName: '碳酸氫鈉',
        hintText: '注意是「碳酸氫根 HCO₃⁻（−1）」，與 Na⁺（+1）以 1 : 1 結合（別選成 CO₃²⁻ 喔）！',
        availableIonIds: ['Na+', 'Ca2+', 'H+', 'HCO3-', 'CO32-', 'OH-'],
        xpReward: 185,
        crystalReward: 65,
      },
      {
        id: 'ch5-q4',
        chapterId: 5,
        title: '複合氮磷聖肥（特殊任務）',
        storyPrompt: '世界樹急需同時含有銨根與磷酸根的結晶能量——請合成「磷酸銨 (NH₄)₃PO₄」！',
        targetFormula: '(NH4)3PO4',
        targetName: '磷酸銨',
        hintText: '3 個 +1 價的 NH₄⁺ 搭配 1 個 −3 價的 PO₄³⁻，NH₄ 需加括號寫作 (NH₄)₃PO₄！',
        availableIonIds: ['NH4+', 'K+', 'Ca2+', 'PO43-', 'SO42-', 'NO3-'],
        xpReward: 210,
        crystalReward: 80,
        isSpecialTask: true,
      },
    ],
    boss: {
      id: 'boss-ch5',
      chapterId: 5,
      name: '渾沌元素鍊金龍・沃爾卡努斯',
      subtitle: '最終章終極魔王',
      lore: '盤踞在魔王城頂端的傳說古龍，雙翼流竄著高階離子雷電，胸口鑲嵌著失衡的渾沌晶核。整合五章所學的價數法則，完成最終的電中性調合吧！',
      maxHp: 600,
      turnLimit: 9,
      imageUrl: '/src/assets/images/boss_chaos_dragon_1794327723060.jpg',
      accentColor: '#f43f5e',
      availableIonIds: [
        'H+',
        'Na+',
        'Ag+',
        'NH4+',
        'Mg2+',
        'Ca2+',
        'Ba2+',
        'Al3+',
        'Fe3+',
        'Cl-',
        'OH-',
        'HCO3-',
        'O2-',
        'SO42-',
        'CO32-',
        'PO43-',
      ],
      xpReward: 550,
      crystalReward: 250,
      shields: [
        {
          shieldName: '第一型態：重晶石白雷障壁',
          description: '古龍召喚游離重金屬雷雲！合成三大沉澱「硫酸鋇 (BaSO₄)」、「氯化銀 (AgCl)」或「磷酸鈣 Ca₃(PO₄)₂」可造成 2.5 倍雷雲封印暴擊！',
          preferredFormulas: ['BaSO4', 'AgCl', 'Ca3(PO4)2', 'CaCO3'],
          telegraphAttackName: '蒼雷電漿吐息',
          telegraphDamage: 45,
        },
        {
          shieldName: '第二型態：冥火灼熱風暴',
          description: '古龍噴吐高溫龍息！合成滅火氣泡劑「小蘇打 (NaHCO₃)」、「蘇打 (Na₂CO₃)」或高熔點「氧化鋁 (Al₂O₃)」可造成 2.5 倍逆轉暴擊！',
          preferredFormulas: ['NaHCO3', 'Na2CO3', 'Al2O3', 'MgO'],
          telegraphAttackName: '黑曜隕石墜落',
          telegraphDamage: 48,
        },
        {
          shieldName: '最終型態：高階原子團核心',
          description: '渾沌晶核完全暴露！合成高難度跨價數原子團「硫酸鋁 Al₂(SO₄)₃」、「磷酸鈣 Ca₃(PO₄)₂」或「磷酸銨 (NH₄)₃PO₄」發動 2.5 倍終極鍊金擊破！',
          preferredFormulas: ['Al2(SO4)3', 'Ca3(PO4)2', '(NH4)3PO4', '(NH4)2SO4', 'Al(OH)3'],
          telegraphAttackName: '終焉元素崩壞',
          telegraphDamage: 52,
        },
      ],
    },
  },
];

export const LAB_COSMETICS: LabCosmeticItem[] = [
  {
    id: 'crucible-bronze',
    name: '初心青銅坩堝',
    category: 'crucible',
    unlockLevel: 1,
    crystalCost: 0,
    description: '鍊金學徒標準配備的青銅熔爐，穩定可靠。',
    previewHex: '#f59e0b',
  },
  {
    id: 'crucible-emerald',
    name: '翠礬秘銀坩堝',
    category: 'crucible',
    unlockLevel: 2,
    crystalCost: 80,
    description: '鑲嵌二價鎂晶石的秘銀坩堝，合成時散發翡翠微光。',
    previewHex: '#10b981',
  },
  {
    id: 'crucible-astral',
    name: '星耀賢者坩堝',
    category: 'crucible',
    unlockLevel: 4,
    crystalCost: 180,
    description: '刻有原子團星環法陣的皇家坩堝，象徵對多原子離子的完全掌握。',
    previewHex: '#a855f7',
  },
  {
    id: 'decor-astrolabe',
    name: '電荷平衡星象儀',
    category: 'decor',
    unlockLevel: 2,
    crystalCost: 60,
    description: '擺放於實驗室桌面的黃銅星象儀，隨正負電荷共鳴緩緩旋轉。',
    previewHex: '#38bdf8',
  },
  {
    id: 'decor-owl',
    name: '結晶貓頭鷹使魔',
    category: 'decor',
    unlockLevel: 3,
    crystalCost: 120,
    description: '棲息在藥水架上的智慧使魔，陪伴你攻克高難度化學式。',
    previewHex: '#f97316',
  },
  {
    id: 'skin-royal',
    name: '皇家金箔卡框',
    category: 'cardSkin',
    unlockLevel: 3,
    crystalCost: 150,
    description: '為所有已收集的元素精靈卡牌換上典雅的皇家金邊框塗裝。',
    previewHex: '#eab308',
  },
];

export const ACHIEVEMENTS_LIST: AchievementItem[] = [
  {
    id: 'ach-first-synth',
    title: '初試啼聲的鍊金術',
    description: '成功完成第 1 次電中性離子化合物合成。',
    requirementText: '累計成功合成 1 次',
    xpBonus: 50,
  },
  {
    id: 'ach-cross-valence',
    title: '最小公倍數大師',
    description: '成功合成需要 2 : 3 或 3 : 2 交叉平衡的化合物（如 Al₂O₃、Al₂(SO₄)₃、Ca₃(PO₄)₂）。',
    requirementText: '合成任一 2:3 或 3:2 化合物',
    xpBonus: 120,
  },
  {
    id: 'ach-paren-pro',
    title: '括號守護者',
    description: '成功合成 5 次含有括號的多原子離子化合物（如 Ca(OH)₂、Al₂(SO₄)₃、(NH₄)₂SO₄）。',
    requirementText: '合成含括號原子團化合物 5 次',
    xpBonus: 150,
  },
  {
    id: 'ach-memory-recall',
    title: '無提示心眼鍊金',
    description: '在「隱藏價數（主動回憶）」狀態下成功合成 5 次化合物。',
    requirementText: '無提示狀態合成 5 次',
    xpBonus: 180,
  },
  {
    id: 'ach-boss-slayer',
    title: '元素王國守護者',
    description: '擊敗任一章節的守關魔王。',
    requirementText: '擊敗至少 1 位章節魔王',
    xpBonus: 200,
  },
  {
    id: 'ach-collector',
    title: '元素精靈博學者',
    description: '在圖鑑中成功解鎖並提升 10 張以上離子卡牌的熟練度至 Lv.1。',
    requirementText: '10 張離子卡牌達 Lv.1 熟練度',
    xpBonus: 220,
  },
];

export const ALCHEMIST_TITLES: { level: number; title: string; perkDescription: string }[] = [
  { level: 1, title: '見習鍊金學徒', perkDescription: '開放元素新手村與基礎電荷天平分析' },
  { level: 2, title: '結晶調合師', perkDescription: '戰鬥最大 HP 提升至 120，解鎖實驗室星象儀裝飾' },
  { level: 3, title: '價數魔導士', perkDescription: '戰鬥最大 HP 提升至 140，催化技能回復量增加' },
  { level: 4, title: '皇家首席鍊金師', perkDescription: '戰鬥最大 HP 提升至 160，破甲暴擊倍率強化' },
  { level: 5, title: '元素王國大宗師', perkDescription: '戰鬥最大 HP 提升至 180，精通全王國正負離子法則' },
];
