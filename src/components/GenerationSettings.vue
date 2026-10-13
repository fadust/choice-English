<template>
  <div class="choice-generation-editor">
    <!-- 基础行为：自动生成 + 输入润色。恒定展开的固定分组卡片 -->
    <div class="choice-section">
      <h4 class="choice-section-title">{{ t`Basic behavior` }}</h4>
      <label class="choice-toggle" data-tour="gen-auto">
        <input v-model="gs.settings.auto_generate" type="checkbox" :title="t`Auto-generate options after each AI reply`" />
        <span class="choice-toggle-custom"></span>
        <span class="choice-toggle-label">
          <strong>{{ t`Auto Generate` }}</strong>
          <small>{{ t`Auto-trigger options generation when the AI reply completes` }}</small>
        </span>
      </label>
      <!-- 输入润色开关从外观页迁入：它控制的是"生成"行为（润色版本数/字数/人称
           本就集中在本页），与外观无关；ui 在下方 script 已定义，与 enrich_count 同款写法 -->
      <label class="choice-toggle">
        <input v-model="ui.enrich_enabled" type="checkbox" :title="t`AI rewrites your message into multiple polished versions before sending`" />
        <span class="choice-toggle-custom"></span>
        <span class="choice-toggle-label">
          <strong>{{ t`Enable Input Enrich` }}</strong>
          <small>{{ t`Rewrite messages into multiple polished versions using AI before sending` }}</small>
        </span>
      </label>
    </div>

    <!-- 点击行为 -->
    <ChoiceSectionCard title="click behavior" icon="fa-solid fa-mouse-pointer" data-tour="gen-behavior">
      <small class="choice-field-hint">{{ t`Action when an option is clicked, synced with the panel header` }}</small>
      <div class="choice-seg">
        <button
          class="choice-seg-btn"
          :class="{ active: gs.settings.behavior === 'send' }"
          :title="t`Send the message directly after clicking an option`"
          @click="gs.settings.behavior = 'send'"
        >
          <i class="fa-solid fa-paper-plane"></i>
          {{ t`Send` }}
        </button>
        <button
          class="choice-seg-btn"
          :class="{ active: gs.settings.behavior === 'fill' }"
          :title="t`Fill input box after clicking an option (replaces existing content)`"
          @click="gs.settings.behavior = 'fill'"
        >
          <i class="fa-solid fa-file-pen"></i>
          {{ t`Overwrite` }}
        </button>
        <button
          class="choice-seg-btn"
          :class="{ active: gs.settings.behavior === 'append' }"
          :title="t`Append to input box after clicking an option`"
          @click="gs.settings.behavior = 'append'"
        >
          <i class="fa-solid fa-plus"></i>
          {{ t`Append` }}
        </button>
        <button
          class="choice-seg-btn"
          :class="{ active: gs.settings.behavior === 'insert' }"
          :title="t`Insert at the input box cursor after clicking an option`"
          @click="gs.settings.behavior = 'insert'"
        >
          <i class="fa-solid fa-i-cursor"></i>
          {{ t`Insert` }}
        </button>
      </div>
    </ChoiceSectionCard>

    <!-- 生成数量 -->
    <ChoiceSectionCard title="Generate quantity" icon="fa-solid fa-hashtag" data-tour="gen-count">
      <small class="choice-field-hint">{{ t`Number = fixed count; range = random each time (e.g. 3-6)` }}</small>
      <div class="choice-count-row">
        <label class="choice-count-item">
          <span>{{ t`Options Count` }}</span>
          <input
            v-model="gs.settings.global_count_mode"
            class="choice-input choice-input-w-md"
            :placeholder="t`e.g. 4 or 3-6`"
          />
        </label>
        <label class="choice-count-item">
          <span>{{ t`Enrich versions` }}</span>
          <input v-model="ui.enrich_count" class="choice-input choice-input-w-md" :placeholder="t`e.g. 4 or 3-6`" />
        </label>
      </div>
    </ChoiceSectionCard>

    <!-- 骰子判定（v56 难度制）：需求值标注/档位兜底 + D100 随机判定。开关默认关，
         关闭时选项行为与旧版完全一致；需求值徽标与判定 chip 均随本开关显隐。
         分组收纳：总开关常显在标题行右侧（extra slot），阈值/模板/长说明收起为展开区 -->
    <ChoiceSectionCard title="Dice decision" data-tour="gen-dice" icon="fa-solid fa-dice">
      <template #extra>
        <label class="choice-check" :title="t`Shows a DC badge on each option row; clicking rolls the dice and shows the result inline`">
          <input v-model="gs.settings.dice.enabled" type="checkbox" />
          <span>{{ t`Enable dice checks` }}</span>
        </label>
      </template>
      <!-- v61 DND / COC 判定模式：分段切换。dice.low_roll=false=DND(高点数成功)，true=COC(低点数成功) -->
      <div class="choice-seg" data-tour="gen-dice-mode">
        <button
          class="choice-seg-btn"
          :class="{ active: !gs.settings.dice.low_roll }"
          :title="t`Higher is better: roll ≥ DC succeeds (default)`"
          @click="gs.settings.dice.low_roll = false"
        >
          <i class="fa-solid fa-dice-d20"></i>
          {{ t`DND` }}
        </button>
        <button
          class="choice-seg-btn"
          :class="{ active: gs.settings.dice.low_roll }"
          :title="t`Lower is better: roll ≤ DC succeeds (COC percentile)`"
          @click="gs.settings.dice.low_roll = true"
        >
          <i class="fa-solid fa-dice"></i>
          {{ t`COC` }}
        </button>
      </div>
      <small class="choice-field-hint">{{
        gs.settings.dice.low_roll
          ? t`COC: roll ≤ DC succeeds and lower is better (crit success = lowest roll, crit failure = highest). DC is annotated as an "ability value": the more confident, the higher; without an annotation the grade fallback is Conservative 65 / Balanced 40 / Bold 15`
          : t`DND: roll ≥ DC succeeds and higher is better (crit success = highest roll, crit failure = lowest). Without an annotation the grade fallback is Conservative 35 / Balanced 60 / Bold 85`
      }}</small>
      <!-- 彩蛋阈值：随判定模式切换字段组（DND 用高值大成功/低值大失败，COC 反之） -->
      <div class="choice-count-row">
        <label v-if="!gs.settings.dice.low_roll" class="choice-count-item">
          <span>{{ t`Crit success threshold` }}</span>
          <input
            v-model.number="gs.settings.dice.crit_success_min"
            class="choice-input choice-input-w-md"
            type="number"
            min="2"
            max="100"
            :title="t`DND: roll ≥ this is a critical success (default 96)`"
            @change="gs.settings.dice.crit_success_min = clampDiceThreshold($event, 2, 100)"
          />
        </label>
        <label v-if="!gs.settings.dice.low_roll" class="choice-count-item">
          <span>{{ t`Crit fail threshold` }}</span>
          <input
            v-model.number="gs.settings.dice.crit_fail_max"
            class="choice-input choice-input-w-md"
            type="number"
            min="1"
            max="99"
            :title="t`DND: roll ≤ this is a critical failure (default 5)`"
            @change="gs.settings.dice.crit_fail_max = clampDiceThreshold($event, 1, 99)"
          />
        </label>
        <label v-if="gs.settings.dice.low_roll" class="choice-count-item">
          <span>{{ t`Crit success threshold` }}</span>
          <input
            v-model.number="gs.settings.dice.low_roll_crit_success_max"
            class="choice-input choice-input-w-md"
            type="number"
            min="1"
            max="99"
            :title="t`COC: roll ≤ this is a critical success (default 5)`"
            @change="gs.settings.dice.low_roll_crit_success_max = clampDiceThreshold($event, 1, 99)"
          />
        </label>
        <label v-if="gs.settings.dice.low_roll" class="choice-count-item">
          <span>{{ t`Crit fail threshold` }}</span>
          <input
            v-model.number="gs.settings.dice.low_roll_crit_fail_min"
            class="choice-input choice-input-w-md"
            type="number"
            min="2"
            max="100"
            :title="t`COC: roll ≥ this is a critical failure (default 96)`"
            @change="gs.settings.dice.low_roll_crit_fail_min = clampDiceThreshold($event, 2, 100)"
          />
        </label>
      </div>
      <!-- 彩蛋失效警示：两阈值 clamp 后重叠时 judgeOutcome 会双双关彩蛋，提前说明防困惑 -->
      <small v-if="critOverlapWarning" class="choice-field-hint choice-dice-crit-warn">
        <i class="fa-solid fa-triangle-exclamation"></i>{{ critOverlapWarning }}
      </small>
      <!-- 附加玩法：卡片式开关行（标题 + 一行说明，替代无说明裸复选框） -->
      <div class="choice-dice-toggle-list">
        <label class="choice-toggle" :title="t`Clicking first rolls the dice and shows ↻; click again after a satisfying reroll to apply/send`">
          <input v-model="gs.settings.dice.reroll_enabled" type="checkbox" />
          <span class="choice-toggle-custom"></span>
          <span class="choice-toggle-label">
            <strong>{{ t`In-place reroll (↻)` }}</strong>
            <small>{{ t`Clicking first rolls the dice and shows ↻; click again after a satisfying reroll to apply/send` }}</small>
          </span>
        </label>
        <label class="choice-toggle" :title="t`Lets the AI annotate real dice expressions (e.g. [title|2d6+3|70]); rolls the expression instead of a fixed D100`">
          <input v-model="gs.settings.dice.allow_formula" type="checkbox" />
          <span class="choice-toggle-custom"></span>
          <span class="choice-toggle-label">
            <strong>{{ t`Dice expression` }}</strong>
            <small>{{
              t`Only works when the AI annotates a real dice expression in the title, format [title|dice|DC] (e.g. [Attack|2d6+3|70]); when on, generation prompts the AI to output dice expressions`
            }}</small>
          </span>
        </label>
        <label
          class="choice-toggle"
          :title="t`When an option has no explicit DC, parse attribute values from the character card as the DC (falls back to grade defaults if unrecognized)`"
        >
          <input v-model="gs.settings.dice.attr_dc_enabled" type="checkbox" />
          <span class="choice-toggle-custom"></span>
          <span class="choice-toggle-label">
            <strong>{{ t`Attribute-driven DC` }}</strong>
            <small>{{ t`When an option has no explicit DC, parse attributes from the character card as the DC` }}</small>
          </span>
        </label>
        <label
          class="choice-toggle"
          :title="t`Persistently injects a system note into main-reply requests explaining the check comment at the start of messages and requiring compliance; off = the comment explains itself`"
        >
          <input v-model="gs.settings.dice.main_ai_awareness" type="checkbox" />
          <span class="choice-toggle-custom"></span>
          <span class="choice-toggle-label">
            <strong>{{ t`Story AI awareness of check comments` }}</strong>
            <small>{{
              t`Persistently injects a system note so the story AI understands and follows the check comment at the start of messages; off = the comment explains itself`
            }}</small>
          </span>
        </label>
      </div>
      <!-- 互斥警示：骰式路径不经过卡牌管线，两开关同开时卡牌静默停摆，提前说明防困惑 -->
      <small
        v-if="gs.settings.dice.allow_formula && gs.settings.card_enabled"
        class="choice-field-hint choice-dice-crit-warn"
      >
        <i class="fa-solid fa-triangle-exclamation"></i
        >{{ t`Card system is on: the dice-expression path bypasses cards, so card triggers, Action Coins and lucky packs will stall; turn off dice expressions if you want card gameplay` }}
      </small>
      <!-- 演绎文案模板：收进可折叠「高级」区，减轻主体卡片负担 -->
      <ChoiceSectionCard title="Deductive copywriting template (advanced)" icon="fa-solid fa-comment">
        <small class="choice-field-hint">{{
          t`Success/failure tiers scale with how much the margin fills the check space (bigger share → higher tier), each tier with its own direction text; crit success/fail use single entries. Text is injected invisibly as an HTML comment with the player message (visible to the AI, hidden in chat and the input box). The plugin auto-prepends a structured summary (outcome/target/roll/DC/margin/degree) and appends a discipline footer — the template only needs the direction itself; {rate} {roll} {margin} {degree} still work. Empty tier falls back to the outcome fallback text; if both are empty nothing is injected`
        }}</small>
        <div class="choice-dice-template-list">
          <div class="choice-dice-template-row">
            <strong>{{ t`Success` }}</strong>
            <label class="choice-count-item">
              <span>{{ t`Barely made it` }}</span>
              <input
                v-model="gs.settings.dice.success_send_low_template"
                class="choice-input"
                :title="t`Don't type -- in the template (it would truncate the HTML comment)`"
                :placeholder="t`Margin within 0–20% of the success space — direction text for the AI`"
              />
            </label>
          </div>
          <div class="choice-dice-template-row">
            <strong>{{ t`Success` }}</strong>
            <label class="choice-count-item">
              <span>{{ t`Narrow win` }}</span>
              <input
                v-model="gs.settings.dice.success_send_mid_low_template"
                class="choice-input"
                :title="t`Don't type -- in the template (it would truncate the HTML comment)`"
                :placeholder="t`Margin within 20–40% of the success space — direction text for the AI`"
              />
            </label>
          </div>
          <div class="choice-dice-template-row">
            <strong>{{ t`Success` }}</strong>
            <label class="choice-count-item">
              <span>{{ t`Smoothly done` }}</span>
              <input
                v-model="gs.settings.dice.success_send_mid_template"
                class="choice-input"
                :title="t`Don't type -- in the template (it would truncate the HTML comment)`"
                :placeholder="t`Margin within 40–60% of the success space — direction text for the AI`"
              />
            </label>
          </div>
          <div class="choice-dice-template-row">
            <strong>{{ t`Success` }}</strong>
            <label class="choice-count-item">
              <span>{{ t`Clean win` }}</span>
              <input
                v-model="gs.settings.dice.success_send_mid_high_template"
                class="choice-input"
                :title="t`Don't type -- in the template (it would truncate the HTML comment)`"
                :placeholder="t`Margin within 60–80% of the success space — direction text for the AI`"
              />
            </label>
          </div>
          <div class="choice-dice-template-row">
            <strong>{{ t`Success` }}</strong>
            <label class="choice-count-item">
              <span>{{ t`Sweeping victory` }}</span>
              <input
                v-model="gs.settings.dice.success_send_high_template"
                class="choice-input"
                :title="t`Don't type -- in the template (it would truncate the HTML comment)`"
                :placeholder="t`Margin beyond 80% of the success space — direction text for the AI`"
              />
            </label>
            <label class="choice-count-item">
              <span>{{ t`Fallback text` }}</span>
              <input
                v-model="gs.settings.dice.success_template"
                class="choice-input"
                :placeholder="t`Used when the direction text is empty, e.g. [Success]`"
              />
            </label>
          </div>
          <div class="choice-dice-template-row">
            <strong>{{ t`Failed` }}</strong>
            <label class="choice-count-item">
              <span>{{ t`Just missed` }}</span>
              <input
                v-model="gs.settings.dice.fail_send_low_template"
                class="choice-input"
                :title="t`Don't type -- in the template (it would truncate the HTML comment)`"
                :placeholder="t`Margin within 0–20% of the failure space — direction text for the AI`"
              />
            </label>
          </div>
          <div class="choice-dice-template-row">
            <strong>{{ t`Failed` }}</strong>
            <label class="choice-count-item">
              <span>{{ t`Fell short at the finish` }}</span>
              <input
                v-model="gs.settings.dice.fail_send_mid_low_template"
                class="choice-input"
                :title="t`Don't type -- in the template (it would truncate the HTML comment)`"
                :placeholder="t`Margin within 20–40% of the failure space — direction text for the AI`"
              />
            </label>
          </div>
          <div class="choice-dice-template-row">
            <strong>{{ t`Failed` }}</strong>
            <label class="choice-count-item">
              <span>{{ t`Backfired` }}</span>
              <input
                v-model="gs.settings.dice.fail_send_mid_template"
                class="choice-input"
                :title="t`Don't type -- in the template (it would truncate the HTML comment)`"
                :placeholder="t`Margin within 40–60% of the failure space — direction text for the AI`"
              />
            </label>
          </div>
          <div class="choice-dice-template-row">
            <strong>{{ t`Failed` }}</strong>
            <label class="choice-count-item">
              <span>{{ t`Rout` }}</span>
              <input
                v-model="gs.settings.dice.fail_send_mid_high_template"
                class="choice-input"
                :title="t`Don't type -- in the template (it would truncate the HTML comment)`"
                :placeholder="t`Margin within 60–80% of the failure space — direction text for the AI`"
              />
            </label>
          </div>
          <div class="choice-dice-template-row">
            <strong>{{ t`Failed` }}</strong>
            <label class="choice-count-item">
              <span>{{ t`Total defeat` }}</span>
              <input
                v-model="gs.settings.dice.fail_send_high_template"
                class="choice-input"
                :title="t`Don't type -- in the template (it would truncate the HTML comment)`"
                :placeholder="t`Margin beyond 80% of the failure space — direction text for the AI`"
              />
            </label>
            <label class="choice-count-item">
              <span>{{ t`Fallback text` }}</span>
              <input
                v-model="gs.settings.dice.fail_template"
                class="choice-input"
                :placeholder="t`Used when the direction text is empty, e.g. [Failure]`"
              />
            </label>
          </div>
          <div class="choice-dice-template-row">
            <strong>{{ t`Critical success` }}</strong>
            <label class="choice-count-item">
              <span>{{ t`Hidden direction text` }}</span>
              <input
                v-model="gs.settings.dice.crit_success_send_template"
                class="choice-input"
                :title="t`Don't type -- in the template (it would truncate the HTML comment)`"
                :placeholder="t`Direction text for the AI; supports {rate} {roll} {margin} {degree}`"
              />
            </label>
            <label class="choice-count-item">
              <span>{{ t`Fallback text` }}</span>
              <input
                v-model="gs.settings.dice.crit_success_template"
                class="choice-input"
                :placeholder="t`Used when the direction text is empty, e.g. [Critical success]`"
              />
            </label>
          </div>
          <div class="choice-dice-template-row">
            <strong>{{ t`Critical failure` }}</strong>
            <label class="choice-count-item">
              <span>{{ t`Hidden direction text` }}</span>
              <input
                v-model="gs.settings.dice.crit_fail_send_template"
                class="choice-input"
                :title="t`Don't type -- in the template (it would truncate the HTML comment)`"
                :placeholder="t`Direction text for the AI; supports {rate} {roll} {margin} {degree}`"
              />
            </label>
            <label class="choice-count-item">
              <span>{{ t`Fallback text` }}</span>
              <input
                v-model="gs.settings.dice.crit_fail_template"
                class="choice-input"
                :placeholder="t`Used when the direction text is empty, e.g. [Critical failure]`"
              />
            </label>
          </div>
        </div>
      </ChoiceSectionCard>
      <small class="choice-field-hint">{{
        t`When on, clicking an option rolls a check: AI-marked DC takes priority, otherwise the risk grade is the fallback (DND: Conservative 35 / Balanced 60 / Bold 85; COC: Conservative 65 / Balanced 40 / Bold 15). Enrichment view and options without a DC don't roll; check direction follows the DND / COC mode above.`
      }}</small>
    </ChoiceSectionCard>

    <!-- 候选冗余 -->
    <ChoiceSectionCard title="candidate redundancy" icon="fa-solid fa-layer-group">
      <small class="choice-field-hint">{{
        t`How much larger the candidate list sent to the AI is than the option count; the AI picks scene-fitting directions from it. 0 = candidate count equals option count`
      }}</small>
      <div class="choice-count-row">
        <label class="choice-count-item">
          <span>{{ t`Redundancy ratio` }}</span>
          <input
            v-model.number="oversamplePct"
            class="choice-input choice-input-w-md"
            type="number"
            min="0"
            max="300"
            :title="t`Percentage, default 50; 0 = candidate count equals option count`"
          />
          <span>%</span>
        </label>
      </div>
    </ChoiceSectionCard>

    <!-- 防重复 -->
    <ChoiceSectionCard title="Anti-duplication" icon="fa-solid fa-clone">
      <template #extra>
        <label class="choice-check" :title="t`Auto-dedup after generation; auto top-up when short`">
          <input v-model="gs.settings.generation.dedup_enabled" type="checkbox" />
          <span>{{ t`Enable` }}</span>
        </label>
      </template>
      <small class="choice-field-hint">{{
        t`Previous-round options are no longer injected into the prompt (anti-contamination); after generation, options duplicating the previous AI message / existing versions of this message are removed — same title needs similar content too, different titles are judged by body similarity (≥ threshold). Auto top-up when short (up to 2 rounds). Threshold 0–1, lower is stricter, 0.75 default.`
      }}</small>
      <div class="choice-count-row">
        <label class="choice-count-item">
          <span>{{ t`Threshold` }}</span>
          <input
            v-model.number="dedupThreshold"
            class="choice-input choice-input-w-md"
            type="number"
            step="0.05"
            :title="t`Bigram Jaccard threshold in 0–1; out-of-range/invalid input is clamped back to 0–1, empty falls back to 0.75`"
          />
        </label>
      </div>
    </ChoiceSectionCard>

    <!-- 每条字数 -->
    <ChoiceSectionCard title="Words per Option" icon="fa-solid fa-text-width">
      <small class="choice-field-hint">{{ t`Word range for each action option or polished version` }}</small>
      <div class="choice-count-row">
        <label class="choice-count-item">
          <span>{{ t`Options` }}</span>
          <input
            v-model.number="rules.option_min_chars"
            class="choice-input choice-input-w-sm"
            type="number"
            min="10"
            max="500"
            @change="clampOptionChars"
          />
          <span>-</span>
          <input
            v-model.number="rules.option_max_chars"
            class="choice-input choice-input-w-sm"
            type="number"
            min="10"
            max="500"
            @change="clampOptionChars"
          />
        </label>
        <label class="choice-count-item">
          <span>{{ t`Enrich` }}</span>
          <input
            v-model.number="rules.enrich_min_chars"
            class="choice-input choice-input-w-sm"
            type="number"
            min="10"
            max="500"
            @change="clampEnrichChars"
          />
          <span>-</span>
          <input
            v-model.number="rules.enrich_max_chars"
            class="choice-input choice-input-w-sm"
            type="number"
            min="10"
            max="500"
            @change="clampEnrichChars"
          />
        </label>
      </div>
    </ChoiceSectionCard>

    <!-- 人称视角 -->
    <ChoiceSectionCard title="personal perspective" icon="fa-solid fa-user">
      <small class="choice-field-hint">{{ t`Person for options and polish output, e.g. "third person" or "first person"` }}</small>
      <div class="choice-count-row">
        <label class="choice-count-item">
          <span>{{ t`Options Person` }}</span>
          <input v-model="rules.option_person" class="choice-input choice-input-w-lg" :placeholder="t`e.g. third person`" />
        </label>
        <label class="choice-count-item">
          <span>{{ t`Polish Person` }}</span>
          <input v-model="rules.enrich_person" class="choice-input choice-input-w-lg" :placeholder="t`e.g. third person`" />
        </label>
      </div>
    </ChoiceSectionCard>
  </div>
