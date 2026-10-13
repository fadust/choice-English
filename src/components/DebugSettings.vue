<template>
  <div class="choice-debug-settings">
    <div class="choice-section">
      <h4 class="choice-section-title"><i class="fa-solid fa-code"></i>{{ t`Version Info` }}</h4>
      <p>Schema: {{ globalStore.settings.schema_version }}</p>
      <p>Prompt Schema: {{ globalStore.settings.prompt_rules.schema_version }}</p>
      <p>{{ t`Module Count` }}: {{ globalStore.settings.prompt_rules.modules.length }}</p>
      <p>{{ t`Entry Pool` }}: {{ globalStore.settings.master_pool.length }} {{ t`entries` }}</p>
      <p>{{ t`Config Count` }}: {{ globalStore.settings.configs.length }}</p>
      <p>{{ t`API Count` }}: {{ globalStore.settings.apis.length }}</p>
    </div>

    <ChoiceSectionCard title="Last generated message" icon="fa-solid fa-terminal">
      <div v-if="!lastBuildMessages" class="choice-empty-hint">{{ t`Never generated` }}</div>
      <div v-else class="choice-debug-messages">
        <div v-for="(m, i) in lastBuildMessages" :key="i" class="choice-debug-msg">
          <span class="choice-debug-role" :class="'role-' + m.role">{{ m.role }}</span>
          <span class="choice-debug-content">{{ truncate(m.content) }}</span>
        </div>
      </div>
    </ChoiceSectionCard>

    <ChoiceSectionCard title="Last deduplication report" icon="fa-solid fa-clone">
      <div v-if="!lastDedupReport || !lastDedupReport.details.length" class="choice-empty-hint">
        {{ t`Dedup not triggered (disabled or no duplicates)` }}
      </div>
      <div v-else class="choice-debug-messages">
        <div class="choice-debug-msg">
          <span class="choice-debug-role">{{ t`Removed count` }}</span>
          <span class="choice-debug-content">{{ lastDedupReport.dropped }}</span>
        </div>
        <div class="choice-debug-msg">
          <span class="choice-debug-role">{{ t`Top up` }}</span>
          <span class="choice-debug-content">{{ lastDedupReport.refilled ? t`Yes` : t`No` }}</span>
        </div>
        <div class="choice-debug-msg">
          <span class="choice-debug-role">{{ t`Threshold` }}</span>
          <span class="choice-debug-content">{{ lastDedupReport.threshold }}</span>
        </div>
      </div>
      <div v-if="lastDedupReport?.refs.length" class="choice-debug-dedup-refs">
        <div class="choice-debug-dedup-refs-title">{{ t`reference pool (${lastDedupReport.refs.length} Article)` }}</div>
        <div class="choice-debug-dedup-refs-list">
          <div v-for="(ref, i) in lastDedupReport.refs" :key="i" class="choice-debug-dedup-ref-item">
            {{ truncate(ref, 100) }}
          </div>
        </div>
      </div>
      <div v-if="lastDedupReport?.details.length" class="choice-debug-dedup-details">
        <div v-for="(d, i) in lastDedupReport.details" :key="i" class="choice-debug-dedup-item">
          <div class="choice-debug-dedup-candidate">{{ truncate(d.candidate, 80) }}</div>
          <div class="choice-debug-dedup-meta">
            <span :class="['choice-debug-dedup-reason', 'reason-' + d.reason]">
              {{ d.reason === 'title' ? t`Exact title match` : t`Jaccard ${d.score?.toFixed(2)}` }}
            </span>
            <span class="choice-debug-dedup-matched">{{ t`⇐` }} {{ truncate(d.matchedRef, 60) }}</span>
          </div>
        </div>
      </div>
    </ChoiceSectionCard>

    <ChoiceSectionCard title="Placeholder Quick Look" icon="fa-solid fa-dollar-sign">
      <p class="choice-debug-hint">
        {{ t`Variables usable in module content, auto-replaced with real values at generation time (copy into prompt modules)` }}
      </p>
      <div class="choice-debug-ph-list">
        <div v-for="ph in PLACEHOLDER_DOCS" :key="ph.syntax" class="choice-debug-ph">
          <code class="choice-debug-ph-syntax">{{ ph.syntax }}</code>
          <span class="choice-debug-ph-desc">{{ ph.desc }}</span>
        </div>
      </div>
    </ChoiceSectionCard>

    <ChoiceSectionCard title="Dangerous operation" icon="fa-solid fa-triangle-exclamation" tone="danger" default-open>
      <button class="menu_button" :title="t`Delete all settings and restore plugin to factory defaults`" @click="factoryReset">
        <i class="fa-solid fa-rotate-left"></i>
        {{ t`Factory Reset` }}
      </button>
    </ChoiceSectionCard>
  </div>
</template>

<script setup lang="ts">
import ChoiceSectionCard from '@/components/shared/ChoiceSectionCard.vue';
import toastr from 'toastr';
import { useGlobalSettingsStore } from '@/store/global-settings';
import { lastBuildMessages, lastDedupReport } from '@/core/generator';

const globalStore = useGlobalSettingsStore();

/** 占位符速查表：名称 + 中文说明。说明必须与 generator.ts 的 sub() 替换语义一致，
 *  新增占位符时两处同步（此处只是文档，替换逻辑以 sub() 为准）。 */
