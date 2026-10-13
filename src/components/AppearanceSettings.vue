<template>
  <div class="choice-appearance-editor">
    <!-- 高级功能分区：纯 UI 分层开关，独立成区——它是「设置页显示哪些 tab」的开关，
         不属于悬浮窗或聊天界面任一类别。appearance 是基础 tab，简化模式下它是
         重新开启高级 tab 的唯一入口，必须任何模式下都可达 -->
    <div class="choice-section">
      <h4 class="choice-section-title">{{ t`Advanced` }}</h4>
      <div class="choice-behavior-grid">
        <label class="choice-toggle">
          <input v-model="ui.advanced_features_enabled" type="checkbox" />
          <span class="choice-toggle-custom"></span>
          <span class="choice-toggle-label">
            <strong>{{ t`Show advanced settings pages` }}</strong>
            <small>{{ t`Show/hide toggles for the Prompt, World Info, Filter, Debug and other settings pages` }}</small>
          </span>
        </label>
      </div>
    </div>

    <!-- 悬浮窗分区：悬浮球开关 + 单击行为。data-tour 锚点挂在此区
         （引导 chapter 的 appearance-floating 步骤聚焦悬浮窗相关设置） -->
    <ChoiceSectionCard title="Floating Window" icon="fa-solid fa-circle-nodes" data-tour="appearance-floating">
      <div class="choice-behavior-grid">
        <label class="choice-toggle">
          <input :checked="ui.floating_enabled" type="checkbox" @change="onEntryToggle('floating', $event)" />
          <span class="choice-toggle-custom"></span>
          <span class="choice-toggle-label">
            <strong>{{ t`Floating Window` }}</strong>
            <small>{{ t`Show a quick-access button in the bottom-right corner` }}</small>
          </span>
        </label>
      </div>
      <!-- 悬浮球单击行为：options=单击切换选项弹窗，settings=单击打开设置面板。
           右键/长按快捷菜单不受影响，两种模式下弹窗与设置都可达 -->
      <div class="choice-seg choice-position-switch">
        <button
          class="choice-seg-btn"
          :class="{ active: ui.bubble_click_action === 'options' }"
          :title="t`Left-click the bubble opens the options dialog`"
          @click="ui.bubble_click_action = 'options'"
        >
          <i class="fa-solid fa-chess"></i>
          {{ t`Click opens options` }}
        </button>
        <button
          class="choice-seg-btn"
          :class="{ active: ui.bubble_click_action === 'settings' }"
          :title="t`Left-click the bubble opens the settings panel (right-click / long-press still shows options)`"
          @click="ui.bubble_click_action = 'settings'"
        >
          <i class="fa-solid fa-gear"></i>
          {{ t`Click opens settings` }}
        </button>
      </div>
      <!-- 悬浮球样式：ring=现状环形；compact=紧凑小点（手机端更小、更不遮挡）。
           直径随样式联动（floating-state.bubbleSizeFor 单一来源） -->
      <div class="choice-seg choice-position-switch">
        <button
          class="choice-seg-btn"
          :class="{ active: ui.bubble_style === 'ring' }"
          :title="t`Current style: ring (desktop 60 / mobile 48 px)`"
          @click="ui.bubble_style = 'ring'"
        >
          <i class="fa-solid fa-circle"></i>
          {{ t`Ring` }}
        </button>
        <button
          class="choice-seg-btn"
          :class="{ active: ui.bubble_style === 'compact' }"
          :title="t`Compact dot (desktop 48 / mobile 40 px), subtler inner ring, less occlusion on phones`"
          @click="ui.bubble_style = 'compact'"
        >
          <i class="fa-solid fa-circle-dot"></i>
          {{ t`Compact` }}
        </button>
      </div>
    </ChoiceSectionCard>

    <!-- 聊天界面分区：聊天内选项面板 + 停靠位置 + 魔棒入口 -->
    <ChoiceSectionCard title="Chat interface" icon="fa-solid fa-comments">
      <div class="choice-behavior-grid">
        <label class="choice-toggle">
          <input :checked="ui.chat_panel_enabled" type="checkbox" @change="onEntryToggle('chat', $event)" />
          <span class="choice-toggle-custom"></span>
          <span class="choice-toggle-label">
            <strong>{{ t`Options panel` }}</strong>
            <small>{{ t`Show the options panel in the chat UI; when off, view options via the floating bubble dialog` }}</small>
          </span>
        </label>
        <label class="choice-toggle">
          <input v-model="ui.panel_collapse_on_outside_click" type="checkbox" />
          <span class="choice-toggle-custom"></span>
          <span class="choice-toggle-label">
            <strong>{{ t`Collapse panel on chat body click` }}</strong>
            <small>{{ t`Collapse the expanded panel when clicking chat text/blank space (links/buttons/inputs don't trigger)` }}</small>
          </span>
        </label>
        <label class="choice-toggle">
          <input :checked="ui.wand_menu_enabled" type="checkbox" @change="onEntryToggle('wand', $event)" />
          <span class="choice-toggle-custom"></span>
          <span class="choice-toggle-label">
            <strong>{{ t`Wand Menu Entry` }}</strong>
            <small>{{ t`Show the Action Options entry in the Extensions (wand) menu` }}</small>
          </span>
        </label>
        <label class="choice-toggle">
          <input v-model="ui.hud_enabled" type="checkbox" />
          <span class="choice-toggle-custom"></span>
          <span class="choice-toggle-label">
            <strong>{{ t`Option HUD` }}</strong>
            <small>{{ t`Risk color bars (Conservative/Balanced/Bold) / hover enhancement / entrance animation / selected marks` }}</small>
          </span>
        </label>
      </div>
      <!-- 面板停靠位置：切换由 panel-mount 监听设置变更即时迁移挂载点。
           输入框上方 = 停靠模式，展开限高滚动，选项再多不覆盖整屏 -->
      <div class="choice-seg choice-position-switch">
        <button
          class="choice-seg-btn"
          :class="{ active: ui.panel_position === 'chat' }"
          :title="t`Below the latest message; scrolls with the chat`"
          @click="ui.panel_position = 'chat'"
        >
          <i class="fa-solid fa-layer-group"></i>
          {{ t`In Chat` }}
        </button>
        <button
          class="choice-seg-btn"
          :class="{ active: ui.panel_position === 'input' }"
          :title="t`Docked above the input box, doesn't scroll with chat; expands with capped height and internal scrolling so options never fill the screen`"
          @click="ui.panel_position = 'input'"
        >
          <i class="fa-solid fa-anchor"></i>
          {{ t`Above Input` }}
        </button>
      </div>
    </ChoiceSectionCard>

    <ChoiceSectionCard title="Theme" icon="fa-solid fa-palette" data-tour="appearance-theme">
      <div class="choice-seg">
        <button
          class="choice-seg-btn"
          :class="{ active: ui.theme_mode === 'auto' }"
          :title="t`Auto-detect SillyTavern theme (dark/light)`"
          @click="ui.theme_mode = 'auto'"
        >
          <i class="fa-solid fa-magic"></i>
          {{ t`Auto` }}
        </button>
        <button
          class="choice-seg-btn"
          :class="{ active: ui.theme_mode === 'st' }"
          :title="t`Follow SillyTavern theme colors completely`"
          @click="ui.theme_mode = 'st'"
        >
          <i class="fa-solid fa-palette"></i>
          {{ t`Follow` }}
        </button>
        <button
          class="choice-seg-btn"
          :class="{ active: ui.theme_mode === 'dark' }"
          :title="t`Force dark theme`"
          @click="ui.theme_mode = 'dark'"
        >
          <i class="fa-solid fa-moon"></i>
          {{ t`Dark` }}
        </button>
        <button
          class="choice-seg-btn"
          :class="{ active: ui.theme_mode === 'light' }"
          :title="t`Force light theme`"
          @click="ui.theme_mode = 'light'"
        >
          <i class="fa-solid fa-sun"></i>
          {{ t`Light` }}
        </button>
        <!-- 预设主题：独立完整 token 块（theme.css），与面板头部的循环切换按钮共用
             theme_mode 字段，此处的激活态随面板切换自动同步 -->
        <button
          v-for="preset in THEME_PRESETS"
          :key="preset.id"
          class="choice-seg-btn"
          :class="{ active: ui.theme_mode === preset.id }"
          :title="t`switch to${preset.label}Theme`"
          @click="ui.theme_mode = preset.id"
        >
          <span class="choice-theme-swatch" :style="{ background: preset.swatch }"></span>
          {{ preset.label }}
        </button>
      </div>
    </ChoiceSectionCard>

    <ChoiceSectionCard title="font size" icon="fa-solid fa-text-height">
      <div class="choice-seg">
        <!-- 跟随设备：有效档在 global-settings 计算（触屏 small / 桌面 medium）。
             点具体档位即退出跟随并固定，此按钮用于回到自动——不加它，手机用户
             一旦点过档位就再也回不到"手机默认小字"的状态 -->
        <button
          class="choice-seg-btn"
          :class="{ active: ui.font_size_auto }"
          :title="t`Follow device: small on touch screens, medium on desktop; picking a specific size fixes it`"
          @click="ui.font_size_auto = true"
        >
          {{ t`Auto` }}
        </button>
        <button
          v-for="size in fontSizes"
          :key="size.value"
          class="choice-seg-btn"
          :class="{ active: !ui.font_size_auto && ui.font_size === size.value }"
          :title="size.tip"
          @click="onPickFontSize(size.value)"
        >
          {{ size.label }}
        </button>
      </div>
    </ChoiceSectionCard>
  </div>