</template>

<script setup lang="ts">
import ChoiceSectionCard from '@/components/shared/ChoiceSectionCard.vue';
import { useGlobalSettingsStore } from '@/store/global-settings';
import {
  clampCharsValue,
  OPTION_MIN_CHARS_DEFAULT,
  OPTION_MAX_CHARS_DEFAULT,
  ENRICH_MIN_CHARS_DEFAULT,
  ENRICH_MAX_CHARS_DEFAULT,
} from '@/type/settings';

const gs = useGlobalSettingsStore();
const ui = gs.settings.ui;
const rules = gs.settings.prompt_rules;

// 冗余比例是全局抽取参数（settings.generation，v35 起从 per-pool-config 收归全局）——
// 条目池配置只管条目引用，切换池配置严禁带动任何生成参数。历史耦合：本页曾读生效池配置
// 的 oversample_pct，切池配置冗余比例即跳变（用户实测踩雷）。set 侧 clamp 到 schema 允许
// 区间（0-300）防越界值入库
const oversamplePct = computed({
  get: () => gs.settings.generation.oversample_pct,
  set: v => {
    const n = Math.round(Number(v));
    gs.settings.generation.oversample_pct = Number.isFinite(n) ? Math.min(300, Math.max(0, n)) : 0;
  },
});

