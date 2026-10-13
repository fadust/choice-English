<template>
  <ChoiceDialog :open="open" :title="title" icon="fa-solid fa-file-import" width="480px" @close="onClose">
    <div class="choice-importsrc-body">
      <button class="menu_button menu_button_default choice-importsrc-file-btn" @click="onPickFile">
        <i class="fa-solid fa-file-import"></i>
        {{ t`Choose JSON file…` }}
      </button>
      <div class="choice-importsrc-hint">
        {{
          pickedName
            ? t`File selected:${pickedName}`
            : t`If the button above does nothing (some browsers/wrappers restrict file pickers), paste the exported JSON content below as-is`
        }}
      </div>
      <textarea
        v-model="text"
        class="text_pole choice-importsrc-textarea"
        :placeholder="t`Paste JSON content here (Ctrl+V supported)`"
        rows="8"
        spellcheck="false"
      ></textarea>
      <div v-if="error" class="choice-importsrc-error">{{ error }}</div>
    </div>
    <template #footer>
      <button class="menu_button" @click="onClose">
        {{ t`Cancel` }}
      </button>
      <button v-if="showReplace" class="menu_button choice-importsrc-replace-btn" @click="onReplace">
        {{ t`Replace entire entry pool…` }}
      </button>
      <button class="menu_button menu_button_default" :disabled="!text.trim()" @click="onMerge">
        {{ t`Parse & Merge Import` }}
      </button>
    </template>
  </ChoiceDialog>
</template>

<script setup lang="ts">
// 导入源对话框：文件选择 + 粘贴文本双路径。
// 「解析并合并导入」直接落库（合并带 id 去重，安全）——用户粘贴后一步到位看到条目，
// 不再经过第二个确认弹窗（旧的两步流程被用户视为"点了没反应"）。
// 「替换整个条目库」是危险操作：走父级的预览确认弹窗，且仅在条目库场景提供（showReplace）。
// 本组件只负责拿到「JSON 文本」，格式校验与落库由父级完成（失败时保持本弹窗打开，
// 用户粘贴的内容不丢失，错误以红字显示在文本框下方）。
import { ref, watch } from 'vue';
import ChoiceDialog from '@/components/shared/ChoiceDialog.vue';
import { pickJsonFile } from '@/util/file-picker';

const props = defineProps<{
  open: boolean;
  title: string;
  /** 解析/导入失败原因：红字显示在文本框下方，不随 toast 消失 */
  error?: string;
  /** 是否提供"替换整个条目库"入口（仅条目库场景；正则库只有合并语义） */
  showReplace?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  merge: [{ text: string; fileName: string }];
  replace: [{ text: string; fileName: string }];
}>();

const text = ref('');
const pickedName = ref('');

watch(
  () => props.open,
  open => {
    if (open) {
      text.value = '';
      pickedName.value = '';
    }
  },
);

const onPickFile = async () => {
  const file = await pickJsonFile();
  if (!file) return;
  text.value = await file.text();
  pickedName.value = file.name;
};

const onMerge = () => {
  const content = text.value.trim();
  if (!content) return;
  emit('merge', { text: content, fileName: pickedName.value || 'Paste content' });
};

const onReplace = () => {
  const content = text.value.trim();
  if (!content) return;
  emit('replace', { text: content, fileName: pickedName.value || 'Paste content' });
};

const onClose = () => emit('close');
</script>

<style scoped>
.choice-importsrc-body {
  display: flex;
  flex-direction: column;
  gap: var(--choice-space-2);
}

.choice-importsrc-file-btn {
  width: 100%;
}

.choice-importsrc-hint {
  font-size: var(--choice-text-xs);
  color: var(--choice-text-muted);
  line-height: 1.5;
}

.choice-importsrc-error {
  font-size: var(--choice-text-xs);
  color: var(--choice-color-error);
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.choice-importsrc-textarea {
  width: 100%;
  font-family: monospace;
  font-size: var(--choice-text-xs);
  resize: vertical;
  min-height: 120px;
  white-space: pre;
  overflow-wrap: normal;
  overflow-x: auto;
}

.choice-importsrc-replace-btn {
  color: var(--choice-color-error);
  border-color: var(--choice-color-error);
}
</style>