</template>

<script setup lang="ts">
import ChoiceSectionCard from '@/components/shared/ChoiceSectionCard.vue';
import { useGlobalSettingsStore } from '@/store/global-settings';
import { THEME_OPTIONS } from '@/core/theme-presets';
import { setEntryVisible, type EntryKey } from '@/core/entry-points';

const store = useGlobalSettingsStore();
const ui = computed(() => store.settings.ui);

// 入口开关：v-model 直绑会绕过「至少保留一个入口」保底（可全关后插件无从找回），
// 改走 setEntryVisible 护栏——关掉最后一个时被拒绝并 toastr 提示
const onEntryToggle = (key: EntryKey, e: Event) => {
  const input = e.target as HTMLInputElement;
  // 被护栏拒绝（关最后一个入口）时 store 不变、checkbox DOM 已翻转——回写对齐防视觉脱节
  if (!setEntryVisible(key, input.checked)) {
    input.checked = !input.checked;
  }
};

// 预设主题按钮数据源：与面板循环按钮共用注册表，按 kind 过滤——
// 不能用 swatch 是否为空判断（语义过载），mode 档按钮由上方四个固定按钮承担
const THEME_PRESETS = THEME_OPTIONS.filter(t => t.kind === 'preset');

const fontSizes = [
  { value: 'small' as const, label: t`Small`, tip: t`Small font, suitable for compact layouts` },
  { value: 'medium' as const, label: t`Medium`, tip: t`Default font size` },
  { value: 'large' as const, label: t`Large`, tip: t`Large font, easier to read` },
];