const PLACEHOLDER_DOCS = [
  { syntax: '{{count}}', desc: t`Number of options/versions to generate this round (when count is a range, this is the value actually drawn)` },
  { syntax: '{{count_minus_1}}', desc: t`Decrease count by one (count - 1)` },
  { syntax: '{{pinned_count}}', desc: t`Number of pinned entries` },
  { syntax: '{{pinned}}', desc: t`Pinned entries — material that must all be used this round (option generation)` },
  { syntax: '{{pool_selected}}', desc: t`Candidate entries — material the AI picks directions from (option generation)` },
  { syntax: '{{input}}', desc: t`Original user text to enrich (only set for enrich tasks)` },
  { syntax: '{{min_chars}}', desc: t`Per-option character floor — options and enrichment each use their own setting` },
  { syntax: '{{max_chars}}', desc: t`Per-option character cap — options and enrichment each use their own setting` },
  { syntax: '{{option_person}}', desc: t`Narrative person for options (e.g. "third person")` },
  { syntax: '{{enrich_person}}', desc: t`Polish Person` },
  { syntax: '{{enrich_person_style}}', desc: t`Enrichment person/style directive (whole sentence, incl. persona requirements)` },
  { syntax: '{{prev_options}}', desc: t`Text of the options generated for the previous floor (unused by default prompts; custom modules may reference it)` },
  {
    syntax: '{{user}} and other pub macros',
    desc: t`Replaced by the SillyTavern macro engine (also runs inside assistant-role modules)`,
  },
];

function factoryReset() {
  if (
    !confirm(
      t`Are you sure you want to restore all plug-in settings to factory defaults? \n\nThis will delete all entry pools, prompt word configurations, API settings, UI preferences, etc. \nThis operation is irreversible!`,
    )
  )
    return;
  globalStore.factoryReset();
  toastr.success(t`Factory reset completed`);
}

function truncate(s: string, n = 120): string {
  return s.length > n ? s.slice(0, n) + '…' : s;
}
</script>

<style scoped>
/* 调试页此前无任何样式，p 标签继承酒馆浅色文字，在亮色面板上几乎不可读 */
.choice-debug-settings {
  display: flex;
  flex-direction: column;
  gap: var(--choice-space-4);
}

.choice-debug-settings p {
  margin: 2px 0;
  font-size: var(--choice-text-sm);
  color: var(--choice-text-secondary);
}

.choice-debug-messages {
  display: flex;
  flex-direction: column;
  gap: var(--choice-space-1);
  max-height: 400px;
  overflow: auto;
}

.choice-debug-msg {
  display: flex;
  gap: var(--choice-space-2);
  font-size: var(--choice-text-xs);
  line-height: var(--choice-line-height);
}

.choice-debug-role {
  flex-shrink: 0;
  font-weight: 600;
  text-transform: uppercase;
  width: 60px;
}

.role-system {
  color: var(--choice-color-info);
}
.role-user {
  color: var(--choice-color-warning);
}
.role-assistant {
  color: var(--choice-color-success);
}

.choice-debug-content {
  word-break: break-all;
  white-space: pre-wrap;
  color: var(--choice-text);
}

.choice-debug-hint {
  color: var(--choice-text-muted);
}

.choice-debug-ph-list {
  display: flex;
  flex-direction: column;
  gap: var(--choice-space-1);
}

.choice-debug-ph {
  display: flex;
  align-items: baseline;
  gap: var(--choice-space-2);
  font-size: var(--choice-text-xs);
  line-height: var(--choice-line-height);
}

.choice-debug-ph-syntax {
  flex-shrink: 0;
  min-width: 150px;
  font-family: var(--choice-font-mono);
  color: var(--choice-color-info);
  word-break: break-all;
}

.choice-debug-ph-desc {
  color: var(--choice-text-secondary);
  word-break: break-all;
}

.choice-debug-dedup-details {
  margin-top: var(--choice-space-2);
  display: flex;
  flex-direction: column;
  gap: var(--choice-space-1);
}

.choice-debug-dedup-item {
  padding: var(--choice-space-2);
  background: var(--choice-bg-elevated);
  border-radius: var(--choice-radius-sm);
  border-left: 3px solid var(--choice-color-warning);
}

.choice-debug-dedup-candidate {
  font-size: var(--choice-text-sm);
  color: var(--choice-text);
  word-break: break-all;
}

.choice-debug-dedup-meta {
  margin-top: var(--choice-space-1);
  display: flex;
  gap: var(--choice-space-2);
  font-size: var(--choice-text-xs);
  color: var(--choice-text-secondary);
}

.choice-debug-dedup-reason {
  font-weight: 600;
}

.reason-title {
  color: var(--choice-color-info);
}

.reason-jaccard {
  color: var(--choice-color-warning);
}

.choice-debug-dedup-matched {
  opacity: 0.8;
}

.choice-debug-dedup-refs {
  margin-top: var(--choice-space-2);
}

.choice-debug-dedup-refs-title {
  font-size: var(--choice-text-xs);
  font-weight: 600;
  color: var(--choice-text-secondary);
  margin-bottom: var(--choice-space-1);
}

.choice-debug-dedup-refs-list {
  display: flex;
  flex-direction: column;
  gap: var(--choice-space-1);
}

.choice-debug-dedup-ref-item {
  font-size: var(--choice-text-xs);
  color: var(--choice-text-secondary);
  word-break: break-all;
  padding: var(--choice-space-1) var(--choice-space-2);
  background: var(--choice-bg-elevated);
  border-radius: var(--choice-radius-sm);
  border-left: 2px solid var(--choice-color-info);
}
</style>
