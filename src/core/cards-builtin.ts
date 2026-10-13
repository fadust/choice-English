/**
 * 内置固定卡库（仿 API_PRESETS 先例）：一批覆盖 4 类型 × 5 星级 × 6 效果的卡。
 * 内置卡全球通用、可反复掉落（不可编辑，只可收集/装备）。id 稳定
 * （`builtin_<type>_<star>`），供商店定向货架与角色主题池混合抽卡引用。
 * 每张卡的效果与触发条件保持「同型自洽」：武器=骰值/重掷（触发 roll/outcome）、
 * 法术=需求/结局转化（触发 grade/demand/outcome）、祝福=彩蛋/叙事（触发
 * grade/outcome）、试炼=综合强卡（触发 grade/roll）。数值均已在约束硬限内
 * （见 cards-constraints.ts），入库时 validateCard 恒为合法。
 */

import type { Card, CardEffect, CardStar, CardType } from '@/type/settings';

type BuiltinSpec = {
  type: CardType;
  star: CardStar;
  name: string;
  /** trigger 字段（kind 语义见 CardTrigger 注释） */
  trigger: Card['trigger'];
  effects: CardEffect[];
  narrative?: string;
};

const builtin = (spec: BuiltinSpec): Card => ({
  id: `builtin_${spec.type}_${spec.star}`,
  name: spec.name,
  type: spec.type,
  star: spec.star,
  trigger: spec.trigger,
  effects: spec.effects,
  narrative: spec.narrative ?? '',
  source: 'builtin',
  character_id: '', // 内置卡无角色归属
  character_name: '',
});

const R = (kind: Card['trigger']['kind'], value: Partial<Card['trigger']> = {}): Card['trigger'] => ({
  kind,
  typeValue: '',
  grade: null,
  min: 0,
  max: 0,
  outcome: null,
  ...value,
});

