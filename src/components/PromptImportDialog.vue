<template>
  <ChoiceDialog
    :open="open"
    :title="t`Import Prompt Modules`"
    icon="fa-solid fa-file-import"
    width="480px"
    @close="$emit('close')"
  >
    <table class="prompt-import-info">
      <tr v-if="summary?.fileName">
        <td class="prompt-import-label">{{ t`File` }}</td>
        <td class="prompt-import-value">{{ summary.fileName }}</td>
      </tr>
      <tr>
        <td class="prompt-import-label">{{ t`Import Scope` }}</td>
        <td class="prompt-import-value">{{ modeLabel }}</td>
      </tr>
      <template v-if="mode === 'new'">
        <tr>
          <td class="prompt-import-label">{{ t`Imported modules` }}</td>
          <td class="prompt-import-value">{{ summary?.totalCount ?? 0 }} {{ t`items` }}</td>
        </tr>
        <tr>
          <td class="prompt-import-label">{{ t`Backfilled from current config` }}</td>
          <td class="prompt-import-value">{{ summary?.keptCount ?? 0 }} {{ t`items` }}</td>
        </tr>
      </template>
      <template v-else>
        <tr>
          <td class="prompt-import-label">{{ t`Overwrite Existing` }}</td>
          <td class="prompt-import-value">{{ summary?.overwriteCount ?? 0 }} {{ t`items` }}</td>
        </tr>
        <tr>
          <td class="prompt-import-label">{{ t`New` }}</td>
          <td class="prompt-import-value">{{ summary?.addCount ?? 0 }} {{ t`items` }}</td>
        </tr>
        <tr>
          <td class="prompt-import-label">{{ t`Keep Existing` }}</td>
          <td class="prompt-import-value">{{ summary?.keptCount ?? 0 }} {{ t`items` }}</td>
        </tr>
      </template>
    </table>

    <div class="prompt-import-mode">
      <label class="prompt-import-radio">
        <input v-model="mode" type="radio" value="merge" />
        <span>{{ t`Merge into existing modules (same ID overwrites content, keeps current order)` }}</span>
      </label>
      <label class="prompt-import-radio">
        <input v-model="mode" type="radio" value="replace" />
        <span class="prompt-import-replace-label">{{ t`Replace all existing modules` }}</span>
      </label>
      <label class="prompt-import-radio">
        <input v-model="mode" type="radio" value="new" />
        <span>{{ t`Import as a new config (current config untouched; switches to it after import)` }}</span>
      </label>
      <label v-if="mode === 'new'" class="prompt-import-field">
        <span class="prompt-import-label">{{ t`Config name` }}</span>
        <input v-model="newName" class="text_pole" />
      </label>
      <p v-if="mode === 'new' && isDup" class="prompt-import-warning">
        {{ t`A config with this name already exists. Please choose another.` }}
      </p>
      <p v-if="mode === 'replace'" class="prompt-import-warning">
        {{ t`⚠ Replace-all discards existing modules not present in the file (including custom ones). This cannot be undone.` }}
      </p>
    </div>

    <template #footer>
      <button class="menu_button" @click="$emit('close')">
        {{ t`Cancel` }}
      </button>
      <button
        class="menu_button menu_button_default"
        :disabled="mode === 'new' && isDup"
        @click="$emit('confirm', { mode, newName: newName.trim() })"
      >
        {{ t`Confirm Import` }}
      </button>
    </template>
  </ChoiceDialog>
</template>

<script setup lang="ts">
import ChoiceDialog from '@/components/shared/ChoiceDialog.vue';

const props = defineProps<{
  open: boolean;
  summary: {
    fileName: string;
    mode: 'all' | 'option' | 'enrich';
    totalCount: number;
    overwriteCount: number;
    addCount: number;
    keptCount: number;
  } | null;
  /** 现有提示词配置名列表：导入为新配置时做重名检测 */
  existingNames?: string[];
}>();

const emit = defineEmits<{
  close: [];
  confirm: [payload: { mode: 'merge' | 'replace' | 'new'; newName?: string }];
}>();

// 默认合并：导入的常见意图是"套用别人的内容"，不该一键抹掉现有配置
const mode = ref<'merge' | 'replace' | 'new'>('merge');
// 新建配置的名称：随文件预填（去 .json），可改
const newName = ref('');

// 导入为新配置时与现有配置重名（trim 后精确比较）→ 行内警告 + 禁用确认
const isDup = computed(() => {
  const trimmed = newName.value.trim();
  return mode.value === 'new' && trimmed.length > 0 && (props.existingNames ?? []).some(n => n.trim() === trimmed);
});

watch(
  () => props.summary?.fileName,
  fileName => {
    newName.value = (fileName || '').replace(/\.json$/i, '');
  },
  { immediate: true },
);

const modeLabel = computed(() => {
  switch (props.summary?.mode) {
    case 'option':
      return t`Option modules only`;
    case 'enrich':
      return t`Enrich modules only`;
    default:
      return t`All modules`;
  }
});
</script>

<style scoped>
.prompt-import-info {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: var(--choice-space-3);
}

.prompt-import-label {
  padding: var(--choice-space-1) var(--choice-space-2);
  font-size: var(--choice-text-sm);
  color: var(--choice-text-muted);
  width: 90px;
  vertical-align: top;
}

.prompt-import-value {
  padding: var(--choice-space-1) var(--choice-space-2);
  font-size: var(--choice-text-sm);
  color: var(--choice-text);
}

.prompt-import-mode {
  display: flex;
  flex-direction: column;
  gap: var(--choice-space-2);
  margin-top: var(--choice-space-2);
  padding-top: var(--choice-space-2);
  border-top: 1px solid var(--choice-border);
}

.prompt-import-radio {
  display: flex;
  align-items: center;
  gap: var(--choice-space-2);
  font-size: var(--choice-text-sm);
  color: var(--choice-text-secondary);
  cursor: pointer;
  padding: var(--choice-space-1) var(--choice-space-2);
  border-radius: var(--choice-radius-sm);
  transition: background var(--choice-transition);
}

.prompt-import-radio:hover {
  background: var(--choice-bg-hover);
}

.prompt-import-field {
  display: flex;
  align-items: center;
  gap: var(--choice-space-2);
  padding: var(--choice-space-1) var(--choice-space-2);
}

.prompt-import-field input {
  flex: 1;
  min-width: 0;
}

.prompt-import-replace-label {
  color: var(--choice-color-warning);
}

.prompt-import-warning {
  margin: 0;
  padding: 0 var(--choice-space-2);
  font-size: var(--choice-text-xs);
  color: var(--choice-color-warning);
}
</style>