// 去重阈值：v-model.number 直绑时清空输入框得 ''（threshold-0.35=-0.35 → titleGate=0 且
// score>=0 恒真）会让去重「全杀」并空转两轮补齐请求——钳到 0-1、非法值兜底 0.75
const dedupThreshold = computed({
  get: () => gs.settings.generation.dedup_threshold,
  set: v => {
    const n = Number(v);
    gs.settings.generation.dedup_threshold = Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.75;
  },
});

// 字数输入失焦钳制：用户键入 <10/>500 或非法值时自动钳到合法边界
// （min 输 1→10、max 输 10000000000→500），并保证 min<=max。
// 用 @change（失焦/回车）而非 @input：实时钳会破坏多位数输入（输 "100" 时 "1" 被钳成 10 跳变）。
// 落盘还有 global-settings watcher 的 sanitizePromptRulesChars 兜底，双保险。
const clampOptionChars = () => {
  const lo = clampCharsValue(rules.option_min_chars, OPTION_MIN_CHARS_DEFAULT);
  const hi = clampCharsValue(rules.option_max_chars, OPTION_MAX_CHARS_DEFAULT);
  rules.option_min_chars = lo;
  rules.option_max_chars = lo > hi ? lo : hi;
};
const clampEnrichChars = () => {
  const lo = clampCharsValue(rules.enrich_min_chars, ENRICH_MIN_CHARS_DEFAULT);
  const hi = clampCharsValue(rules.enrich_max_chars, ENRICH_MAX_CHARS_DEFAULT);
  rules.enrich_min_chars = lo;
  rules.enrich_max_chars = lo > hi ? lo : hi;
};