// 点具体档位 = 退出"跟随设备"并固定（font_size_auto=false 后有效档不再读 matchMedia）
const onPickFontSize = (size: 'small' | 'medium' | 'large') => {
  ui.value.font_size = size;
  ui.value.font_size_auto = false;
};
</script>

<style scoped>
.choice-appearance-editor {
  display: flex;
  flex-direction: column;
  gap: var(--choice-space-4);
}

.choice-behavior-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--choice-space-2);
}

/* 面板位置切换条：与上方悬浮窗复选框拉开一行间距（复用主题分段按钮样式） */
.choice-position-switch {
  margin-top: var(--choice-space-2);
  flex-wrap: wrap;
}

.choice-enrich-count {
  display: flex;
  align-items: center;
  gap: var(--choice-space-2);
  padding: var(--choice-space-2) var(--choice-space-3);
  background: var(--choice-bg-card);
  border-radius: var(--choice-radius-md);
}

.choice-appearance-label {
  font-size: var(--choice-text-sm);
  color: var(--choice-text-secondary);
}

.choice-appearance-value {
  color: var(--choice-primary);
  font-weight: bold;
}

/* 预设主题按钮的色点：颜色来自 THEME_OPTIONS.swatch（与 theme.css 主色手工同步），
   走 Vue :style 绑定而非写死 CSS——注册表增删主题时按钮无需改样式。
   分段容器/按钮本体走 global.css 的 .choice-seg/.choice-seg-btn 原子 */
.choice-theme-swatch {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow: inset 0 0 1px rgba(0, 0, 0, 0.3);
}

.choice-opacity-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--choice-bg-element);
  appearance: none;
  -webkit-appearance: none;
  outline: none;
  cursor: pointer;
}

.choice-opacity-slider::-webkit-slider-thumb {
  appearance: none;
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--choice-primary);
  border: 2px solid var(--choice-bg-panel);
  box-shadow: 0 0 8px var(--choice-primary-glow);
  cursor: pointer;
  transition: transform var(--choice-transition);
}

.choice-opacity-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.choice-opacity-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--choice-primary);
  border: 2px solid var(--choice-bg-panel);
  box-shadow: 0 0 8px var(--choice-primary-glow);
  cursor: pointer;
}
</style>
