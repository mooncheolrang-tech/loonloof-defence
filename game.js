(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const $ = (id) => document.getElementById(id);
  const TAU = Math.PI * 2;
  const PATH = { left: 72, top: 72, right: 648, bottom: 648, side: 576, total: 2304 };
  const MAX_UNITS = 18;
  const TOTAL_ROUNDS = 30;
  const BOSS_ROUNDS = [5, 10, 15, 20, 25, 30];

  const elements = {
    fire: { name: "화염", color: "#ff6b58", dark: "#7d2e35", projectile: "#ffd166" },
    frost: { name: "서리", color: "#6fe7ff", dark: "#2d5d85", projectile: "#d9fbff" },
    spark: { name: "번개", color: "#ffe05c", dark: "#785b2b", projectile: "#fff5ad" },
    nature: { name: "자연", color: "#63e58d", dark: "#2e714b", projectile: "#c4ff9f" },
    earth: { name: "대지", color: "#d69a62", dark: "#745038", projectile: "#ffe0a3" },
    solar: { name: "태양", color: "#ffad50", dark: "#8a3e42", projectile: "#fff0a6" },
    lunar: { name: "월광", color: "#b7a0ff", dark: "#514b8c", projectile: "#efe6ff" },
    arcane: { name: "비전", color: "#e674ff", dark: "#713777", projectile: "#ffc7ff" },
    void: { name: "공허", color: "#886dff", dark: "#30295f", projectile: "#c9baff" }
  };

  const difficulties = {
    easy: {
      name: "쉬움", gold: 94, lives: 26, hp: 1.02, speed: .96, reward: .9,
      eliteBonus: -.02, affinity: 1.7, weak: .72, boss: 1,
      waveExtra: 0, bonusBase: 7, bonusRound: 1.5, lifeBonus: .25
    },
    normal: {
      name: "보통", gold: 76, lives: 18, hp: 1.27, speed: 1.035, reward: .79,
      eliteBonus: .015, affinity: 1.6, weak: .7, boss: 1.22,
      waveExtra: 1, bonusBase: 6, bonusRound: 1.35, lifeBonus: .22
    },
    hard: {
      name: "어려움", gold: 64, lives: 12, hp: 1.62, speed: 1.1, reward: .63,
      eliteBonus: .09, affinity: 1.5, weak: .67, boss: 1.55,
      waveExtra: 3, bonusBase: 4, bonusRound: 1, lifeBonus: .1
    }
  };

  const effectNames = {
    burn: "재생 차단", slow: "둔화", chain: "연쇄", pierce: "장갑 관통",
    splash: "범위 폭발", vulnerable: "약점 노출", crit: "치명타", beam: "보호막 관통",
    freeze: "강한 빙결", nova: "대범위 공격", shatter: "보호막 파괴", execute: "마무리 일격"
  };

  const enemyTypes = {
    grunt: { name: "회랑병", hp: 1, speed: 1, reward: 1, element: "neutral", hint: "기본형" },
    runner: { name: "질주충", hp: .62, speed: 1.62, reward: .9, element: "spark", hint: "빠름 · 둔화 권장" },
    brute: { name: "암석 거인", hp: 2.35, speed: .62, reward: 1.75, element: "earth", armor: .25, hint: "장갑 · 자연/관통 약점" },
    shield: { name: "빙결 방패병", hp: 1.12, speed: .83, reward: 1.45, element: "frost", shield: .72, hint: "보호막 · 화염/비전 약점" },
    regenerator: { name: "재생 포자", hp: 1.28, speed: .86, reward: 1.5, element: "nature", regen: .018, hint: "재생 · 화염으로 차단" },
    phase: { name: "공허 망령", hp: .92, speed: 1.18, reward: 1.55, element: "void", dodge: .28, hint: "회피 · 태양/비전 권장" },
    splitter: { name: "분열 슬라임", hp: 1.05, speed: .94, reward: 1.25, element: "fire", split: true, hint: "사망 시 둘로 분열" }
  };

  const runeSequences = {
    "frost>spark": { name: "빙뢰", multiplier: 1.72, radius: 52, color: "#d9fbff", slow: .5 },
    "nature>fire": { name: "산불", multiplier: 1.58, radius: 72, color: "#ff9a55", burn: 3.5 },
    "fire>frost": { name: "열충격", multiplier: 1.82, radius: 44, color: "#fff1d0", armorBreak: .12 },
    "earth>spark": { name: "과접지", multiplier: 1.66, radius: 58, color: "#ffe58d", shieldBreak: .45 },
    "void>solar": { name: "일식", multiplier: 2.05, radius: 66, color: "#d9c8ff", execute: true },
    "solar>void": { name: "붕괴", multiplier: 1.9, radius: 78, color: "#b998ff", vulnerable: 2.8 },
    "arcane>lunar": { name: "월광분광", multiplier: 1.7, radius: 86, color: "#f5c9ff" },
    "lunar>arcane": { name: "별무리", multiplier: 1.62, radius: 96, color: "#ffc7ff" },
    "spark>fire": { name: "폭전", multiplier: 1.68, radius: 64, color: "#fff091", burn: 2.4 },
    "earth>fire": { name: "용암파", multiplier: 1.74, radius: 70, color: "#ff8758", armorBreak: .09 },
    "nature>frost": { name: "동결뿌리", multiplier: 1.55, radius: 62, color: "#b7ffe2", slow: .58 },
    "frost>void": { name: "암빙", multiplier: 1.78, radius: 54, color: "#aeb9ff", vulnerable: 2.1 },
    "solar>arcane": { name: "성광", multiplier: 1.73, radius: 82, color: "#fff4c4", shieldBreak: .35 },
    "spark>nature": { name: "생체전류", multiplier: 1.6, radius: 74, color: "#dfff7c", vulnerable: 1.8 }
  };

  const unitDefs = {
    ember:  { name: "불씨 꼬마", tier: 1, element: "fire", shape: "mage", damage: 7, rate: .82, range: 260, effect: "burn" },
    frost:  { name: "서리 방울", tier: 1, element: "frost", shape: "orb", damage: 5, rate: .66, range: 245, effect: "slow" },
    spark:  { name: "찌릿 정령", tier: 1, element: "spark", shape: "bolt", damage: 6, rate: .54, range: 235, effect: "chain" },
    bud:    { name: "새싹 궁수", tier: 1, element: "nature", shape: "archer", damage: 9, rate: 1.02, range: 285, effect: "pierce" },
    stone:  { name: "돌조각 기사", tier: 1, element: "earth", shape: "knight", damage: 11, rate: 1.18, range: 245, effect: "shatter" },
    shade:  { name: "그림자 박쥐", tier: 1, element: "void", shape: "orb", damage: 6, rate: .62, range: 255, effect: "execute" },

    pyromancer: { name: "화염술사", tier: 2, element: "fire", shape: "mage", damage: 19, rate: .82, range: 275, effect: "burn", recipe: ["ember","ember"] },
    cryomancer: { name: "빙결사", tier: 2, element: "frost", shape: "mage", damage: 13, rate: .59, range: 265, effect: "slow", recipe: ["frost","frost"] },
    voltSage: { name: "연쇄술사", tier: 2, element: "spark", shape: "bolt", damage: 14, rate: .48, range: 255, effect: "chain", recipe: ["spark","spark"] },
    vineWarden: { name: "덩굴지기", tier: 2, element: "nature", shape: "archer", damage: 25, rate: 1.05, range: 300, effect: "pierce", recipe: ["bud","bud"] },
    stormGunner: { name: "폭뢰 포병", tier: 2, element: "solar", shape: "cannon", damage: 34, rate: 1.24, range: 310, effect: "splash", recipe: ["ember","spark"] },
    frostPriest: { name: "서리꽃 사제", tier: 2, element: "frost", shape: "priest", damage: 16, rate: .78, range: 270, effect: "vulnerable", recipe: ["frost","bud"] },
    ashHunter: { name: "잿불 사냥꾼", tier: 2, element: "fire", shape: "archer", damage: 27, rate: .92, range: 320, effect: "crit", recipe: ["ember","bud"] },
    auroraMage: { name: "극광 마도사", tier: 2, element: "arcane", shape: "mage", damage: 21, rate: .7, range: 285, effect: "beam", recipe: ["frost","spark"] },
    steamSmith: { name: "증기 기술자", tier: 2, element: "solar", shape: "cannon", damage: 31, rate: 1.14, range: 285, effect: "splash", recipe: ["ember","frost"] },
    stormDruid: { name: "폭풍 드루이드", tier: 2, element: "nature", shape: "priest", damage: 18, rate: .6, range: 270, effect: "chain", recipe: ["spark","bud"] },
    ironGuard: { name: "강철 파수꾼", tier: 2, element: "earth", shape: "knight", damage: 33, rate: 1.1, range: 270, effect: "shatter", recipe: ["stone","stone"] },
    nightblade: { name: "밤칼 암살자", tier: 2, element: "void", shape: "knight", damage: 24, rate: .62, range: 285, effect: "execute", recipe: ["shade","shade"] },
    magmaKnight: { name: "용암 기사", tier: 2, element: "fire", shape: "knight", damage: 36, rate: 1.08, range: 285, effect: "splash", recipe: ["ember","stone"] },
    bogWitch: { name: "늪안개 마녀", tier: 2, element: "void", shape: "queen", damage: 17, rate: .68, range: 280, effect: "vulnerable", recipe: ["frost","shade"] },
    thornMonk: { name: "가시 수도승", tier: 2, element: "nature", shape: "priest", damage: 29, rate: .94, range: 300, effect: "pierce", recipe: ["bud","stone"] },
    stormBat: { name: "뇌운 박쥐", tier: 2, element: "spark", shape: "bolt", damage: 19, rate: .5, range: 275, effect: "chain", recipe: ["spark","shade"] },
    shadowArcher: { name: "그늘 궁수", tier: 2, element: "lunar", shape: "archer", damage: 31, rate: .88, range: 330, effect: "crit", recipe: ["bud","shade"] },
    crystalSeer: { name: "수정 예언자", tier: 2, element: "arcane", shape: "priest", damage: 22, rate: .76, range: 295, effect: "beam", recipe: ["frost","stone"] },

    sunCannon: { name: "태양 대포", tier: 3, element: "solar", shape: "cannon", damage: 67, rate: 1.05, range: 325, effect: "splash", recipe: ["pyromancer","voltSage"] },
    winterQueen: { name: "겨울 여왕", tier: 3, element: "frost", shape: "queen", damage: 39, rate: .48, range: 295, effect: "freeze", recipe: ["cryomancer","vineWarden"] },
    gearTitan: { name: "기어 거인", tier: 3, element: "solar", shape: "golem", damage: 76, rate: 1.18, range: 290, effect: "splash", recipe: ["stormGunner","steamSmith"] },
    skyShaman: { name: "천공 주술사", tier: 3, element: "nature", shape: "priest", damage: 46, rate: .52, range: 300, effect: "chain", recipe: ["auroraMage","stormDruid"] },
    moonRanger: { name: "월식 추적자", tier: 3, element: "lunar", shape: "archer", damage: 82, rate: .83, range: 350, effect: "crit", recipe: ["ashHunter","frostPriest"] },
    blastMaster: { name: "폭발 장인", tier: 3, element: "fire", shape: "cannon", damage: 93, rate: 1.32, range: 335, effect: "splash", recipe: ["pyromancer","steamSmith"] },
    prismWitch: { name: "프리즘 마녀", tier: 3, element: "arcane", shape: "queen", damage: 54, rate: .57, range: 305, effect: "beam", recipe: ["voltSage","auroraMage"] },
    worldroot: { name: "세계수 수호자", tier: 3, element: "nature", shape: "golem", damage: 61, rate: .74, range: 285, effect: "vulnerable", recipe: ["vineWarden","stormDruid"] },
    magmaLord: { name: "마그마 군주", tier: 3, element: "fire", shape: "golem", damage: 96, rate: 1.08, range: 320, effect: "splash", recipe: ["pyromancer","ironGuard"] },
    nightReaper: { name: "야행 사신", tier: 3, element: "void", shape: "knight", damage: 89, rate: .7, range: 345, effect: "execute", recipe: ["nightblade","shadowArcher"] },
    crystalFortress: { name: "수정 성채", tier: 3, element: "earth", shape: "golem", damage: 79, rate: .88, range: 305, effect: "shatter", recipe: ["crystalSeer","thornMonk"] },
    tempestRaven: { name: "폭풍 까마귀", tier: 3, element: "spark", shape: "bolt", damage: 51, rate: .43, range: 315, effect: "chain", recipe: ["stormBat","voltSage"] },
    swampOracle: { name: "독늪 예언자", tier: 3, element: "void", shape: "queen", damage: 58, rate: .59, range: 320, effect: "vulnerable", recipe: ["bogWitch","frostPriest"] },
    meteorKnight: { name: "유성 기사", tier: 3, element: "solar", shape: "knight", damage: 105, rate: 1.02, range: 345, effect: "splash", recipe: ["magmaKnight","ashHunter"] },

    starBreaker: { name: "성운 파괴자", tier: 4, element: "solar", shape: "golem", damage: 175, rate: .92, range: 345, effect: "splash", recipe: ["sunCannon","gearTitan"] },
    absoluteOracle: { name: "절대영도 예언자", tier: 4, element: "frost", shape: "queen", damage: 108, rate: .43, range: 320, effect: "freeze", recipe: ["winterQueen","skyShaman"] },
    eclipseArcher: { name: "일식의 궁수", tier: 4, element: "lunar", shape: "archer", damage: 196, rate: .72, range: 380, effect: "crit", recipe: ["moonRanger","prismWitch"] },
    ancientColossus: { name: "태고의 거상", tier: 4, element: "nature", shape: "golem", damage: 143, rate: .61, range: 315, effect: "vulnerable", recipe: ["blastMaster","worldroot"] },
    bloodMoon: { name: "핏빛 달의 사신", tier: 4, element: "void", shape: "knight", damage: 218, rate: .66, range: 390, effect: "execute", recipe: ["nightReaper","swampOracle"] },
    earthCore: { name: "대지핵 요새", tier: 4, element: "earth", shape: "golem", damage: 187, rate: .78, range: 350, effect: "shatter", recipe: ["crystalFortress","magmaLord"] },
    thunderEmperor: { name: "천뢰 황제", tier: 4, element: "spark", shape: "priest", damage: 126, rate: .36, range: 365, effect: "chain", recipe: ["tempestRaven","meteorKnight"] },

    dawnDragon: { name: "여명룡 아우렐", tier: 5, element: "solar", shape: "dragon", damage: 360, rate: .52, range: 390, effect: "nova", recipe: ["starBreaker","absoluteOracle"] },
    voidGuardian: { name: "공허수호자 녹스", tier: 5, element: "void", shape: "knight", damage: 410, rate: .61, range: 400, effect: "nova", recipe: ["eclipseArcher","ancientColossus"] },
    worldEnder: { name: "종언의 거신 테라", tier: 5, element: "earth", shape: "golem", damage: 455, rate: .65, range: 405, effect: "nova", recipe: ["earthCore","thunderEmperor"] },
    moonEmpress: { name: "월야황제 루나", tier: 5, element: "lunar", shape: "queen", damage: 438, rate: .49, range: 420, effect: "crit", recipe: ["bloodMoon","eclipseArcher"] }
  };

  const unitKeys = Object.keys(unitDefs);
  const baseUnitKeys = unitKeys.filter(key => unitDefs[key].tier === 1);
  const recipeMap = new Map();
  const recipeUses = new Map();
  for (const [key, def] of Object.entries(unitDefs)) {
    if (def.recipe) {
      recipeMap.set([...def.recipe].sort().join("+"), key);
      for (const ingredientKey of new Set(def.recipe)) {
        const partnerKey = def.recipe[0] === ingredientKey ? def.recipe[1] : def.recipe[0];
        if (!recipeUses.has(ingredientKey)) recipeUses.set(ingredientKey, []);
        recipeUses.get(ingredientKey).push({ partnerKey, resultKey: key });
      }
    }
  }

  const slots = [
    { x: 276, y: 252 }, { x: 360, y: 238 }, { x: 444, y: 252 },
    { x: 250, y: 360 },                         { x: 470, y: 360 },
    { x: 276, y: 468 }, { x: 360, y: 482 }, { x: 444, y: 468 }
  ];
  const SLOT_RING = [0, 1, 2, 4, 7, 6, 5, 3];

  const state = {
    round: 0,
    gold: 76,
    lives: 18,
    kills: 0,
    summons: 0,
    units: [],
    enemies: [],
    projectiles: [],
    particles: [],
    damageTexts: [],
    mergeSlots: [null, null],
    selectedUnitId: null,
    discovered: new Set(["ember", "frost", "spark", "bud", "stone", "shade"]),
    difficulty: "normal",
    expeditionStarted: false,
    running: false,
    paused: false,
    speed: 1,
    waveSpawnsLeft: 0,
    waveSpawnIndex: 0,
    spawnTimer: 0,
    nextRoundTimer: 0,
    waveResolved: true,
    gameOver: false,
    uid: 1,
    lastTime: performance.now(),
    hoverSlot: -1,
    activeCodexTier: 2,
    audioEnabled: false,
    screenFlash: 0,
    screenFlashColor: "#ffffff",
    screenShake: 0,
    easterEggUnlocked: false,
    targetElement: "arcane",
    overchargePrepared: false,
    overchargeActive: false
  };

  const ui = {
    round: $("roundText"), gold: $("goldText"), lives: $("livesText"), kills: $("killText"),
    roster: $("roster"), unitCount: $("unitCount"), summonCost: $("summonCost"),
    summonBtn: $("summonBtn"), mergeBtn: $("mergeBtn"), clearMergeBtn: $("clearMergeBtn"),
    recipeResult: $("recipeResult"), battleLog: $("battleLog"), enemyCount: $("enemyCount"),
    waveBadge: $("waveBadge"), waveTitle: $("waveTitle"), startBtn: $("startBtn"),
    announcement: $("announcement"), discoveryText: $("discoveryText"), codexList: $("codexList"),
    endModal: $("endModal"), sellBtn: $("sellBtn"), selectedUnitInfo: $("selectedUnitInfo"),
    selectedUnitPanel: $("selectedUnitPanel"), threatIntel: $("threatIntel"),
    difficultyText: $("difficultyText"), difficultyModal: $("difficultyModal"),
    autoSameBtn: $("autoSameBtn"), autoRandomBtn: $("autoRandomBtn"),
    recipeTooltip: $("recipeTooltip"), easterEggModal: $("easterEggModal"),
    guidedSummonBtn: $("guidedSummonBtn"), guidedSummonCost: $("guidedSummonCost"),
    compassHint: $("compassHint"), reforgeBtn: $("reforgeBtn"),
    overchargeBtn: $("overchargeBtn"), overchargeCost: $("overchargeCost"),
    overchargeStatus: $("overchargeStatus")
  };

  function summonCost() {
    return Math.min(88, 18 + Math.floor(state.summons / 4) * 2);
  }

  function guidedSummonCost() {
    return Math.min(104, summonCost() + 12);
  }

  function overchargeCost() {
    return 30 + Math.min(TOTAL_ROUNDS, state.round + 1) * 3;
  }

  function waveEnemyCount(round) {
    return 8 + Math.min(round, 20) * 2 + Math.max(0, round - 20) +
      difficulties[state.difficulty].waveExtra;
  }

  function enemyBaseHp(round) {
    return 34 * Math.pow(1.245, Math.min(round, 20) - 1) *
      Math.pow(1.025, Math.max(0, round - 20));
  }

  function enemyRewardBase(round) {
    const raw = 1.8 + Math.min(round, 12) * .22 + Math.max(0, round - 12) * .06;
    const lateScale = round <= 15 ? 1 : Math.max(.55, 1 - (round - 15) * .03);
    return raw * lateScale;
  }

  function roundSupplyBonus(round) {
    const difficulty = difficulties[state.difficulty];
    return Math.round(
      difficulty.bonusBase +
      Math.min(round, 12) * difficulty.bonusRound +
      Math.max(0, round - 12) * .35 +
      Math.max(0, state.lives - 10) * difficulty.lifeBonus
    );
  }

  function getCompassPlan(targetElement = state.targetElement) {
    const recipes = Object.entries(unitDefs)
      .filter(([, def]) => def.tier === 2 && def.element === targetElement && def.recipe);
    const counts = new Map(baseUnitKeys.map(key => [
      key,
      state.units.filter(unit => unit.key === key).length
    ]));
    const coverage = new Map();
    for (const [, def] of recipes) {
      for (const key of new Set(def.recipe)) coverage.set(key, (coverage.get(key) || 0) + 1);
    }
    const options = [];
    for (const [resultKey, def] of recipes) {
      const [a, b] = def.recipe;
      const countA = counts.get(a) || 0;
      const countB = counts.get(b) || 0;
      let sourceKey;
      let score;
      if (a === b) {
        sourceKey = a;
        score = countA % 2 === 1 ? 120 : countA === 0 ? 58 : 25 - countA;
      } else if (countA > 0 && countB === 0) {
        sourceKey = b;
        score = 115 + Math.min(4, countA);
      } else if (countB > 0 && countA === 0) {
        sourceKey = a;
        score = 115 + Math.min(4, countB);
      } else if (countA === 0 && countB === 0) {
        sourceKey = (coverage.get(a) || 0) >= (coverage.get(b) || 0) ? a : b;
        score = 55 + (coverage.get(sourceKey) || 0) * 3;
      } else {
        sourceKey = countA <= countB ? a : b;
        score = 32 - Math.min(12, counts.get(sourceKey) || 0);
      }
      score += (coverage.get(sourceKey) || 0) * 2;
      options.push({ sourceKey, resultKey, score });
    }
    options.sort((left, right) =>
      right.score - left.score ||
      unitDefs[left.sourceKey].name.localeCompare(unitDefs[right.sourceKey].name, "ko")
    );
    return options[0] || { sourceKey: baseUnitKeys[0], resultKey: null, score: 0 };
  }

  function sellValue(tier) {
    return [0, 9, 26, 70, 180, 420][tier];
  }

  function formationBonus(unit) {
    if (unit.slotIndex === null) return { damage: 1, rate: 1, same: 0, different: 0 };
    const ringIndex = SLOT_RING.indexOf(unit.slotIndex);
    const neighborSlots = [
      SLOT_RING[(ringIndex + SLOT_RING.length - 1) % SLOT_RING.length],
      SLOT_RING[(ringIndex + 1) % SLOT_RING.length]
    ];
    const def = unitDefs[unit.key];
    let same = 0;
    let different = 0;
    for (const slotIndex of neighborSlots) {
      const neighbor = state.units.find(other => other.slotIndex === slotIndex);
      if (!neighbor) continue;
      if (unitDefs[neighbor.key].element === def.element) same++;
      else different++;
    }
    return {
      damage: 1 + same * .1,
      rate: 1 - different * .07,
      same,
      different
    };
  }

  function combatStats(unit) {
    const def = unitDefs[unit.key];
    const circuit = formationBonus(unit);
    const awakeningDamage = state.easterEggUnlocked ? 1.15 : 1;
    const awakeningRate = state.easterEggUnlocked ? .9 : 1;
    const overchargeDamage = state.overchargeActive ? 1.18 : 1;
    const overchargeRate = state.overchargeActive ? .9 : 1;
    const shapeRadius = {
      cannon: 14, golem: 11, dragon: 18, queen: 7, mage: 5,
      priest: 5, knight: 4, bolt: 8, orb: 3, archer: 0
    }[def.shape] || 0;
    const baseRadius = def.effect === "nova"
      ? 84 + def.tier * 7 + shapeRadius
      : def.effect === "splash"
        ? 42 + def.tier * 8 + shapeRadius
        : def.effect === "chain"
          ? 84 + def.tier * 10 + shapeRadius
          : 0;
    return {
      damage: def.damage * (unit.elite ? 1.2 : 1) * circuit.damage * awakeningDamage * overchargeDamage,
      rate: Math.max(.18, def.rate * circuit.rate * awakeningRate * overchargeRate),
      range: def.range,
      radius: baseRadius,
      attacksPerSecond: 1 / Math.max(.18, def.rate * circuit.rate * awakeningRate * overchargeRate),
      circuit
    };
  }

  function chooseEliteElement(resultKey, ingredients) {
    const primary = unitDefs[resultKey].element;
    const inherited = [...new Set(
      ingredients
        .flatMap(unit => [unitDefs[unit.key].element, unit.secondaryElement])
        .filter(element => element && element !== primary)
    )];
    if (inherited.length) return inherited[Math.floor(Math.random() * inherited.length)];
    const sequencePartners = Object.keys(runeSequences)
      .filter(key => key.startsWith(`${primary}>`))
      .map(key => key.split(">")[1]);
    if (sequencePartners.length) return sequencePartners[Math.floor(Math.random() * sequencePartners.length)];
    const choices = Object.keys(elements).filter(element => element !== primary);
    return choices[Math.floor(Math.random() * choices.length)];
  }

  function addLog(message, tone = "") {
    const line = document.createElement("p");
    line.className = `log-line ${tone}`;
    line.innerHTML = message;
    ui.battleLog.prepend(line);
    while (ui.battleLog.children.length > 6) ui.battleLog.lastChild.remove();
  }

  function toast(message, tone = "") {
    const el = document.createElement("div");
    el.className = `toast ${tone}`;
    el.textContent = message;
    $("toastContainer").append(el);
    setTimeout(() => el.remove(), 2400);
  }

  function announce(title, subtitle, duration = 2200) {
    const [strong, span] = ui.announcement.children;
    strong.textContent = title;
    span.textContent = subtitle;
    ui.announcement.classList.remove("hidden");
    clearTimeout(announce.timer);
    announce.timer = setTimeout(() => ui.announcement.classList.add("hidden"), duration);
  }

  function tone(freq = 440, duration = .06, type = "square", volume = .025) {
    if (!state.audioEnabled) return;
    try {
      const ac = tone.ac || (tone.ac = new (window.AudioContext || window.webkitAudioContext)());
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, ac.currentTime + duration);
      osc.connect(gain).connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + duration);
    } catch (_) {}
  }

  function createUnit(key) {
    return {
      id: state.uid++,
      key,
      slotIndex: null,
      cooldown: Math.random() * .4,
      elite: false,
      secondaryElement: null
    };
  }

  function renderSpriteCanvas(key, size = 48) {
    const c = document.createElement("canvas");
    c.width = 48;
    c.height = 48;
    c.className = "sprite-preview";
    const cctx = c.getContext("2d");
    cctx.imageSmoothingEnabled = false;
    drawUnitSprite(cctx, unitDefs[key], 24, 26, 2.25, 0);
    if (size !== 48) c.style.width = `${size}px`;
    return c;
  }

  function recipeOptionsFor(unit) {
    return (recipeUses.get(unit.key) || []).map(option => {
      const partnerCount = state.units.filter(other =>
        other.key === option.partnerKey && other.id !== unit.id
      ).length;
      return { ...option, partnerCount, ready: partnerCount > 0 };
    }).sort((a, b) =>
      Number(b.ready) - Number(a.ready) ||
      unitDefs[a.partnerKey].name.localeCompare(unitDefs[b.partnerKey].name, "ko")
    );
  }

  function recipeTooltipMarkup(unit) {
    const def = unitDefs[unit.key];
    const options = recipeOptionsFor(unit);
    const entries = options.length
      ? options.map(option => {
          const partner = unitDefs[option.partnerKey];
          const result = unitDefs[option.resultKey];
          return (
            `<div class="recipe-tooltip-entry${option.ready ? " ready" : ""}">` +
              `<div><strong>${partner.name} + ${def.name}</strong>` +
              `<span>→ ${result.tier}단계 ${result.name}</span></div>` +
              `<b>${option.ready ? `보유 ${option.partnerCount} · 가능` : "짝 없음"}</b>` +
            `</div>`
          );
        }).join("")
      : `<div class="recipe-tooltip-empty">${def.tier >= 5 ? "최종 단계 캐릭터입니다." : "이 캐릭터로 이어지는 조합식이 없습니다."}</div>`;
    return (
      `<div class="recipe-tooltip-head">` +
        `<small>NEXT RECIPES · ${options.length}개</small>` +
        `<strong>${unit.elite ? "ELITE " : ""}${def.name}</strong>` +
      `</div><div class="recipe-tooltip-list">${entries}</div>`
    );
  }

  function positionRecipeTooltip(event, card) {
    const tooltip = ui.recipeTooltip;
    const margin = 10;
    const rect = card.getBoundingClientRect();
    const width = tooltip.offsetWidth || 255;
    const height = tooltip.offsetHeight || 180;
    let x = event?.clientX !== undefined ? event.clientX + 14 : rect.right + 10;
    let y = event?.clientY !== undefined ? event.clientY + 14 : rect.top;
    if (x + width + margin > window.innerWidth) x = rect.left - width - 10;
    if (x < margin) x = margin;
    if (y + height + margin > window.innerHeight) y = window.innerHeight - height - margin;
    if (y < margin) y = margin;
    tooltip.style.left = `${Math.round(x)}px`;
    tooltip.style.top = `${Math.round(y)}px`;
  }

  function showRecipeTooltip(unit, card, event) {
    ui.recipeTooltip.innerHTML = recipeTooltipMarkup(unit);
    ui.recipeTooltip.classList.remove("hidden");
    positionRecipeTooltip(event, card);
  }

  function hideRecipeTooltip() {
    ui.recipeTooltip.classList.add("hidden");
  }

  function renderRoster() {
    ui.roster.innerHTML = "";
    if (!state.units.length) {
      const empty = document.createElement("div");
      empty.className = "empty-roster";
      empty.innerHTML = "아직 소환된 수호자가 없습니다.<br>아래 버튼으로 첫 동료를 만나보세요.";
      ui.roster.append(empty);
    }
    for (const unit of state.units) {
      const def = unitDefs[unit.key];
      const stats = combatStats(unit);
      const card = document.createElement("button");
      const inMerge = state.mergeSlots.includes(unit.id);
      card.className = `unit-card${state.selectedUnitId === unit.id ? " selected" : ""}${inMerge ? " in-merge" : ""}${unit.slotIndex !== null ? " deployed" : ""}${unit.elite ? " elite" : ""}`;
      card.dataset.unitId = unit.id;
      card.setAttribute("aria-label", unit.elite
        ? `ELITE ${def.name} · ${elements[def.element].name}+${elements[unit.secondaryElement].name} · 공격 ${Math.round(stats.damage)}`
        : `${def.name} · ${elements[def.element].name} · 공격 ${Math.round(stats.damage)} · 초당 ${stats.attacksPerSecond.toFixed(1)}회 · 사거리 ${Math.round(stats.range)}`
      );
      const pips = document.createElement("span");
      pips.className = "tier-pips";
      pips.textContent = "◆".repeat(def.tier);
      card.append(pips, renderSpriteCanvas(unit.key));
      const name = document.createElement("strong");
      name.textContent = def.name;
      const stat = document.createElement("small");
      stat.textContent = unit.elite
        ? `${def.tier}단계 · 엘리트 · 공격 ${Math.round(stats.damage)}`
        : `${def.tier}단계 · ${elements[def.element].name} · 공격 ${Math.round(stats.damage)}`;
      const dot = document.createElement("i");
      dot.className = "element-dot";
      dot.style.background = elements[def.element].color;
      card.append(name, stat, dot);
      if (unit.elite) {
        const secondaryDot = document.createElement("i");
        secondaryDot.className = "element-dot secondary";
        secondaryDot.style.background = elements[unit.secondaryElement].color;
        card.append(secondaryDot);
      }
      card.addEventListener("click", () => selectUnit(unit.id));
      card.addEventListener("mouseenter", event => showRecipeTooltip(unit, card, event));
      card.addEventListener("mousemove", event => positionRecipeTooltip(event, card));
      card.addEventListener("mouseleave", hideRecipeTooltip);
      card.addEventListener("focus", () => showRecipeTooltip(unit, card));
      card.addEventListener("blur", hideRecipeTooltip);
      ui.roster.append(card);
    }
    ui.unitCount.textContent = `${state.units.length} / ${MAX_UNITS}`;
    ui.summonBtn.disabled = state.units.length >= MAX_UNITS || state.gold < summonCost() || state.gameOver;
    ui.autoSameBtn.disabled = !findAutoPair("same") || state.gameOver;
    ui.autoRandomBtn.disabled = !findAutoPair("random") || state.gameOver;
    renderSelectedUnit();
  }

  function renderSelectedUnit() {
    const unit = getUnit(state.selectedUnitId);
    ui.selectedUnitPanel.classList.toggle("empty", !unit);
    ui.sellBtn.disabled = !unit || state.gameOver;
    if (!unit) {
      ui.selectedUnitInfo.innerHTML = "<small>선택 정보</small><strong>판매하거나 배치할 캐릭터를 선택하세요</strong>";
      ui.sellBtn.textContent = "판매";
      return;
    }
    const def = unitDefs[unit.key];
    const stats = combatStats(unit);
    const radiusText = ["splash", "nova"].includes(def.effect)
      ? `피격 범위 ${Math.round(stats.radius)}`
      : def.effect === "chain"
        ? `연쇄 범위 ${Math.round(stats.radius)}`
        : "피격 범위 단일";
    const circuitText = stats.circuit.same || stats.circuit.different
      ? `<span class="circuit">회로: 공격 +${stats.circuit.same * 10}% · 공속 +${stats.circuit.different * 7}%</span>`
      : "회로 보너스 없음";
    const eliteText = unit.elite
      ? `<span class="elite-text">ELITE · 피해 +20% · ${elements[def.element].name}+${elements[unit.secondaryElement].name} 이중 각인</span>`
      : "일반 룬핵";
    ui.selectedUnitInfo.innerHTML =
      `<small>${def.tier}단계 · <span class="unit-affinity">${elements[def.element].name}</span></small>` +
      `<strong>${def.name} · ${effectNames[def.effect] || def.effect}</strong>` +
      `<span class="unit-stats">공격 ${Math.round(stats.damage)} · 초당 ${stats.attacksPerSecond.toFixed(1)}회 · 사거리 ${Math.round(stats.range)} · ${radiusText}<br>${eliteText} · ${circuitText}</span>`;
    ui.sellBtn.textContent = `${sellValue(def.tier)}룬`;
  }

  function selectUnit(id) {
    state.audioEnabled = true;
    hideRecipeTooltip();
    const unit = getUnit(id);
    if (!unit) return;
    if (state.mergeSlots.includes(id)) {
      state.mergeSlots[state.mergeSlots.indexOf(id)] = null;
      state.selectedUnitId = null;
      updateAllUI();
      return;
    }
    const emptyMerge = state.mergeSlots.indexOf(null);
    if (state.selectedUnitId === id) {
      if (emptyMerge !== -1) {
        state.mergeSlots[emptyMerge] = id;
        state.selectedUnitId = null;
        tone(520);
      } else {
        state.selectedUnitId = null;
      }
    } else {
      state.selectedUnitId = id;
      tone(360);
    }
    updateAllUI();
  }

  function getUnit(id) {
    return state.units.find(u => u.id === id);
  }

  function summon() {
    state.audioEnabled = true;
    const cost = summonCost();
    if (state.gold < cost) return toast("룬이 부족합니다.", "bad");
    if (state.units.length >= MAX_UNITS) return toast("대기실이 가득 찼습니다. 조합해 공간을 만드세요.", "bad");
    state.gold -= cost;
    state.summons++;
    const key = baseUnitKeys[Math.floor(Math.random() * baseUnitKeys.length)];
    const unit = createUnit(key);
    state.units.push(unit);
    state.selectedUnitId = unit.id;
    tone(660, .08);
    setTimeout(() => tone(880, .08), 70);
    addLog(`<b>${unitDefs[key].name}</b> 소환. 중앙 빈 칸을 누르면 배치됩니다.`, "good");
    updateAllUI();
  }

  function guidedSummon() {
    state.audioEnabled = true;
    const cost = guidedSummonCost();
    if (state.gold < cost) return toast("원소 추적에 필요한 룬이 부족합니다.", "bad");
    if (state.units.length >= MAX_UNITS) return toast("대기실이 가득 찼습니다. 먼저 조합하거나 판매하세요.", "bad");
    const plan = getCompassPlan();
    const unit = createUnit(plan.sourceKey);
    state.gold -= cost;
    state.summons++;
    state.units.push(unit);
    state.selectedUnitId = unit.id;
    const sourceDef = unitDefs[plan.sourceKey];
    const resultDef = plan.resultKey ? unitDefs[plan.resultKey] : null;
    announce(
      `${elements[state.targetElement].name} 나침반`,
      resultDef ? `${resultDef.name} 경로 · ${sourceDef.name} 발견` : `${sourceDef.name} 발견`,
      1900
    );
    addLog(
      `<b>${elements[state.targetElement].name} 추적</b>: ${sourceDef.name} 소환` +
      (resultDef ? ` · ${resultDef.name} 조합 경로` : ""),
      "good"
    );
    toast(`${sourceDef.name} 추적 성공`, "good");
    tone(460, .07, "sine", .025);
    setTimeout(() => tone(690, .09, "sine", .025), 80);
    setTimeout(() => tone(920, .12, "sine", .025), 160);
    updateAllUI();
  }

  function sellSelectedUnit() {
    const unit = getUnit(state.selectedUnitId);
    if (!unit) return toast("판매할 캐릭터를 먼저 선택하세요.", "bad");
    const def = unitDefs[unit.key];
    const value = sellValue(def.tier);
    state.units = state.units.filter(u => u.id !== unit.id);
    state.mergeSlots = state.mergeSlots.map(id => id === unit.id ? null : id);
    state.selectedUnitId = null;
    state.gold += value;
    addLog(`<b>${def.name}</b> 판매. ${value} 룬을 회수했습니다.`, "good");
    toast(`${def.name} 판매 +${value} 룬`, "good");
    tone(260, .08);
    updateAllUI();
  }

  function clearMerge() {
    state.mergeSlots = [null, null];
    updateAllUI();
  }

  function getRecipeResult() {
    const a = getUnit(state.mergeSlots[0]);
    const b = getUnit(state.mergeSlots[1]);
    if (!a || !b) return { status: "empty" };
    const da = unitDefs[a.key], db = unitDefs[b.key];
    if (da.tier !== db.tier) return { status: "invalid", reason: "같은 단계끼리만 조합할 수 있습니다." };
    if (da.tier >= 5) return { status: "invalid", reason: "5단계는 최종 단계입니다." };
    const resultKey = recipeMap.get([a.key, b.key].sort().join("+"));
    if (!resultKey) return { status: "invalid", reason: "아직 반응하지 않는 조합입니다. 도감을 확인하세요." };
    return { status: "ready", key: resultKey };
  }

  function getReforgeResult() {
    const a = getUnit(state.mergeSlots[0]);
    const b = getUnit(state.mergeSlots[1]);
    if (!a || !b) return { status: "empty" };
    if (unitDefs[a.key].tier !== 1 || unitDefs[b.key].tier !== 1) {
      return { status: "invalid", reason: "1단계 기본 유닛 둘만 재련할 수 있습니다." };
    }
    const excluded = new Set([a.key, b.key]);
    const pool = baseUnitKeys.filter(key => !excluded.has(key));
    return { status: pool.length ? "ready" : "invalid", pool, a, b };
  }

  function reforgeBaseUnits() {
    const result = getReforgeResult();
    if (result.status !== "ready") return toast(result.reason || "재련할 1단계 둘을 올려주세요.", "bad");
    const ingredients = [result.a, result.b];
    const freedSlots = ingredients.map(unit => unit.slotIndex).filter(value => value !== null);
    const key = result.pool[Math.floor(Math.random() * result.pool.length)];
    state.units = state.units.filter(unit => !ingredients.includes(unit));
    state.mergeSlots = [null, null];
    if (ingredients.some(unit => unit.id === state.selectedUnitId)) state.selectedUnitId = null;
    const reforged = createUnit(key);
    if (freedSlots.length) reforged.slotIndex = freedSlots[0];
    state.units.push(reforged);
    state.selectedUnitId = reforged.id;
    const excludedNames = [...new Set(ingredients.map(unit => unitDefs[unit.key].name))].join("·");
    announce("기본 룬 재련", `${excludedNames} 제외 → ${unitDefs[key].name}`, 1800);
    addLog(`<b>기본 재련</b>: ${excludedNames}을 소모해 ${unitDefs[key].name} 획득`, "good");
    tone(320, .08, "triangle", .025);
    setTimeout(() => tone(560, .1, "triangle", .025), 90);
    updateAllUI();
  }

  function autoMergeCandidates() {
    return state.units.filter(unit =>
      unit.slotIndex === null &&
      !unit.elite &&
      !state.mergeSlots.includes(unit.id) &&
      unitDefs[unit.key].tier < 5
    );
  }

  function findAutoPair(mode, randomize = false) {
    const candidates = autoMergeCandidates();
    const pairs = [];
    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        const a = candidates[i];
        const b = candidates[j];
        const da = unitDefs[a.key];
        const db = unitDefs[b.key];
        if (da.tier !== db.tier) continue;
        if (mode === "same" && a.key !== b.key) continue;
        if (mode === "random" && a.key === b.key) continue;
        const resultKey = recipeMap.get([a.key, b.key].sort().join("+"));
        if (resultKey) pairs.push({ a, b, resultKey });
      }
    }
    if (!pairs.length) return null;
    if (randomize) return pairs[Math.floor(Math.random() * pairs.length)];
    pairs.sort((left, right) =>
      unitDefs[left.a.key].tier - unitDefs[right.a.key].tier ||
      left.a.id - right.a.id ||
      left.b.id - right.b.id
    );
    return pairs[0];
  }

  function combinePair(a, b, resultKey) {
    if (!a || !b || !state.units.includes(a) || !state.units.includes(b)) return null;
    const ingredients = [a, b];
    const freedSlots = ingredients.map(unit => unit.slotIndex).filter(value => value !== null);
    state.units = state.units.filter(unit => unit.id !== a.id && unit.id !== b.id);
    state.mergeSlots = state.mergeSlots.map(id => id === a.id || id === b.id ? null : id);
    if (state.selectedUnitId === a.id || state.selectedUnitId === b.id) state.selectedUnitId = null;

    const combined = createUnit(resultKey);
    if (Math.random() < .15) {
      combined.elite = true;
      combined.secondaryElement = chooseEliteElement(resultKey, ingredients);
    }
    if (freedSlots.length) combined.slotIndex = freedSlots[0];
    state.units.push(combined);

    const wasNew = !state.discovered.has(resultKey);
    state.discovered.add(resultKey);
    checkTierFiveEasterEgg();
    return { combined, def: unitDefs[resultKey], wasNew };
  }

  function checkTierFiveEasterEgg() {
    if (state.easterEggUnlocked) return;
    const tierFiveCount = state.units.filter(unit => unitDefs[unit.key].tier === 5).length;
    if (tierFiveCount < 4) return;
    state.easterEggUnlocked = true;
    state.screenFlash = .85;
    state.screenFlashColor = "#fff0a6";
    state.screenShake = 12;
    for (let i = 0; i < 4; i++) {
      ring(360, 360, ["#ffd166", "#6fe7ff", "#e674ff", "#63e58d"][i], 90 + i * 55, "square");
    }
    starBurst(360, 360, "#fff4c4", 28, 190);
    announce("SECRET · 사중 성좌 각성", "5단계 수호자 4명 공명 · 피해 +15% · 공격 속도 +10%", 4800);
    addLog("<b>이스터에그 발견: 사중 성좌</b>가 깨어났습니다. 모든 수호자가 영구 강화됩니다.", "good");
    ui.easterEggModal?.classList.remove("hidden");
    tone(220, .18, "sine", .04);
    setTimeout(() => tone(440, .18, "sine", .04), 130);
    setTimeout(() => tone(660, .22, "sine", .04), 260);
    setTimeout(() => tone(990, .35, "sine", .05), 390);
  }

  function renderMerge() {
    document.querySelectorAll(".merge-slot").forEach((slot, i) => {
      const unit = getUnit(state.mergeSlots[i]);
      slot.innerHTML = "";
      slot.classList.toggle("filled", !!unit);
      if (!unit) {
        const span = document.createElement("span");
        span.textContent = `재료 ${i === 0 ? "A" : "B"}`;
        slot.append(span);
      } else {
        const def = unitDefs[unit.key];
        slot.append(renderSpriteCanvas(unit.key, 44));
        const name = document.createElement("strong");
        name.textContent = def.name;
        const tier = document.createElement("small");
        tier.textContent = `${def.tier}단계 · 눌러서 해제`;
        slot.append(name, tier);
      }
    });

    const result = getRecipeResult();
    ui.recipeResult.className = `recipe-result ${result.status === "ready" ? "ready" : result.status === "invalid" ? "invalid" : "locked"}`;
    const card = ui.recipeResult.querySelector(".result-card");
    card.innerHTML = "";
    if (result.status === "ready") {
      const def = unitDefs[result.key];
      card.append(renderSpriteCanvas(result.key));
      const text = document.createElement("div");
      text.innerHTML =
        `<small>${def.tier}단계 조합 결과</small><strong>${def.name}</strong>` +
        `<div class="elite-chance">15% 확률: 피해 +20% 다중 속성 엘리트</div>`;
      card.append(text);
    } else {
      const icon = document.createElement("div");
      icon.className = "mystery-icon";
      icon.textContent = result.status === "invalid" ? "×" : "?";
      const text = document.createElement("div");
      const label = result.reason || "재료를 선택하세요";
      text.innerHTML = `<small>조합 결과</small><strong>${label}</strong>`;
      card.append(icon, text);
    }
    ui.mergeBtn.disabled = result.status !== "ready" || state.gameOver;
    const reforge = getReforgeResult();
    ui.reforgeBtn.disabled = reforge.status !== "ready" || state.gameOver;
    if (reforge.status === "ready") {
      const excluded = [...new Set([reforge.a.key, reforge.b.key])];
      ui.reforgeBtn.textContent =
        `1단계 재련 · ${excluded.map(key => unitDefs[key].name).join("·")} 제외 → ${reforge.pool.length}종`;
    } else {
      ui.reforgeBtn.textContent = "1단계 재련 · 재료 둘과 다른 기본 유닛";
    }
  }

  function mergeUnits() {
    const result = getRecipeResult();
    if (result.status !== "ready") return;
    const ids = [...state.mergeSlots];
    const ingredients = ids.map(getUnit);
    const outcome = combinePair(ingredients[0], ingredients[1], result.key);
    if (!outcome) return;
    const { combined, def, wasNew } = outcome;
    state.mergeSlots = [null, null];
    state.selectedUnitId = combined.id;
    tone(440, .1);
    setTimeout(() => tone(660, .1), 90);
    setTimeout(() => tone(990, .14), 180);
    announce(
      combined.elite ? "ELITE 조합 성공!" : `${def.tier}단계 조합 성공!`,
      combined.elite
        ? `${def.name} · ${elements[def.element].name}+${elements[combined.secondaryElement].name}`
        : def.name
    );
    addLog(
      combined.elite
        ? `<b>ELITE ${def.name}</b> 탄생! 피해 +20%, 이중 속성 공격`
        : `<b>${def.name}</b> 탄생.`,
      "good"
    );
    if (combined.elite) toast(`엘리트 출현: ${def.name}`, "good");
    if (wasNew) toast(`첫 제작 기록: ${def.name}`, "good");
    updateAllUI();
  }

  function autoMerge(mode) {
    state.audioEnabled = true;
    let count = 0;
    let eliteCount = 0;
    const discoveries = [];
    const results = [];
    const limit = 40;

    while (count < limit) {
      const pair = findAutoPair(mode, mode === "random");
      if (!pair) break;
      const outcome = combinePair(pair.a, pair.b, pair.resultKey);
      if (!outcome) break;
      count++;
      if (outcome.combined.elite) eliteCount++;
      if (outcome.wasNew) discoveries.push(outcome.def.name);
      results.push(outcome.def.name);
    }

    state.mergeSlots = [null, null];
    state.selectedUnitId = null;
    if (!count) {
      toast(
        mode === "same"
          ? "대기실에 동일 캐릭터 조합이 없습니다."
          : "대기실에 가능한 조합식이 없습니다.",
        "bad"
      );
      updateAllUI();
      return;
    }

    const eliteText = eliteCount ? ` · 엘리트 ${eliteCount}명` : "";
    announce(
      mode === "same" ? "같은 것 자동조합" : "랜덤 연쇄조합",
      `${count}회 완료${eliteText}`
    );
    addLog(
      `<b>자동조합 ${count}회</b> 완료${eliteText}. 최종: ${results.slice(-3).join(", ")}`,
      "good"
    );
    if (discoveries.length) toast(`첫 제작 ${discoveries.length}종 기록`, "good");
    tone(520, .08);
    setTimeout(() => tone(780, .12), 80);
    updateAllUI();
  }

  function renderCodex() {
    ui.discoveryText.textContent = "전체 공개";
    ui.codexList.innerHTML = "";
    const entries = Object.entries(unitDefs).filter(([, def]) => def.tier === state.activeCodexTier);
    for (const [key, def] of entries) {
      const item = document.createElement("div");
      item.className = "codex-entry";
      item.append(renderSpriteCanvas(key, 36));
      const text = document.createElement("div");
      const [a, b] = def.recipe.map(k => unitDefs[k].name);
      text.innerHTML = `<strong>${def.name}</strong><small>${a} + ${b}</small>`;
      item.append(text);
      ui.codexList.append(item);
    }
  }

  function renderCompass() {
    const plan = getCompassPlan();
    const target = elements[state.targetElement];
    const source = unitDefs[plan.sourceKey];
    const result = plan.resultKey ? unitDefs[plan.resultKey] : null;
    ui.guidedSummonCost.textContent = guidedSummonCost();
    ui.guidedSummonBtn.querySelector("span").textContent = `${target.name} 재료 추적`;
    ui.compassHint.textContent = result
      ? `${result.name} 경로 분석: 지금은 ${source.name}이 가장 유효합니다.`
      : `${target.name} 경로에 필요한 ${source.name}을 추적합니다.`;
    ui.guidedSummonBtn.disabled =
      state.units.length >= MAX_UNITS ||
      state.gold < guidedSummonCost() ||
      state.gameOver;
    document.querySelectorAll(".element-targets button").forEach(button => {
      const active = button.dataset.element === state.targetElement;
      button.classList.toggle("active", active);
      button.style.setProperty("--compass-color", elements[button.dataset.element].color);
    });
  }

  function renderOvercharge() {
    const cost = overchargeCost();
    ui.overchargeCost.textContent = cost;
    if (state.overchargeActive) {
      ui.overchargeStatus.textContent = "현재 라운드 적용 중 · 피해 +18% · 공격 속도 +11%";
      ui.overchargeBtn.textContent = "과충전 가동 중";
    } else if (state.overchargePrepared) {
      ui.overchargeStatus.textContent = "다음 라운드 준비 완료 · 시작 시 자동 가동";
      ui.overchargeBtn.textContent = "과충전 준비 완료";
    } else {
      ui.overchargeStatus.textContent = "남는 룬을 다음 한 라운드의 화력으로 전환";
      ui.overchargeBtn.innerHTML = `전술 과충전 <small><b id="overchargeCost">${cost}</b> 룬</small>`;
      ui.overchargeCost = $("overchargeCost");
    }
    ui.overchargeBtn.disabled =
      state.running ||
      state.overchargePrepared ||
      state.overchargeActive ||
      state.gold < cost ||
      state.gameOver ||
      state.round >= TOTAL_ROUNDS;
  }

  function updateAllUI() {
    ui.round.textContent = `${state.round} / ${TOTAL_ROUNDS}`;
    ui.gold.textContent = Math.floor(state.gold);
    ui.lives.textContent = state.lives;
    ui.kills.textContent = state.kills;
    ui.difficultyText.textContent = state.expeditionStarted ? difficulties[state.difficulty].name : "선택 전";
    ui.summonCost.textContent = summonCost();
    ui.enemyCount.textContent = state.enemies.length + state.waveSpawnsLeft;
    renderRoster();
    renderMerge();
    renderCodex();
    renderCompass();
    renderOvercharge();
  }

  function prepareOvercharge() {
    const cost = overchargeCost();
    if (state.running) return toast("전투 중에는 과충전을 준비할 수 없습니다.", "bad");
    if (state.overchargePrepared) return toast("다음 라운드 과충전이 이미 준비됐습니다.", "bad");
    if (state.gold < cost) return toast("과충전에 필요한 룬이 부족합니다.", "bad");
    if (state.round >= TOTAL_ROUNDS) return;
    state.gold -= cost;
    state.overchargePrepared = true;
    announce("전술 과충전 준비", `다음 라운드 피해 +18% · 공격 속도 +11%`, 1900);
    addLog(`<b>과충전 예약</b>: ${cost} 룬을 다음 라운드 화력으로 변환`, "good");
    tone(280, .08, "sawtooth", .025);
    setTimeout(() => tone(560, .12, "sawtooth", .025), 90);
    updateAllUI();
  }

  function beginExpedition() {
    const config = difficulties[state.difficulty];
    state.gold = config.gold;
    state.lives = config.lives;
    state.expeditionStarted = true;
    ui.difficultyModal.classList.add("hidden");
    renderThreatIntel(1);
    addLog(`<b>${config.name} 난이도:</b> 속성 상성과 적 특성을 확인하세요.`, "good");
    announce(`${config.name} 원정`, "첫 수호자를 소환하고 배치하세요", 1800);
    updateAllUI();
  }

  function unlockedEnemyTypes(round) {
    const shift = state.difficulty === "hard" ? 1 : 0;
    const list = ["grunt"];
    if (round >= 2 - shift) list.push("runner");
    if (round >= 3 - shift) list.push("shield");
    if (round >= 4 - shift) list.push("brute");
    if (round >= 6 - shift) list.push("regenerator");
    if (round >= 8 - shift) list.push("splitter");
    if (round >= 11 - shift) list.push("phase");
    return list;
  }

  function bossProfile(round) {
    return ({
      5: { type: "brute", element: "earth" },
      10: { type: "shield", element: "frost" },
      15: { type: "phase", element: "void" },
      20: { type: "regenerator", element: "solar" },
      25: { type: "splitter", element: "lunar" },
      30: { type: "phase", element: "arcane" }
    })[round];
  }

  function renderThreatIntel(round) {
    const types = unlockedEnemyTypes(round);
    const boss = bossProfile(round);
    ui.threatIntel.innerHTML = "";
    for (const key of types) {
      const def = enemyTypes[key];
      const chip = document.createElement("span");
      chip.className = "threat-chip";
      const dot = document.createElement("i");
      const color = elements[def.element]?.color || "#a9acc2";
      dot.style.background = color;
      chip.append(dot);
      chip.insertAdjacentHTML("beforeend", `${def.name} <b>${def.hint}</b>`);
      ui.threatIntel.append(chip);
    }
    if (boss) {
      const chip = document.createElement("span");
      chip.className = "threat-chip boss";
      chip.innerHTML = `보스 <b>${bossName(round)} · ${elements[boss.element].name}</b>`;
      ui.threatIntel.append(chip);
    }
  }

  function startWave() {
    state.audioEnabled = true;
    if (state.running || state.gameOver) return;
    if (!state.units.some(u => u.slotIndex !== null)) {
      return toast("먼저 캐릭터를 선택하고 중앙 배치 칸에 놓아주세요.", "bad");
    }
    state.round++;
    state.overchargeActive = state.overchargePrepared;
    state.overchargePrepared = false;
    state.running = true;
    state.waveResolved = false;
    state.waveSpawnsLeft = waveEnemyCount(state.round);
    state.waveSpawnIndex = 0;
    state.spawnTimer = .15;
    ui.startBtn.classList.add("hidden");
    const bossRound = BOSS_ROUNDS.includes(state.round);
    ui.waveBadge.textContent = bossRound ? (state.round === TOTAL_ROUNDS ? "FINAL BOSS" : "BOSS WAVE") : `WAVE ${String(state.round).padStart(2, "0")}`;
    ui.waveBadge.classList.toggle("boss", bossRound);
    ui.waveTitle.textContent = bossRound ? bossName(state.round) + " 출현 경보" : `${state.round}차 침공이 시작되었습니다`;
    renderThreatIntel(state.round);
    document.querySelectorAll(".boss-marks i").forEach(mark => {
      mark.classList.toggle("current", Number(mark.dataset.boss) === state.round);
    });
    if (bossRound) {
      announce(state.round === TOTAL_ROUNDS ? "최종 보스 접근" : "중간 보스 접근", bossName(state.round), 2800);
      addLog(`<b>${bossName(state.round)}</b>가 외곽 회랑에 진입했습니다.`, "danger");
      tone(120, .35, "sawtooth", .05);
    } else if (state.overchargeActive) {
      announce(`ROUND ${state.round} · OVERCHARGE`, "피해 +18% · 공격 속도 +11%", 1700);
    } else {
      announce(`ROUND ${state.round}`, "외곽 회랑을 방어하세요", 1400);
    }
    updateAllUI();
  }

  function bossName(round) {
    return ({
      5:"철갑 골렘 볼트",
      10:"빙하 마녀 셀린",
      15:"심연 기사 모르",
      20:"종말룡 크로노스",
      25:"월식 군체 오르비스",
      30:"무한핵 아르카나"
    })[round];
  }

  function spawnEnemy() {
    const round = state.round;
    const difficulty = difficulties[state.difficulty];
    const isBossWave = BOSS_ROUNDS.includes(round);
    const isLastSpawn = state.waveSpawnsLeft === 1;
    const boss = isBossWave && isLastSpawn;
    const available = unlockedEnemyTypes(round);
    const profile = boss
      ? bossProfile(round)
      : null;
    const typeKey = boss
      ? profile.type
      : available[(state.waveSpawnIndex * 3 + round + Math.floor(Math.random() * available.length)) % available.length];
    const type = enemyTypes[typeKey];
    const eliteChance = Math.max(0, .06 + round * .008 + difficulty.eliteBonus);
    const elite = !boss && round >= (state.difficulty === "hard" ? 4 : 6) && Math.random() < eliteChance;
    const baseHp = enemyBaseHp(round);
    let hp = baseHp * type.hp * difficulty.hp * (elite ? 2.7 : 1) * (.85 + Math.random() * .3);
    if (boss) hp = baseHp * (round === TOTAL_ROUNDS ? 46 : round >= 25 ? 30 : 25) * difficulty.boss;
    const element = boss ? profile.element : type.element;
    const maxShield = hp * (type.shield || 0) * (boss ? 1.4 : 1);
    const enemy = {
      id: state.uid++,
      progress: 0,
      hp,
      maxHp: hp,
      speed: (boss ? 21 + round * .45 : (35 + round * .72) * type.speed * (elite ? .82 : 1)) * difficulty.speed,
      reward: Math.round(enemyRewardBase(round) * type.reward * difficulty.reward * (boss ? 15 : elite ? 2.8 : 1)),
      boss,
      elite,
      type: typeKey,
      typeName: type.name,
      element,
      armor: type.armor || 0,
      shield: maxShield,
      maxShield,
      regen: (type.regen || 0) * (boss ? .5 : 1),
      dodge: type.dodge || 0,
      split: !!type.split && !boss,
      fragment: false,
      burn: 0,
      runes: [],
      sequenceFlash: 0,
      round,
      slow: 0,
      slowPower: 0,
      vulnerable: 0,
      flash: 0,
      phase: 0
    };
    state.enemies.push(enemy);
    state.waveSpawnsLeft--;
    state.waveSpawnIndex++;
  }

  function pathPosition(progress) {
    const p = ((progress % PATH.total) + PATH.total) % PATH.total;
    if (p < PATH.side) return { x: PATH.left + p, y: PATH.top, dir: 0 };
    if (p < PATH.side * 2) return { x: PATH.right, y: PATH.top + p - PATH.side, dir: 1 };
    if (p < PATH.side * 3) return { x: PATH.right - (p - PATH.side * 2), y: PATH.bottom, dir: 2 };
    return { x: PATH.left, y: PATH.bottom - (p - PATH.side * 3), dir: 3 };
  }

  function update(dt) {
    if (state.paused || state.gameOver) return;
    const scaled = dt * state.speed;
    if (state.running) {
      state.spawnTimer -= scaled;
      if (state.waveSpawnsLeft > 0 && state.spawnTimer <= 0) {
        spawnEnemy();
        state.spawnTimer = Math.max(.42, .78 - state.round * .012);
      }
    }

    for (const unit of state.units) {
      if (unit.slotIndex === null) continue;
      unit.cooldown -= scaled;
      if (unit.cooldown <= 0) attack(unit);
    }

    for (let i = state.enemies.length - 1; i >= 0; i--) {
      const e = state.enemies[i];
      e.flash = Math.max(0, e.flash - scaled * 5);
      e.vulnerable = Math.max(0, e.vulnerable - scaled);
      e.slow = Math.max(0, e.slow - scaled);
      e.burn = Math.max(0, e.burn - scaled);
      e.sequenceFlash = Math.max(0, e.sequenceFlash - scaled);
      e.runes = (e.runes || []).map(rune => ({ ...rune, life: rune.life - scaled })).filter(rune => rune.life > 0);
      if (e.regen > 0 && e.burn <= 0 && e.hp > 0) {
        e.hp = Math.min(e.maxHp, e.hp + e.maxHp * e.regen * scaled);
      }
      const speedFactor = e.slow > 0 ? 1 - e.slowPower : 1;
      e.progress += e.speed * speedFactor * scaled;
      if (e.progress >= PATH.total) {
        state.enemies.splice(i, 1);
        const damage = e.boss && e.round === TOTAL_ROUNDS
          ? state.lives
          : e.boss ? 8 : e.elite ? 3 : 1;
        state.lives = Math.max(0, state.lives - damage);
        burst(PATH.left, PATH.top, "#ff647c", e.boss ? 20 : 8);
        addLog(`<b>${e.boss ? "보스" : "적"} 통과!</b> 성벽 내구도 -${damage}`, "danger");
        tone(100, .16, "sawtooth", .04);
        if (state.lives <= 0) endGame(false);
      }
    }

    for (let i = state.projectiles.length - 1; i >= 0; i--) {
      const p = state.projectiles[i];
      const target = state.enemies.find(e => e.id === p.targetId);
      p.life -= scaled;
      if (!target || p.life <= 0) {
        state.projectiles.splice(i, 1);
        continue;
      }
      const pos = pathPosition(target.progress);
      const dx = pos.x - p.x, dy = pos.y - p.y;
      const dist = Math.hypot(dx, dy);
      const step = p.speed * scaled;
      if (dist <= step + 7) {
        applyHit(target, p);
        state.projectiles.splice(i, 1);
      } else {
        p.x += dx / dist * step;
        p.y += dy / dist * step;
        p.trail.push({ x: p.x, y: p.y, life: .18 });
        if (p.trail.length > 5) p.trail.shift();
      }
      for (const t of p.trail) t.life -= scaled;
    }

    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.life -= scaled;
      p.x += p.vx * scaled;
      p.y += p.vy * scaled;
      if (p.gravity !== false) p.vy += 18 * scaled;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
    state.screenFlash = Math.max(0, state.screenFlash - scaled * 2.8);
    state.screenShake = Math.max(0, state.screenShake - scaled * 18);
    for (let i = state.damageTexts.length - 1; i >= 0; i--) {
      const d = state.damageTexts[i];
      d.life -= scaled;
      d.y -= 24 * scaled;
      if (d.life <= 0) state.damageTexts.splice(i, 1);
    }

    if (state.running && state.waveSpawnsLeft === 0 && state.enemies.length === 0 && !state.waveResolved) {
      resolveWave();
    }
  }

  function selectTarget(unit, def, stats) {
    const origin = slots[unit.slotIndex];
    let target = null;
    let bestScore = -Infinity;
    for (const enemy of state.enemies) {
      const pos = pathPosition(enemy.progress);
      if (Math.hypot(pos.x - origin.x, pos.y - origin.y) > stats.range) continue;
      let score = enemy.progress;
      if (def.effect === "execute") {
        score = (1 - enemy.hp / enemy.maxHp) * 5000 + enemy.progress;
      } else if (["slow", "freeze"].includes(def.effect)) {
        score = enemy.speed * (enemy.slow > 0 ? .2 : 1) * 100 + enemy.progress;
      } else if (["splash", "nova"].includes(def.effect)) {
        const nearby = state.enemies.filter(other => {
          const op = pathPosition(other.progress);
          return Math.hypot(op.x - pos.x, op.y - pos.y) <= Math.max(55, stats.radius);
        }).length;
        score = nearby * 2400 + enemy.progress;
      } else if (def.effect === "shatter") {
        score = (enemy.shield + enemy.armor * enemy.maxHp) * 3 + enemy.progress;
      } else if (def.effect === "vulnerable") {
        score = (enemy.boss ? 6000 : enemy.elite ? 3000 : 0) + enemy.hp + enemy.progress;
      }
      if (score > bestScore) {
        target = enemy;
        bestScore = score;
      }
    }
    return target;
  }

  function attack(unit) {
    const def = unitDefs[unit.key];
    const stats = combatStats(unit);
    const origin = slots[unit.slotIndex];
    const target = selectTarget(unit, def, stats);
    if (!target) {
      unit.cooldown = .08;
      return;
    }
    let damage = stats.damage;
    let crit = false;
    if (def.effect === "crit" && Math.random() < .24) {
      damage *= 2.2;
      crit = true;
    }
    const color = elements[def.element].projectile;
    const attackElements = unit.elite
      ? [def.element, unit.secondaryElement]
      : [def.element];
    state.projectiles.push({
      x: origin.x, y: origin.y - 14, targetId: target.id,
      damage, color, secondaryColor: unit.elite ? elements[unit.secondaryElement].projectile : null,
      element: def.element, elements: attackElements, effect: def.effect,
      speed: def.effect === "beam" ? 760 : 450 + def.tier * 30,
      life: 1.4, trail: [], crit, tier: def.tier, radius: stats.radius,
      chainCount: def.effect === "chain" ? Math.max(1, Math.min(4, def.tier)) : 0,
      etch: true
    });
    unit.cooldown = stats.rate;
    muzzleEffect(origin.x, origin.y - 14, def, color);
    tone(180 + def.tier * 65, .025, "square", .008);
  }

  function applyHit(target, projectile) {
    if (!state.enemies.includes(target)) return;
    const pos = pathPosition(target.progress);
    const projectileElements = projectile.elements || [projectile.element];
    if (target.dodge > 0 && !projectileElements.some(element => ["arcane", "solar"].includes(element)) && projectile.effect !== "beam" && Math.random() < target.dodge) {
      state.damageTexts.push({ x: pos.x, y: pos.y - 18, text: "MISS", life: .62, maxLife: .62, color: "#b7a0ff" });
      return;
    }

    if (projectile.effect === "slow") {
      target.slow = 1.5; target.slowPower = Math.max(target.slowPower, target.type === "runner" ? .18 : .28);
    } else if (projectile.effect === "freeze") {
      target.slow = 1.25; target.slowPower = Math.max(target.slowPower, target.type === "runner" ? .42 : .62);
    } else if (projectile.effect === "vulnerable") {
      target.vulnerable = 2.4;
    } else if (projectile.effect === "burn") {
      target.burn = 2.8;
    } else if (projectile.effect === "shatter") {
      target.armor = Math.max(0, target.armor - .06);
    }

    if (["splash", "nova"].includes(projectile.effect)) {
      const radius = projectile.radius || (projectile.effect === "nova" ? 105 : 62);
      for (const enemy of [...state.enemies]) {
        if (enemy.id === target.id) continue;
        const ep = pathPosition(enemy.progress);
        if (Math.hypot(ep.x - pos.x, ep.y - pos.y) <= radius) {
          hitEnemy(enemy, projectile, projectile.effect === "nova" ? .72 : .45);
        }
      }
      ring(pos.x, pos.y, projectile.color, radius, projectile.effect === "nova" ? "square" : "round");
    }

    if (projectile.effect === "chain") {
      const candidates = state.enemies
        .filter(e => e.id !== target.id)
        .map(e => ({ e, p: pathPosition(e.progress) }))
        .filter(o => Math.hypot(o.p.x - pos.x, o.p.y - pos.y) < (projectile.radius || 100))
        .slice(0, projectile.chainCount || 1);
      for (const { e, p } of candidates) {
        state.projectiles.push({
          x: pos.x, y: pos.y, targetId: e.id, damage: projectile.damage * .48,
          color: projectile.color, element: projectile.element, elements: projectile.elements, effect: "none", speed: 800, life: .35, trail: [],
          crit: false, tier: projectile.tier, radius: 0, chainCount: 0, etch: false
        });
        state.particles.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: .2, maxLife: .2, color: projectile.color });
      }
    }
    hitEnemy(target, projectile, 1);
    impactEffect(pos.x, pos.y, projectile);
  }

  function affinityMultiplier(attackElement, enemyElement) {
    if (!attackElement || enemyElement === "neutral") return 1;
    const strongAgainst = {
      fire: "nature", nature: "earth", earth: "spark", spark: "frost", frost: "fire",
      solar: "void", void: "solar", arcane: "lunar", lunar: "arcane"
    };
    const difficulty = difficulties[state.difficulty];
    if (strongAgainst[attackElement] === enemyElement) return difficulty.affinity;
    if (strongAgainst[enemyElement] === attackElement) return difficulty.weak;
    return attackElement === "arcane" ? 1.08 : 1;
  }

  function projectileAffinity(projectile, enemyElement) {
    const attackElements = projectile.elements || [projectile.element];
    return Math.max(...attackElements.map(element => affinityMultiplier(element, enemyElement)));
  }

  function resolveRuneSequence(enemy, projectile) {
    if (projectile.etch === false || !projectile.element) return null;
    enemy.runes ||= [];
    const attackElements = projectile.elements || [projectile.element];
    const triggered = [];
    let tripleResonance = false;
    for (const element of attackElements) {
      const previous = enemy.runes.at(-1)?.element;
      enemy.runes.push({ element, life: 4.2 });
      if (enemy.runes.length > 3) enemy.runes.shift();
      const sequence = previous ? runeSequences[`${previous}>${element}`] : null;
      if (sequence) triggered.push({ ...sequence });
      const distinct = new Set(enemy.runes.map(rune => rune.element)).size;
      if (distinct >= 3 && !tripleResonance) {
        triggered.push({ name: "삼중 공명", multiplier: 1.32, radius: 48, color: "#f4f1ff" });
        tripleResonance = true;
      }
    }
    if (!triggered.length) return null;
    const result = {
      name: triggered.map(sequence => sequence.name).join("+"),
      multiplier: 1 + triggered.reduce((sum, sequence) => sum + (sequence.multiplier - 1), 0) * .78,
      radius: Math.max(...triggered.map(sequence => sequence.radius)),
      color: triggered.at(-1).color,
      slow: Math.max(0, ...triggered.map(sequence => sequence.slow || 0)),
      burn: Math.max(0, ...triggered.map(sequence => sequence.burn || 0)),
      armorBreak: triggered.reduce((sum, sequence) => sum + (sequence.armorBreak || 0), 0),
      shieldBreak: triggered.reduce((sum, sequence) => sum + (sequence.shieldBreak || 0), 0),
      vulnerable: Math.max(0, ...triggered.map(sequence => sequence.vulnerable || 0)),
      execute: triggered.some(sequence => sequence.execute)
    };
    if (result.slow) {
      enemy.slow = Math.max(enemy.slow, 1.4);
      enemy.slowPower = Math.max(enemy.slowPower, result.slow);
    }
    if (result.burn) enemy.burn = Math.max(enemy.burn, result.burn);
    if (result.armorBreak) enemy.armor = Math.max(0, enemy.armor - result.armorBreak);
    if (result.shieldBreak) enemy.shield = Math.max(0, enemy.shield - enemy.maxShield * result.shieldBreak);
    if (result.vulnerable) enemy.vulnerable = Math.max(enemy.vulnerable, result.vulnerable);
    if (result.execute && enemy.hp / enemy.maxHp <= .35) result.multiplier *= 1.45;
    enemy.sequenceFlash = .45;
    return result;
  }

  function hitEnemy(enemy, projectile, factor = 1) {
    if (!state.enemies.includes(enemy)) return;
    let amount = projectile.damage * factor;
    const sequence = factor >= .95 ? resolveRuneSequence(enemy, projectile) : null;
    if (sequence) amount *= sequence.multiplier;
    const affinity = projectileAffinity(projectile, enemy.element);
    amount *= affinity;
    if (enemy.vulnerable > 0) amount *= 1.28;
    if (projectile.effect === "burn") amount *= 1.16;
    if (projectile.effect === "execute" && enemy.hp / enemy.maxHp <= .3) amount *= 1.75;
    if (enemy.armor > 0 && !["pierce", "beam"].includes(projectile.effect)) {
      amount *= 1 - enemy.armor;
    }
    const pos = pathPosition(enemy.progress);
    const sequenceTargets = sequence
      ? state.enemies.filter(other => {
          if (other.id === enemy.id) return false;
          const op = pathPosition(other.progress);
          return Math.hypot(op.x - pos.x, op.y - pos.y) <= sequence.radius;
        })
      : [];
    damageEnemy(enemy, amount, projectile, affinity, sequence?.name || "");
    if (sequence) {
      synergyImpact(pos.x, pos.y, sequence, projectile);
      for (const nearby of sequenceTargets) {
        if (!state.enemies.includes(nearby)) continue;
        const splashProjectile = { ...projectile, etch: false, crit: false };
        const splashAffinity = projectileAffinity(projectile, nearby.element);
        let splashDamage = projectile.damage * sequence.multiplier * .38 * splashAffinity;
        if (nearby.armor > 0 && !["pierce", "beam"].includes(projectile.effect)) splashDamage *= 1 - nearby.armor;
        damageEnemy(nearby, splashDamage, splashProjectile, splashAffinity, sequence.name);
      }
      tone(520 + projectile.tier * 45, .06, "square", .018);
    }
  }

  function damageEnemy(enemy, amount, projectile, affinity = 1, label = "") {
    if (!state.enemies.includes(enemy)) return;
    let hpDamage = amount;
    if (enemy.shield > 0) {
      if (projectile.effect === "beam") {
        const shieldPortion = amount * .35;
        const absorbed = Math.min(enemy.shield, shieldPortion);
        enemy.shield -= absorbed;
        hpDamage = amount * .65 + Math.max(0, shieldPortion - absorbed);
      } else {
        const shieldMultiplier = projectile.effect === "shatter" ? 2.3 : 1;
        const absorbed = Math.min(enemy.shield, amount * shieldMultiplier);
        enemy.shield -= absorbed;
        hpDamage = Math.max(0, amount - absorbed / shieldMultiplier);
      }
    }
    enemy.hp -= hpDamage;
    enemy.flash = 1;
    const pos = pathPosition(enemy.progress);
    const affinityText = affinity > 1.1 ? "WEAK " : affinity < .9 ? "RESIST " : "";
    const prefix = label ? `${label} ` : projectile.crit ? "CRIT " : affinityText;
    const text = hpDamage > 0 ? `${prefix}${Math.round(hpDamage)}` : "SHIELD";
    const color = label ? "#ffd166" : projectile.crit || affinity > 1.1 ? "#ffd166" : affinity < .9 ? "#8b8da8" : enemy.shield > 0 ? "#82dcff" : "#fff3cf";
    state.damageTexts.push({ x: pos.x, y: pos.y - 18, text, life: .62, maxLife: .62, color });
    if (enemy.hp <= 0) {
      const index = state.enemies.indexOf(enemy);
      if (index >= 0) state.enemies.splice(index, 1);
      state.gold += enemy.reward;
      state.kills++;
      if (enemy.split && !enemy.fragment) {
        for (let i = 0; i < 2; i++) {
          const fragmentHp = enemy.maxHp * .28;
          state.enemies.push({
            ...enemy,
            id: state.uid++,
            progress: Math.max(0, enemy.progress - i * 14),
            hp: fragmentHp,
            maxHp: fragmentHp,
            speed: enemy.speed * 1.28,
            reward: Math.max(1, Math.round(enemy.reward * .28)),
            split: false,
            fragment: true,
            shield: 0,
            maxShield: 0,
            armor: 0,
            dodge: 0,
            runes: [],
            sequenceFlash: 0,
            typeName: "분열 조각"
          });
        }
      }
      burst(pos.x, pos.y, enemy.boss ? "#ff647c" : "#b681ff", enemy.boss ? 38 : 12);
      if (enemy.boss) {
        announce("보스 격파!", `+${enemy.reward} 룬 획득`, 2300);
        addLog(`<b>${bossName(enemy.round)} 격파!</b> 보상 ${enemy.reward} 룬`, "good");
        tone(220, .12);
        setTimeout(() => tone(440, .18), 100);
        setTimeout(() => tone(880, .22), 200);
      }
    }
  }

  function burst(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU;
      const s = 25 + Math.random() * 75;
      const life = .35 + Math.random() * .4;
      state.particles.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life, maxLife: life, color, kind: "pixel"
      });
    }
  }

  function ring(x, y, color, radius, style = "round") {
    state.particles.push({
      x, y, vx: 0, vy: 0, life: .34, maxLife: .34, color,
      kind: "ring", radius, style, gravity: false
    });
  }

  function starBurst(x, y, color, count = 12, speed = 120) {
    for (let i = 0; i < count; i++) {
      const angle = i / count * TAU + Math.random() * .08;
      const life = .35 + Math.random() * .28;
      state.particles.push({
        x, y,
        vx: Math.cos(angle) * (speed * (.65 + Math.random() * .45)),
        vy: Math.sin(angle) * (speed * (.65 + Math.random() * .45)),
        life, maxLife: life, color,
        kind: i % 2 ? "spark" : "shard", gravity: false, angle
      });
    }
  }

  function slashEffect(x, y, color, angle = -Math.PI / 4, length = 42) {
    state.particles.push({
      x, y, vx: 0, vy: 0, life: .22, maxLife: .22, color,
      kind: "slash", angle, length, gravity: false
    });
  }

  function muzzleEffect(x, y, def, color) {
    const count = def.effect === "nova" ? 9 : def.effect === "splash" ? 6 : 3;
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - .5) * 1.6;
      const life = .16 + Math.random() * .16;
      state.particles.push({
        x, y,
        vx: Math.cos(angle) * (25 + Math.random() * 48),
        vy: Math.sin(angle) * (25 + Math.random() * 48),
        life, maxLife: life, color,
        kind: ["freeze", "slow"].includes(def.effect) ? "shard" :
          ["crit", "execute", "pierce"].includes(def.effect) ? "spark" : "pixel",
        gravity: false, angle
      });
    }
    if (def.effect === "beam") ring(x, y, color, 18, "square");
  }

  function impactEffect(x, y, projectile) {
    const color = projectile.color;
    const tier = projectile.tier || 1;
    if (projectile.effect === "burn") {
      burst(x, y, "#ff6b58", tier + 5);
      starBurst(x, y, "#ffd166", 6 + tier, 85);
    } else if (["slow", "freeze"].includes(projectile.effect)) {
      starBurst(x, y, "#d9fbff", 7 + tier * 2, 105);
      ring(x, y, "#6fe7ff", 28 + tier * 4, "diamond");
    } else if (projectile.effect === "chain") {
      starBurst(x, y, "#fff5ad", 8 + tier, 135);
      ring(x, y, "#ffe05c", 24 + tier * 5, "jagged");
    } else if (["splash", "nova"].includes(projectile.effect)) {
      burst(x, y, color, 8 + tier * 3);
      starBurst(x, y, "#fff1b8", 8 + tier * 2, projectile.effect === "nova" ? 175 : 115);
      state.screenShake = Math.max(state.screenShake, projectile.effect === "nova" ? 5 : 2);
    } else if (["crit", "execute"].includes(projectile.effect)) {
      slashEffect(x, y, color, -Math.PI / 4, 34 + tier * 6);
      slashEffect(x, y, "#fff1d0", Math.PI / 4, 24 + tier * 5);
      starBurst(x, y, color, 5 + tier, 115);
    } else if (projectile.effect === "beam") {
      ring(x, y, color, 26 + tier * 4, "square");
      slashEffect(x, y, "#ffffff", 0, 24 + tier * 5);
      slashEffect(x, y, color, Math.PI / 2, 24 + tier * 5);
    } else if (projectile.effect === "shatter") {
      starBurst(x, y, "#ffe0a3", 9 + tier * 2, 125);
      ring(x, y, color, 24 + tier * 4, "diamond");
    } else {
      burst(x, y, color, tier + 4);
    }
  }

  function synergyImpact(x, y, sequence, projectile) {
    const power = Math.min(16, 8 + projectile.tier * 2);
    ring(x, y, sequence.color, sequence.radius, "jagged");
    ring(x, y, projectile.color, sequence.radius * .58, "diamond");
    starBurst(x, y, sequence.color, power, 145 + projectile.tier * 16);
    slashEffect(x, y, "#ffffff", Math.random() * TAU, sequence.radius * .85);
    state.screenFlash = Math.max(state.screenFlash, .13 + projectile.tier * .025);
    state.screenFlashColor = sequence.color;
    state.screenShake = Math.max(state.screenShake, 2 + projectile.tier * .7);
  }

  function resolveWave() {
    state.waveResolved = true;
    state.running = false;
    state.overchargeActive = false;
    const bonus = roundSupplyBonus(state.round);
    state.gold += bonus;
    document.querySelectorAll(".boss-marks i").forEach(mark => {
      if (Number(mark.dataset.boss) === state.round) {
        mark.classList.remove("current");
        mark.classList.add("cleared");
      }
    });
    if (state.round >= TOTAL_ROUNDS) {
      endGame(true);
      return;
    }
    announce("라운드 방어 성공", `정비 보급 +${bonus} 룬`);
    addLog(`<b>${state.round} 라운드 완료.</b> 정비 보급 ${bonus} 룬`, "good");
    ui.waveBadge.textContent = "정비 단계";
    ui.waveBadge.classList.remove("boss");
    ui.waveTitle.textContent = "소환과 조합을 마치고 다음 침공을 시작하세요";
    ui.startBtn.textContent = `ROUND ${state.round + 1} 시작`;
    ui.startBtn.classList.remove("hidden");
    renderThreatIntel(state.round + 1);
    updateAllUI();
  }

  function endGame(victory) {
    state.gameOver = true;
    state.running = false;
    ui.startBtn.classList.add("hidden");
    $("endEyebrow").textContent = victory ? "MISSION COMPLETE" : "FORTRESS FALLEN";
    $("endTitle").textContent = victory ? "사각 성채 수호 성공!" : "성벽이 무너졌습니다";
    $("endDescription").textContent = victory
      ? "무한핵 아르카나의 순환을 끊고 30층 룬 회랑을 되찾았습니다."
      : "조합식을 바꾸고 배치를 다듬어 다시 도전해보세요.";
    $("resultRound").textContent = state.round;
    $("resultKills").textContent = state.kills;
    $("resultDiscoveries").textContent = state.discovered.size - 6;
    ui.endModal.classList.remove("hidden");
  }

  function handleCanvasMove(event) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * canvas.width / rect.width;
    const y = (event.clientY - rect.top) * canvas.height / rect.height;
    state.hoverSlot = slots.findIndex(s => Math.hypot(s.x - x, s.y - y) < 31);
  }

  function handleCanvasClick(event) {
    state.audioEnabled = true;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * canvas.width / rect.width;
    const y = (event.clientY - rect.top) * canvas.height / rect.height;
    const slotIndex = slots.findIndex(s => Math.hypot(s.x - x, s.y - y) < 34);
    if (slotIndex < 0) return;
    const occupant = state.units.find(u => u.slotIndex === slotIndex);
    const selected = getUnit(state.selectedUnitId);
    if (selected) {
      if (occupant && occupant.id !== selected.id) {
        const old = selected.slotIndex;
        occupant.slotIndex = old;
      }
      selected.slotIndex = selected.slotIndex === slotIndex ? null : slotIndex;
      state.selectedUnitId = null;
      tone(300, .04);
    } else if (occupant) {
      state.selectedUnitId = occupant.id;
      toast(`${unitDefs[occupant.key].name} 선택됨 · 다른 칸을 눌러 이동`, "");
    }
    updateAllUI();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    if (state.screenShake > 0) {
      const shake = state.screenShake;
      ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
    }
    drawGround();
    drawPath();
    drawFortress();
    drawSlots();
    drawEnemies();
    drawProjectiles();
    drawParticles();
    drawDamageTexts();
    ctx.restore();
    if (state.screenFlash > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(.32, state.screenFlash * .36);
      ctx.fillStyle = state.screenFlashColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }

  function drawGround() {
    ctx.fillStyle = "#111528";
    ctx.fillRect(0, 0, 720, 720);
    for (let y = 0; y < 720; y += 24) {
      for (let x = 0; x < 720; x += 24) {
        const parity = ((x / 24 + y / 24) % 2);
        ctx.fillStyle = parity ? "#14182b" : "#171a30";
        ctx.fillRect(x, y, 24, 24);
        if ((x * 7 + y * 3) % 11 === 0) {
          ctx.fillStyle = "#26223c";
          ctx.fillRect(x + 4, y + 5, 3, 3);
        }
      }
    }
    ctx.fillStyle = "#222038";
    for (let x = 24; x < 720; x += 96) {
      ctx.fillRect(x, 20, 16, 8);
      ctx.fillRect(x + 8, 692, 16, 8);
    }
  }

  function drawPath() {
    ctx.fillStyle = "#0c0f1d";
    ctx.fillRect(44, 44, 632, 632);
    ctx.fillStyle = "#36324b";
    ctx.fillRect(56, 56, 608, 608);
    ctx.fillStyle = "#1d2035";
    ctx.fillRect(104, 104, 512, 512);
    ctx.strokeStyle = "#65617f";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);
    ctx.strokeRect(PATH.left, PATH.top, PATH.side, PATH.side);
    ctx.setLineDash([]);
    ctx.fillStyle = "#7f3d5e";
    ctx.fillRect(54, 54, 36, 36);
    ctx.fillStyle = "#ff7895";
    ctx.fillRect(61, 61, 22, 22);
    ctx.fillStyle = "#fff1b8";
    ctx.fillRect(67, 67, 10, 10);
  }

  function drawFortress() {
    ctx.fillStyle = "#0c0f1d";
    ctx.fillRect(144, 144, 432, 432);
    ctx.fillStyle = "#292c48";
    ctx.fillRect(154, 154, 412, 412);
    ctx.fillStyle = "#1d2037";
    ctx.fillRect(166, 166, 388, 388);
    ctx.strokeStyle = "#4d5072";
    ctx.lineWidth = 2;
    for (let x = 178; x <= 538; x += 36) {
      ctx.beginPath(); ctx.moveTo(x, 166); ctx.lineTo(x, 554); ctx.stroke();
    }
    for (let y = 178; y <= 538; y += 36) {
      ctx.beginPath(); ctx.moveTo(166, y); ctx.lineTo(554, y); ctx.stroke();
    }
    ctx.fillStyle = "#171a30";
    ctx.fillRect(314, 314, 92, 92);
    ctx.fillStyle = "#342857";
    ctx.fillRect(326, 326, 68, 68);
    const pulse = 8 + Math.sin(performance.now() / (state.easterEggUnlocked ? 180 : 500)) * 3;
    const awakenedColors = ["#ffd166", "#6fe7ff", "#e674ff", "#63e58d"];
    ctx.fillStyle = state.easterEggUnlocked
      ? awakenedColors[Math.floor(performance.now() / 120) % awakenedColors.length]
      : "#71e1ff";
    ctx.fillRect(352, 337 - pulse / 2, 16, 46 + pulse);
    ctx.fillRect(337 - pulse / 2, 352, 46 + pulse, 16);
    ctx.fillStyle = "#e6fbff";
    ctx.fillRect(355, 355, 10, 10);
    ctx.fillStyle = "#101426";
    for (const [x, y] of [[144,144],[544,144],[144,544],[544,544]]) {
      ctx.fillRect(x, y, 32, 32);
      ctx.fillStyle = "#596080"; ctx.fillRect(x + 7, y + 7, 18, 18); ctx.fillStyle = "#101426";
    }
  }

  function drawSlots() {
    const selected = getUnit(state.selectedUnitId);
    if (selected?.slotIndex !== null && selected?.slotIndex !== undefined) {
      const s = slots[selected.slotIndex];
      const stats = combatStats(selected);
      ctx.save();
      ctx.fillStyle = "rgba(255, 209, 102, .055)";
      ctx.strokeStyle = "rgba(255, 209, 102, .55)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(s.x, s.y - 8, stats.range, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.lineWidth = 3;
    for (let i = 0; i < SLOT_RING.length; i++) {
      const aSlot = SLOT_RING[i];
      const bSlot = SLOT_RING[(i + 1) % SLOT_RING.length];
      const a = state.units.find(unit => unit.slotIndex === aSlot);
      const b = state.units.find(unit => unit.slotIndex === bSlot);
      if (!a || !b) continue;
      const same = unitDefs[a.key].element === unitDefs[b.key].element;
      ctx.strokeStyle = same ? "rgba(255,209,102,.45)" : "rgba(91,240,178,.42)";
      ctx.beginPath();
      ctx.moveTo(slots[aSlot].x, slots[aSlot].y);
      ctx.lineTo(slots[bSlot].x, slots[bSlot].y);
      ctx.stroke();
    }
    ctx.restore();

    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      const unit = state.units.find(u => u.slotIndex === i);
      const hover = state.hoverSlot === i;
      ctx.fillStyle = hover ? "#8a6b42" : "#303452";
      ctx.fillRect(s.x - 29, s.y - 20, 58, 42);
      ctx.fillStyle = hover ? "#ffd166" : "#646988";
      ctx.fillRect(s.x - 25, s.y - 16, 50, 34);
      ctx.fillStyle = "#171a30";
      ctx.fillRect(s.x - 21, s.y - 12, 42, 26);
      if (unit) {
        const def = unitDefs[unit.key];
        if (state.selectedUnitId === unit.id) {
          ctx.strokeStyle = "#ffd166";
          ctx.lineWidth = 3;
          ctx.strokeRect(s.x - 32, s.y - 38, 64, 64);
        }
        if (unit.elite) {
          const pulse = .55 + Math.sin(performance.now() / 170 + unit.id) * .25;
          ctx.save();
          ctx.globalAlpha = pulse;
          ctx.strokeStyle = "#fff0a6";
          ctx.lineWidth = 3;
          ctx.shadowColor = elements[unit.secondaryElement].color;
          ctx.shadowBlur = 14;
          ctx.strokeRect(s.x - 28, s.y - 36, 56, 57);
          ctx.strokeStyle = elements[unit.secondaryElement].color;
          ctx.lineWidth = 1;
          ctx.strokeRect(s.x - 31, s.y - 39, 62, 63);
          ctx.restore();
        }
        ctx.save();
        if (unit.elite) {
          ctx.shadowColor = "#ffd166";
          ctx.shadowBlur = 10;
        }
        drawUnitSprite(ctx, def, s.x, s.y - 8, 3.15, performance.now() / 200);
        ctx.restore();
        ctx.fillStyle = elements[def.element].color;
        ctx.fillRect(s.x - 18, s.y + 19, 36, 3);
        ctx.fillStyle = "#fff1ba";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`T${def.tier}`, s.x, s.y + 32);
      } else {
        ctx.fillStyle = hover && state.selectedUnitId ? "#ffd166" : "#656987";
        ctx.font = "bold 18px monospace";
        ctx.textAlign = "center";
        ctx.fillText("+", s.x, s.y + 6);
      }
    }
  }

  function drawUnitSprite(c, def, x, y, scale, frame) {
    const pal = elements[def.element];
    const bob = Math.round(Math.sin(frame + x) * 1);
    c.save();
    c.translate(Math.round(x), Math.round(y + bob));
    c.scale(scale, scale);
    c.fillStyle = "rgba(0,0,0,.35)";
    c.fillRect(-7, 6, 14, 3);
    c.fillStyle = pal.dark;
    c.fillRect(-6, -2, 12, 9);
    c.fillStyle = pal.color;
    c.fillRect(-5, -5, 10, 9);
    c.fillStyle = "#fff1d0";
    c.fillRect(-3, -4, 6, 5);
    c.fillStyle = "#171525";
    c.fillRect(-2, -2, 1, 1);
    c.fillRect(2, -2, 1, 1);

    if (def.shape === "mage" || def.shape === "queen") {
      c.fillStyle = pal.dark;
      c.fillRect(-7, -7, 14, 3);
      c.fillRect(-5, -11, 10, 5);
      c.fillStyle = pal.color;
      c.fillRect(1, -13, 3, 4);
      c.fillRect(6, 0, 2, 8);
      c.fillStyle = pal.projectile;
      c.fillRect(5, -2, 4, 4);
    } else if (def.shape === "archer") {
      c.strokeStyle = pal.projectile;
      c.lineWidth = 1;
      c.beginPath(); c.arc(7, 0, 5, -Math.PI / 2, Math.PI / 2); c.stroke();
      c.fillStyle = pal.color;
      c.fillRect(-5, -8, 3, 4);
    } else if (def.shape === "cannon") {
      c.fillStyle = "#77788a";
      c.fillRect(3, -5, 8, 5);
      c.fillStyle = pal.projectile;
      c.fillRect(9, -4, 4, 3);
      c.fillStyle = pal.dark;
      c.fillRect(-7, 4, 4, 4); c.fillRect(3, 4, 4, 4);
    } else if (def.shape === "priest") {
      c.fillStyle = pal.projectile;
      c.fillRect(-1, -13, 2, 6);
      c.fillRect(-4, -10, 8, 2);
      c.fillRect(7, -2, 2, 10);
    } else if (def.shape === "golem") {
      c.fillStyle = pal.dark;
      c.fillRect(-10, -3, 5, 9); c.fillRect(5, -3, 5, 9);
      c.fillStyle = pal.projectile;
      c.fillRect(-2, 0, 4, 3);
    } else if (def.shape === "dragon") {
      c.fillStyle = pal.dark;
      c.fillRect(-11, -5, 6, 7); c.fillRect(5, -5, 6, 7);
      c.fillStyle = pal.color;
      c.fillRect(-4, -12, 3, 5); c.fillRect(2, -12, 3, 5);
      c.fillStyle = pal.projectile;
      c.fillRect(7, 0, 5, 2);
    } else if (def.shape === "knight") {
      c.fillStyle = "#c5b9ff";
      c.fillRect(-6, -8, 12, 4);
      c.fillStyle = pal.projectile;
      c.fillRect(8, -7, 2, 13);
      c.fillRect(6, -7, 6, 2);
    } else if (def.shape === "bolt") {
      c.fillStyle = pal.projectile;
      c.fillRect(-2, -12, 4, 5);
      c.fillRect(1, -10, 4, 3);
      c.fillRect(-7, 0, 3, 3); c.fillRect(5, -2, 3, 3);
    } else if (def.shape === "orb") {
      c.fillStyle = pal.projectile;
      c.fillRect(-3, -13, 6, 6);
      c.fillStyle = "#ffffff";
      c.fillRect(-1, -11, 2, 2);
    }
    c.restore();
  }

  function drawEnemies() {
    for (const e of state.enemies) {
      const p = pathPosition(e.progress);
      const size = e.boss ? 18 : e.fragment ? 7 : e.elite ? 13 : e.type === "brute" ? 12 : 10;
      const elementColor = elements[e.element]?.color || "#858ca7";
      const elementDark = elements[e.element]?.dark || "#565b76";
      ctx.save();
      if (e.type === "phase") ctx.globalAlpha = .72 + Math.sin(performance.now() / 90 + e.id) * .2;
      ctx.translate(Math.round(p.x), Math.round(p.y));
      if (p.dir === 1) ctx.rotate(Math.PI / 2);
      if (p.dir === 2) ctx.rotate(Math.PI);
      if (p.dir === 3) ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = "rgba(0,0,0,.45)";
      ctx.fillRect(-size, size - 1, size * 2, 5);
      ctx.fillStyle = e.flash > 0 ? "#fff7dc" : e.boss ? "#9b334d" : e.elite ? "#9259c7" : elementDark;
      ctx.fillRect(-size, -size, size * 2, size * 2);
      ctx.fillStyle = e.boss ? "#ff647c" : e.elite ? "#d7a0ff" : elementColor;
      ctx.fillRect(-size + 3, -size + 3, size * 2 - 6, size - 1);
      ctx.fillStyle = "#121522";
      ctx.fillRect(size - 2, -3, 7, 6);
      ctx.fillStyle = "#ffdf78";
      ctx.fillRect(size + 2, -2, 2, 2);
      if (e.boss) {
        ctx.fillStyle = "#ffd166";
        ctx.fillRect(-size + 2, -size - 5, 5, 5);
        ctx.fillRect(size - 7, -size - 5, 5, 5);
      }
      if (e.type === "runner") {
        ctx.fillStyle = "#fff4ad";
        ctx.fillRect(-size - 4, -4, 4, 2);
        ctx.fillRect(-size - 6, 3, 6, 2);
      } else if (e.type === "brute") {
        ctx.fillStyle = "#f0c990";
        ctx.fillRect(-size - 3, -size + 2, 5, 8);
        ctx.fillRect(size - 2, -size + 2, 5, 8);
      } else if (e.type === "regenerator") {
        ctx.fillStyle = "#d8ffb6";
        ctx.fillRect(-2, -size - 5, 4, 9);
        ctx.fillRect(-5, -size - 2, 10, 3);
      } else if (e.type === "splitter") {
        ctx.fillStyle = "#fff0bb";
        ctx.fillRect(-5, -3, 3, 3);
        ctx.fillRect(3, 2, 3, 3);
      }
      ctx.restore();
      const barW = e.boss ? 56 : 30;
      ctx.fillStyle = "#0b0d18";
      ctx.fillRect(p.x - barW / 2, p.y - size - 11, barW, 5);
      ctx.fillStyle = e.boss ? "#ff647c" : "#67e89a";
      ctx.fillRect(p.x - barW / 2 + 1, p.y - size - 10, (barW - 2) * Math.max(0, e.hp / e.maxHp), 3);
      if (e.maxShield > 0 && e.shield > 0) {
        ctx.fillStyle = "#111a29";
        ctx.fillRect(p.x - barW / 2, p.y - size - 16, barW, 4);
        ctx.fillStyle = "#68cfff";
        ctx.fillRect(p.x - barW / 2 + 1, p.y - size - 15, (barW - 2) * (e.shield / e.maxShield), 2);
      }
      if (e.slow > 0) {
        ctx.fillStyle = "#78e9ff";
        ctx.fillRect(p.x - 4, p.y + size + 12, 8, 2);
      }
      if (e.runes?.length) {
        const totalWidth = e.runes.length * 7 - 2;
        for (let i = 0; i < e.runes.length; i++) {
          const rune = e.runes[i];
          ctx.fillStyle = "#101220";
          ctx.fillRect(p.x - totalWidth / 2 + i * 7 - 1, p.y + size + 3, 7, 7);
          ctx.fillStyle = elements[rune.element]?.color || "#ffffff";
          ctx.fillRect(p.x - totalWidth / 2 + i * 7, p.y + size + 4, 5, 5);
        }
      }
      if (e.sequenceFlash > 0) {
        ctx.globalAlpha = Math.min(1, e.sequenceFlash * 3);
        ctx.strokeStyle = "#fff0a6";
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x - size - 4, p.y - size - 4, size * 2 + 8, size * 2 + 8);
        ctx.globalAlpha = 1;
      }
    }
  }

  function drawProjectiles() {
    for (const p of state.projectiles) {
      for (const t of p.trail) {
        ctx.globalAlpha = Math.max(0, t.life / .18) * .5;
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(t.x) - 2, Math.round(t.y) - 2, 4, 4);
      }
      ctx.globalAlpha = 1;
      const x = Math.round(p.x);
      const y = Math.round(p.y);
      ctx.save();
      ctx.translate(x, y);
      if (p.effect === "beam") {
        ctx.fillStyle = p.color;
        ctx.fillRect(-10, -2, 20, 4);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-7, -1, 14, 2);
      } else if (["crit", "execute", "pierce"].includes(p.effect)) {
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-4, -4, 8, 8);
        ctx.fillStyle = p.color;
        ctx.fillRect(-3, -3, 6, 6);
      } else if (["splash", "nova"].includes(p.effect)) {
        ctx.fillStyle = p.color;
        ctx.fillRect(-6, -6, 12, 12);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-3, -3, 6, 6);
        ctx.strokeStyle = p.color;
        ctx.strokeRect(-9, -9, 18, 18);
      } else if (["slow", "freeze"].includes(p.effect)) {
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = p.color;
        ctx.fillRect(-5, -2, 10, 4);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-2, -5, 4, 10);
      } else if (p.effect === "chain") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-2, -7, 4, 5);
        ctx.fillStyle = p.color;
        ctx.fillRect(0, -3, 5, 4);
        ctx.fillRect(-4, 1, 5, 4);
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-3, -3, 6, 6);
        ctx.fillStyle = p.color;
        ctx.fillRect(-5, -1, 10, 2);
        ctx.fillRect(-1, -5, 2, 10);
      }
      if (p.secondaryColor) {
        ctx.globalAlpha = .85;
        ctx.strokeStyle = p.secondaryColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(-8, -8, 16, 16);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }
  }

  function drawParticles() {
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      const progress = 1 - p.life / p.maxLife;
      if (p.kind === "ring") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.style === "jagged" ? 4 : 3;
        const radius = p.radius * progress;
        if (p.style === "square") {
          ctx.strokeRect(p.x - radius, p.y - radius, radius * 2, radius * 2);
        } else if (p.style === "diamond") {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.PI / 4);
          ctx.strokeRect(-radius * .7, -radius * .7, radius * 1.4, radius * 1.4);
          ctx.restore();
        } else if (p.style === "jagged") {
          ctx.beginPath();
          const points = 16;
          for (let i = 0; i <= points; i++) {
            const angle = i / points * TAU;
            const jag = i % 2 ? .82 : 1;
            const px = p.x + Math.cos(angle) * radius * jag;
            const py = p.y + Math.sin(angle) * radius * jag;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, TAU);
          ctx.stroke();
        }
      } else if (p.kind === "spark") {
        ctx.save();
        ctx.translate(Math.round(p.x), Math.round(p.y));
        ctx.rotate(p.angle || 0);
        ctx.fillRect(-5, -1, 10, 2);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-1, -3, 2, 6);
        ctx.restore();
      } else if (p.kind === "shard") {
        ctx.save();
        ctx.translate(Math.round(p.x), Math.round(p.y));
        ctx.rotate(p.angle || 0);
        ctx.fillRect(-2, -5, 4, 10);
        ctx.restore();
      } else if (p.kind === "slash") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle || 0);
        ctx.fillRect(-p.length * .5, -2, p.length, 4);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-p.length * .3, -1, p.length * .6, 2);
        ctx.restore();
      } else {
        ctx.fillRect(Math.round(p.x) - 2, Math.round(p.y) - 2, 4, 4);
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawDamageTexts() {
    ctx.textAlign = "center";
    ctx.font = "bold 11px monospace";
    for (const d of state.damageTexts) {
      ctx.globalAlpha = Math.max(0, d.life / d.maxLife);
      ctx.fillStyle = "#10111e";
      ctx.fillText(d.text, d.x + 1, d.y + 1);
      ctx.fillStyle = d.color;
      ctx.fillText(d.text, d.x, d.y);
    }
    ctx.globalAlpha = 1;
  }

  function loop(now) {
    const dt = Math.min(.05, (now - state.lastTime) / 1000);
    state.lastTime = now;
    update(dt);
    draw();
    if (Math.floor(now / 200) !== Math.floor((now - dt * 1000) / 200)) {
      ui.enemyCount.textContent = state.enemies.length + state.waveSpawnsLeft;
      ui.gold.textContent = Math.floor(state.gold);
      ui.lives.textContent = state.lives;
      ui.kills.textContent = state.kills;
      ui.summonBtn.disabled = state.units.length >= MAX_UNITS || state.gold < summonCost() || state.gameOver;
      ui.guidedSummonBtn.disabled =
        state.units.length >= MAX_UNITS ||
        state.gold < guidedSummonCost() ||
        state.gameOver;
      ui.overchargeBtn.disabled =
        state.running ||
        state.overchargePrepared ||
        state.overchargeActive ||
        state.gold < overchargeCost() ||
        state.gameOver ||
        state.round >= TOTAL_ROUNDS;
    }
    requestAnimationFrame(loop);
  }

  ui.summonBtn.addEventListener("click", summon);
  ui.guidedSummonBtn.addEventListener("click", guidedSummon);
  ui.overchargeBtn.addEventListener("click", prepareOvercharge);
  ui.sellBtn.addEventListener("click", sellSelectedUnit);
  ui.autoSameBtn.addEventListener("click", () => autoMerge("same"));
  ui.autoRandomBtn.addEventListener("click", () => autoMerge("random"));
  ui.mergeBtn.addEventListener("click", mergeUnits);
  ui.reforgeBtn.addEventListener("click", reforgeBaseUnits);
  ui.clearMergeBtn.addEventListener("click", clearMerge);
  ui.startBtn.addEventListener("click", startWave);
  $("restartBtn").addEventListener("click", () => location.reload());
  $("closeEasterEggBtn").addEventListener("click", () => ui.easterEggModal.classList.add("hidden"));
  $("pauseBtn").addEventListener("click", () => {
    state.paused = !state.paused;
    $("pauseBtn").textContent = state.paused ? "▶" : "Ⅱ";
    toast(state.paused ? "전투 일시 정지" : "전투 재개");
  });
  document.querySelectorAll(".speed-button").forEach(button => {
    button.addEventListener("click", () => {
      state.speed = Number(button.dataset.speed);
      document.querySelectorAll(".speed-button").forEach(b => b.classList.toggle("active", b === button));
    });
  });
  document.querySelectorAll(".element-targets button").forEach(button => {
    button.addEventListener("click", () => {
      state.targetElement = button.dataset.element;
      tone(380 + Object.keys(elements).indexOf(state.targetElement) * 45, .045, "sine", .015);
      renderCompass();
    });
  });
  document.querySelectorAll(".merge-slot").forEach((slot, i) => {
    slot.addEventListener("click", () => {
      if (state.mergeSlots[i] !== null) {
        state.mergeSlots[i] = null;
        updateAllUI();
      } else if (state.selectedUnitId) {
        const otherIndex = state.mergeSlots.indexOf(state.selectedUnitId);
        if (otherIndex >= 0) state.mergeSlots[otherIndex] = null;
        state.mergeSlots[i] = state.selectedUnitId;
        state.selectedUnitId = null;
        updateAllUI();
      }
    });
  });
  $("tierTabs").querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      state.activeCodexTier = Number(button.dataset.tier);
      $("tierTabs").querySelectorAll("button").forEach(b => b.classList.toggle("active", b === button));
      renderCodex();
    });
  });
  canvas.addEventListener("mousemove", handleCanvasMove);
  canvas.addEventListener("mouseleave", () => state.hoverSlot = -1);
  canvas.addEventListener("click", handleCanvasClick);
  window.addEventListener("scroll", hideRecipeTooltip, true);
  window.addEventListener("resize", hideRecipeTooltip);

  document.querySelectorAll(".difficulty-option").forEach(button => {
    button.addEventListener("click", () => {
      state.difficulty = button.dataset.difficulty;
      document.querySelectorAll(".difficulty-option").forEach(option => option.classList.toggle("selected", option === button));
      $("confirmDifficultyBtn").textContent = `${difficulties[state.difficulty].name} 난이도로 원정 시작`;
      tone(420, .05);
    });
  });
  $("confirmDifficultyBtn").addEventListener("click", beginExpedition);

  addLog("<b>작전:</b> 수호자를 소환하고 중앙 칸에 배치하세요.");
  addLog("<b>조합:</b> 도감에 43개 조합식이 처음부터 모두 공개됩니다.");
  updateAllUI();
  requestAnimationFrame(loop);
})();