/** 内置卡库（只读常量）。导出为只读数组，UI 不可编辑。 */
export const BUILTIN_CARDS: readonly Card[] = [
  // ── 武器（骰值/重掷） ──────────────────────────────────────────────
  builtin({
    type: 'weapon',
    star: '1',
    name: 'Rough Bracers',
    trigger: R('roll', { min: 1, max: 60 }),
    effects: [{ kind: 'roll_bonus', amount: 5 }],
    narrative: 'The wrist was tightened, and the blessing of the rough wrist guard gave this shot a little more weight.',
  }),
  builtin({
    type: 'weapon',
    star: '2',
    name: 'Unbalanced weight',
    trigger: R('roll', { min: 1, max: 80 }),
    effects: [{ kind: 'roll_bonus', amount: 11 }],
    narrative: 'The weight tilted to one side, leveraging the previously unresolved force.',
  }),
  builtin({
    type: 'weapon',
    star: '3',
    name: 'wheel of fortune',
    trigger: R('outcome', { outcome: 'fail' }),
    effects: [{ kind: 'reroll', on: 'fail' }],
    narrative: 'The wheel of fortune clicks one square, giving you a chance to do it again.',
  }),
  builtin({
    type: 'weapon',
    star: '4',
    name: 'Libra Verdict',
    trigger: R('roll', { min: 20, max: 100 }),
    effects: [
      { kind: 'roll_bonus', amount: 16 },
      // on='fail' 而非 'crit_fail'：默认阈值下 high 模式 crit_fail 实际不可达——roll 触发窗
      // （≥20/40）不含大失败区（≤critF≤10），且正 roll_bonus 使终骰 ≥21 恒在大失败阈之上。
      // 注意 critF 是用户可调字段（上限 99）：调高使大失败区与触发窗重叠时 'crit_fail'
      // 只是默认配置下不可达、并非结构性死火——fail ⊇ crit_fail，两种配置下触发面都更稳。
      // fail 侧四种卡均可触发（重掷每判定至多一次，星标预算限持有量，不至失控）
      { kind: 'reroll', on: 'fail' },
    ],
    narrative: 'The pointer of the scale stopped steadily on the side of victory, and the sword edge fell unstoppably.',
  }),

  // ── 法术（需求/结局转化） ──────────────────────────────────────────
  builtin({
    type: 'spell',
    star: '1',
    name: 'uplift',
    trigger: R('grade', { grade: 'balanced' }),
    effects: [{ kind: 'demand_mod', amount: -8 }],
    narrative: 'An invigorating technique was injected into the heart, and the original difficulty was quietly smoothed away.',
  }),
  builtin({
    type: 'spell',
    star: '2',
    name: 'Barrier breaking spell',
    trigger: R('demand', { min: 50, max: 90 }),
    effects: [{ kind: 'demand_mod', amount: -20 }],
    narrative: 'The barrier-breaking spell tore through that unreachable barrier.',
  }),
  builtin({
    type: 'spell',
    star: '3',
    name: 'reversal ritual',
    trigger: R('outcome', { outcome: 'fail' }),
    effects: [{ kind: 'outcome_convert', from: 'fail', to: 'success' }],
    narrative: 'The reversal ritual reverses cause and effect at the last moment, and failure is rewritten into success.',
  }),
  builtin({
    type: 'spell',
    star: '4',
    name: 'miraculous intervention',
    trigger: R('outcome', { outcome: 'fail' }),
    effects: [{ kind: 'outcome_convert', from: 'fail', to: 'crit_success' }],
    narrative: 'A miracle came - this strike transcended ordinary success and failure and turned into an incredible victory.',
  }),

  // ── 祝福（彩蛋/叙事） ──────────────────────────────────────────────
  builtin({
    type: 'blessing',
    star: '1',
    name: 'shimmer shelter',
    trigger: R('grade', { grade: 'balanced' }),
    effects: [{ kind: 'crit_window', success_delta: 1, fail_delta: 1 }],
    narrative: 'The glimmer of light surrounds you, and even luck quietly favors you.',
  }),
  builtin({
    type: 'blessing',
    star: '2',
    name: 'Holy Ember',
    trigger: R('grade', { grade: 'bold' }),
    effects: [{ kind: 'crit_window', success_delta: 2, fail_delta: 2 }],
    narrative: 'The embers of the Holy Glory bloomed in the palm of the hand, and the edge of the miracle was pushed away an inch.',
  }),
  builtin({
    type: 'blessing',
    star: '3',
    name: 'Oracle whispers',
    trigger: R('outcome', { outcome: 'success' }),
    effects: [{ kind: 'narrative', text: 'The whisper of the oracle echoed in my ears, and there was a deeper meaning besides success.' }],
    narrative: 'The oracle whispers linger, and this success has hidden repercussions.',
  }),
  builtin({
    type: 'blessing',
    star: '4',
    name: 'Crowned by destiny',
    trigger: R('grade', { grade: 'bold' }),
    effects: [
      { kind: 'crit_window', success_delta: 3, fail_delta: 3 },
      { kind: 'narrative', text: 'The crown of destiny has fallen, and destiny has completely turned to you.' },
    ],
    narrative: 'The crown of destiny is placed on your head, and the next direction is written by you.',
  }),

  // ── 试炼（综合强卡） ────────────────────────────────────────────────
  builtin({
    type: 'trial',
    star: '1',
    name: 'Burn the cauldron',
    trigger: R('grade', { grade: 'bold' }),
    effects: [
      { kind: 'roll_bonus', amount: 7 },
      { kind: 'demand_mod', amount: -8 },
    ],
    narrative: 'The escape route was cut off, and the devastating blow was delivered with reckless ferocity.',
  }),
  builtin({
    type: 'trial',
    star: '2',
    name: 'Abyss Staring',
    trigger: R('roll', { min: 1, max: 99 }),
    effects: [{ kind: 'reroll', on: 'crit_fail' }],
    narrative: 'The price of staring into the abyss has long been paid, and the disaster has been abruptly pulled back on track.',
  }),
  builtin({
    type: 'trial',
    star: '3',
    name: 'sands of time',
    trigger: R('outcome', { outcome: 'fail' }),
    effects: [
      { kind: 'outcome_convert', from: 'fail', to: 'success' },
      { kind: 'narrative', text: 'The sands of time turn back, and the dust of failure is reshaped into victory.' },
    ],
    narrative: 'The sands of time flowed backward between the fingers, and the ending was rewritten in an instant.',
  }),
  builtin({
    type: 'trial',
    star: '4',
    name: 'The final balance',
    trigger: R('grade', { grade: 'bold' }),
    effects: [
      { kind: 'roll_bonus', amount: 20 },
      { kind: 'crit_window', success_delta: 3, fail_delta: 3 },
      // on='fail'：crit_fail 在 high 模式被本卡 roll_bonus 结构性堵死（见天秤裁决注释）
      { kind: 'reroll', on: 'fail' },
    ],
    narrative: 'The final balance suddenly settled, and the efforts of mortals were pushed to the limit.',
  }),

  // ── 5 星（各类型顶配，越界即被硬限钳制，效果贴近上限但保留取舍） ──────
  builtin({
    type: 'weapon',
    star: '5',
    name: 'adjudicating royal power',
    trigger: R('roll', { min: 40, max: 100 }),
    effects: [
      { kind: 'roll_bonus', amount: 25 },
      // on='fail'：crit_fail 在 high 模式被触发窗+roll_bonus 双重堵死（见天秤裁决注释）
      { kind: 'reroll', on: 'fail' },
    ],
    narrative: 'The blade of royal power fell, and the victory was irreversible.',
  }),
  builtin({
    type: 'spell',
    star: '5',
    name: 'Return of everything',
    trigger: R('outcome', { outcome: 'crit_fail' }),
    effects: [{ kind: 'outcome_convert', from: 'crit_fail', to: 'crit_success' }],
    narrative: 'Everything returned to one yuan, and the defeat was rewritten into a miracle in an instant.',
  }),
  builtin({
    type: 'blessing',
    star: '5',
    name: 'Eternal Symbol',
    trigger: R('grade', { grade: 'bold' }),
    effects: [
      { kind: 'crit_window', success_delta: 4, fail_delta: 4 },
      { kind: 'narrative', text: 'The Holy Emblem always hangs above your head, and the power of destiny is in your hands.' },
    ],
    narrative: 'The glory of the eternal holy symbol is immortal, and the boundaries between miracles and disasters are determined by you.',
  }),
  builtin({
    type: 'trial',
    star: '5',
    name: 'final verdict',
    trigger: R('grade', { grade: 'bold' }),
    effects: [
      { kind: 'roll_bonus', amount: 28 },
      { kind: 'crit_window', success_delta: 3, fail_delta: 3 },
      // on='fail'：crit_fail 在 high 模式被本卡 roll_bonus 结构性堵死（见天秤裁决注释）
      { kind: 'reroll', on: 'fail' },
    ],
    narrative: 'The final decision has been made, and the limits of everything are under your control.',
  }),
];