// 彩蛋阈值失焦钳制（与字数输入同 idiom，@change 防「输 100 时 1 被钳成 10」跳变）：
// HTML min/max 挡不住手输越界（150/负数/清空）。运行时判定层另有 clamp 防御，但越界值
// 会让彩蛋窗口重叠静默失效（见 critOverlapWarning），故输入层就夹回 schema 界限。
const clampDiceThreshold = (e: Event, lo: number, hi: number): number => {
  const v = Math.round(Number((e.target as HTMLInputElement).value));
  return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo;
};

// 彩蛋窗口有效性警示：两阈值经 judgeOutcome 的 clamp 后重叠（DND：大失败上限≥大成功下限；
// COC：大成功上限≥大失败下限）→ 大成功/大失败双双失效退化为纯成败判定。提前警示，
// 避免「设了极端阈值/装了扩窗卡却再无彩蛋」的无感知困惑。
const critOverlapWarning = computed(() => {
  const d = gs.settings.dice;
  const critS = d.low_roll
    ? Math.min(99, Math.max(1, Math.round(Number(d.low_roll_crit_success_max))))
    : Math.min(100, Math.max(2, Math.round(Number(d.crit_success_min))));
  const critF = d.low_roll
    ? Math.min(100, Math.max(2, Math.round(Number(d.low_roll_crit_fail_min))))
    : Math.min(99, Math.max(1, Math.round(Number(d.crit_fail_max))));
  const critsActive = d.low_roll ? critS < critF : critF < critS;
  return d.enabled && !critsActive ? t`Crit success and crit fail thresholds overlap — crit detection is disabled (treated as pure success/fail). Move the two thresholds apart` : '';
});
</script>

<style scoped>
.choice-generation-editor {
  display: flex;
  flex-direction: column;
  /* 页级分区间距统一 space-4（与外观/统计页一致，滚动节奏统一） */
  gap: var(--choice-space-4);
}

.choice-generation-status {
  display: flex;
  align-items: center;
  gap: var(--choice-space-2);
  padding: var(--choice-space-2) var(--choice-space-3);
  background: var(--choice-bg-card);
  border-radius: var(--choice-radius-md);
  font-size: var(--choice-text-xs);
}

.choice-config-status-label {
  font-weight: 600;
  color: var(--choice-primary);
  white-space: nowrap;
}

.choice-count-row {
  display: flex;
  gap: var(--choice-space-4);
}

.choice-count-item {
  display: flex;
  align-items: center;
  gap: var(--choice-space-2);
  font-size: var(--choice-text-sm);
  color: var(--choice-text-secondary);
}

/* 彩蛋失效警示行：阈值重叠时显示在阈值行下方 */
.choice-dice-crit-warn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--choice-color-warning, var(--choice-color-error));
}

/* 骰子结局模板列表：每档一行（结局名 + 隐形演绎输入 + 回退输入），
   窄屏下输入列 flex 收窄、标签不换行，避免 380px 横向溢出 */
.choice-dice-template-list {
  display: flex;
  flex-direction: column;
  gap: var(--choice-space-2);
}

/* v61 附加玩法开关行：卡片式开关行纵向堆叠（标题 + 说明），上下留白与主体卡内其他分区一致 */
.choice-dice-toggle-list {
  display: flex;
  flex-direction: column;
  gap: var(--choice-space-2);
  margin-top: var(--choice-space-1);
}

.choice-dice-template-row {
  display: flex;
  align-items: center;
  gap: var(--choice-space-3);
  flex-wrap: wrap;
  padding: var(--choice-space-2);
  border: 1px solid var(--choice-border);
  border-radius: var(--choice-radius-md);
  background: var(--choice-bg-element);
}

.choice-dice-template-row > strong {
  flex: 0 0 auto;
  min-width: 56px;
  font-size: var(--choice-text-sm);
}

.choice-dice-template-row .choice-count-item {
  flex: 1 1 200px;
  min-width: 160px;
}

.choice-dice-template-row .choice-count-item span {
  flex: 0 0 auto;
  white-space: nowrap;
  font-size: var(--choice-text-xs);
  color: var(--choice-text-muted);
}

.choice-dice-template-row .choice-input {
  flex: 1;
  min-width: 120px;
}
</style>
