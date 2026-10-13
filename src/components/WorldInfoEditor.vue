<template>
  <div class="choice-wi-editor">
    <div class="choice-section" data-tour="wi-checks">
      <h4 class="choice-section-title"><i class="fa-solid fa-sliders"></i>{{ t`Settings` }}</h4>
      <div class="choice-wi-checks">
        <label class="choice-check">
          <input v-model="globalStore.settings.world_info.enabled" type="checkbox" />
          {{ t`Enable World Info` }}
        </label>
        <label
          class="choice-check"
          :title="
            t`When on, world info entries first have {{macros}} expanded; if the 'Prompt Template' plugin is installed and an entry contains <% %>, the embedded JS is executed so dynamic entries (e.g. persona switching by affection) get the final output instead of raw text. Without the plugin, only macro expansion is done. EJS that writes variables (setvar) runs on every generation and may change variable state; you can turn this off for such World Infos.`
          "
        >
          <input v-model="globalStore.settings.world_info.render_world_info_ejs" type="checkbox" />
          {{ t`EJS Rendering` }}
        </label>
      </div>
    </div>

    <div class="choice-section" data-tour="wi-books">
      <h4 class="choice-section-title">
        <i class="fa-solid fa-book-bookmark"></i>{{ t`Active World Info Books` }}
        <span class="choice-wi-count">（{{ activeBooks.length }}）</span>
      </h4>
      <div v-if="activeBooks.length === 0" class="choice-empty-hint">
        {{ t`No enabled World Info books` }}
      </div>
      <div class="choice-wi-list">
        <template v-for="book in activeBooks" :key="book.name">
          <div
            class="choice-wi-row"
            :class="{ excluded: getBookMode(book.name) === 'off' || isBookGloballyExcluded(book.name) }"
            @click="toggleBookExpand(book.name)"
          >
            <i class="fa-solid" :class="bookExpanded.has(book.name) ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
            <span class="choice-wi-light" :class="bookLightClass(book)"></span>
            <span class="choice-wi-name">{{ book.name }}</span>
            <span v-if="book.source === 'global'" class="choice-wi-badge badge-global">{{ t`Global` }}</span>
            <span v-if="book.source === 'character'" class="choice-wi-badge badge-character">{{ t`Character` }}</span>
            <span v-if="book.source === 'chat'" class="choice-wi-badge badge-chat">{{ t`Chat` }}</span>
            <span v-if="book.isShujuku" class="choice-wi-badge badge-shujuku">{{ t`Database` }}</span>
            <span v-if="getBookMode(book.name) === 'custom'" class="choice-wi-badge badge-custom">{{ t`Custom` }}</span>
            <!-- 三态钩 + 自定义：循环 条目全关 → 条目启用（默认）→ 条目全启用；勾选条目进入自定义 -->
            <span
              class="choice-wi-mode"
              :class="[`mode-${getBookMode(book.name)}`, { 'mode-disabled': isBookGloballyExcluded(book.name) }]"
              :title="bookModeTitle(book.name)"
              @click.stop="cycleBookMode(book.name)"
            >
              <i v-if="getBookMode(book.name) === 'force'" class="fa-solid fa-check choice-wi-mode-check"></i>
              <span v-else-if="getBookMode(book.name) !== 'off'" class="choice-wi-mode-block"></span>
            </span>
            <span v-if="isBookGloballyExcluded(book.name)" class="choice-wi-badge badge-global-excl">{{
              t`Global Exclusions`
            }}</span>
            <button
              v-if="enabledBooksSet.has(book.name)"
              class="choice-wi-enable-btn"
              :title="t`Removed from this extension's enabled list; the book returns to the disabled area`"
              @click.stop="disableBook(book.name)"
            >
              {{ t`Remove` }}
            </button>
          </div>
          <div v-if="bookExpanded.has(book.name) && bookEntries[book.name]" class="choice-wi-entries">
            <div
              v-for="entry in bookEntries[book.name]"
              :key="entry.uid"
              class="choice-wi-entry"
              :class="{ disabled: getBookMode(book.name) === 'follow' && entry.disable }"
            >
              <span class="choice-wi-entry-state">{{ entryStateIcon(entry) }}</span>
              <span class="choice-wi-entry-name">{{ entry.comment || entry.key?.[0] || `#${entry.uid}` }}</span>
              <!-- 条目勾选跟随书模式联动：全关=全空、启用=按酒馆/覆盖、全启用=全勾；任意模式勾选即进入自定义 -->
              <input
                type="checkbox"
                :checked="isEntryOn(book.name, entry)"
                :title="t`Toggle this entry (enters custom mode)`"
                @change="toggleEntry(book.name, entry.uid)"
              />
            </div>
          </div>
        </template>
      </div>
    </div>

    <ChoiceSectionCard title="Global Exclusions" icon="fa-solid fa-ban" data-tour="wi-excl">
      <div class="choice-wi-global-excl">
        <div class="choice-wi-global-excl-body">
          <div v-if="globalExcludedBooks.length === 0" class="choice-empty-hint">
            {{ t`No global exclusions set. Globally excluded world info is never used for options generation in any chat.` }}
          </div>
          <div class="choice-wi-list">
            <div v-for="name in globalExcludedBooks" :key="name" class="choice-wi-row excluded-global">
              <span class="choice-wi-name">{{ name }}</span>
              <button class="choice-wi-enable-btn" @click.stop="removeGlobalExcl(name)">{{ t`Remove` }}</button>
            </div>
          </div>
          <input v-model="globalExclSearch" class="choice-input choice-wi-search" :placeholder="t`Search World Info name`" />
          <div class="choice-wi-list choice-wi-available">
            <div v-if="availableGlobalExclBooks.length === 0" class="choice-empty-hint">
              {{ t`No World Infos available to add` }}
            </div>
            <div
              v-for="name in availableGlobalExclBooks"
              :key="name"
              class="choice-wi-row available"
              @click.stop="addGlobalExcl(name)"
            >
              <span class="choice-wi-name">{{ name }}</span>
              <button class="choice-wi-enable-btn" @click.stop="addGlobalExcl(name)">{{ t`Add` }}</button>
            </div>
          </div>
        </div>
      </div>
    </ChoiceSectionCard>

    <ChoiceSectionCard title="Unenabled World Info" icon="fa-solid fa-book">
      <div class="choice-wi-global-excl-body">
        <div v-if="inactiveBooks.length === 0" class="choice-empty-hint">
          {{ t`No disabled World Info books` }}
        </div>
        <input v-model="inactiveSearch" class="choice-input choice-wi-search" :placeholder="t`Search World Info name`" />
        <div class="choice-wi-list choice-wi-available">
          <div v-for="book in filteredInactiveBooks" :key="book.name" class="choice-wi-row inactive">
            <span class="choice-wi-light"></span>
            <span class="choice-wi-name">{{ book.name }}</span>
            <button class="choice-wi-enable-btn" @click.stop="enableBook(book.name)">{{ t`Enable` }}</button>
          </div>
          <div v-if="filteredInactiveBooks.length === 0 && inactiveBooks.length > 0" class="choice-empty-hint">
            {{ t`No matching World Info` }}
          </div>
        </div>
      </div>
    </ChoiceSectionCard>

    <div class="choice-hint">
      {{ t`Hook cycles entry modes: all-off → follow (default) → force-all (☑️); toggling an entry enters custom mode for per-entry control` }}
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  this_chid,
  eventSource,
  event_types,
  chat_metadata,
  loadWorldInfo,
  selected_world_info,
  world_names,
  METADATA_KEY,
} from '@/core/st-world-info';
import { getStCharacter } from '@/core/st-character';
import toastr from 'toastr';
import { useChatSettingsStore } from '@/store/chat-settings';
import { useGlobalSettingsStore } from '@/store/global-settings';
import ChoiceSectionCard from '@/components/shared/ChoiceSectionCard.vue';
import { getShujukuTargetBook } from '@/core/shujuku-bridge';
import type { WIBookMode } from '@/type/settings';

const chatStore = useChatSettingsStore();
const globalStore = useGlobalSettingsStore();

/** loadWorldInfo 的酒馆官方 JSDoc 只写了 Object|null（world-info.js），实际返回世界书数据
 *  { entries: Record<uid, 条目> }；本组件只消费这几个字段，按使用面声明，调用点显式断言 */
type LoadedWorldInfo = {
  entries?: Record<
    string,
    {
      uid?: number;
      comment?: string;
      key?: string[] | string;
      content?: string;
      constant?: boolean;
      disable?: boolean;
      vectorized?: boolean;
    }
  >;
} | null;

type BookInfo = {
  name: string;
  source: 'global' | 'character' | 'chat' | '';
  active: boolean;
  isShujuku: boolean;
};

type EntryInfo = {
  uid: string | number;
  comment: string;
  key: string[];
  content: string;
  constant: boolean;
  disable: boolean;
  vectorized: boolean;
};

const allBooks = ref<BookInfo[]>([]);
const bookEntries = ref<Record<string, EntryInfo[]>>({});
const bookExpanded = ref<Set<string>>(new Set());
const globalExclSearch = ref('');
const inactiveSearch = ref('');

const activeBooks = computed(() =>
  allBooks.value.filter(b => b.active || chatStore.settings.world_info.enabled_books.includes(b.name)),
);
const inactiveBooks = computed(() =>
  allBooks.value.filter(b => !b.active && !chatStore.settings.world_info.enabled_books.includes(b.name)),
);

// 显式启用集合：供行内「移除」按钮 v-if 用，避免每行 includes，且响应式
const enabledBooksSet = computed(() => new Set(chatStore.settings.world_info.enabled_books));

// 未启用区的搜索过滤：仅影响展示，不写 store/schema
const filteredInactiveBooks = computed(() => {
  const kw = inactiveSearch.value.trim().toLowerCase();
  if (!kw) return inactiveBooks.value;
  return inactiveBooks.value.filter(b => b.name.toLowerCase().includes(kw));
});

const globalExcludedBooks = computed(() => globalStore.settings.world_info.global_excluded_books);

const availableGlobalExclBooks = computed(() => {
  const excluded = new Set(globalExcludedBooks.value);
  const kw = globalExclSearch.value.trim().toLowerCase();
  return (world_names ?? []).filter(name => !excluded.has(name) && (!kw || name.toLowerCase().includes(kw)));
});

const isBookGloballyExcluded = (name: string) => globalStore.settings.world_info.global_excluded_books.includes(name);

const addGlobalExcl = (name: string) => {
  if (!name) return;
  const list = globalStore.settings.world_info.global_excluded_books;
  if (!list.includes(name)) list.push(name);
};

const removeGlobalExcl = (name: string) => {
  const list = globalStore.settings.world_info.global_excluded_books;
  const idx = list.indexOf(name);
  if (idx !== -1) list.splice(idx, 1);
};

// 三态条目模式：无记录按 follow（条目启用）处理
const getBookMode = (name: string): WIBookMode => chatStore.settings.world_info.book_entry_modes[name] ?? 'follow';

const cycleBookMode = (name: string) => {
  if (isBookGloballyExcluded(name)) return;
  const modes = chatStore.settings.world_info.book_entry_modes;
  // 循环顺序与用户列举一致：全关 → 启用（默认）→ 全启用 → 全关
  const next: WIBookMode = getBookMode(name) === 'off' ? 'follow' : getBookMode(name) === 'follow' ? 'force' : 'off';
  modes[name] = next;
};

const bookModeTitle = (name: string) => {
  const mode = getBookMode(name);
  if (mode === 'off') return t`All entries disabled (click: entries follow tavern)`;
  if (mode === 'force') return t`All entries force-enabled regardless of tavern state (click: all disabled)`;
  if (mode === 'custom') return t`Custom per-entry toggles (click: all disabled)`;
  return t`Entries follow tavern (tavern-disabled entries stay disabled; default; click: force-enable all)`;
};

// 条目勾选框状态跟随书模式联动：全关=全空；条目启用=酒馆原生 disable（纯酒馆态）；
// 全启用=全勾；自定义=按覆盖逐条（覆盖仅自定义模式生效，切换模式即脱离自定义）
const isEntryOn = (bookName: string, entry: EntryInfo) => {
  const mode = getBookMode(bookName);
  if (mode === 'off') return false;
  if (mode === 'force') return true;
  if (mode === 'custom') {
    const ov = chatStore.settings.world_info.book_entry_overrides[bookName]?.[String(entry.uid)];
    return typeof ov === 'boolean' ? ov : !entry.disable;
  }
  return !entry.disable;
};

const enableBook = async (name: string) => {
  const enabled = chatStore.settings.world_info.enabled_books;
  const excluded = chatStore.settings.world_info.excluded_books;
  if (!enabled.includes(name)) enabled.push(name);
  const xi = excluded.indexOf(name);
  if (xi !== -1) excluded.splice(xi, 1);
  try {
    const data = (await loadWorldInfo(name)) as LoadedWorldInfo;
    if (data?.entries) {
      bookEntries.value = {
        ...bookEntries.value,
        [name]: Object.values(data.entries).map((e: any) => ({
          uid: e.uid,
          comment: e.comment ?? '',
          key: e.key ?? [],
          content: e.content ?? '',
          constant: e.constant ?? false,
          disable: e.disable ?? false,
          vectorized: e.vectorized ?? false,
        })),
      };
    }
  } catch {
    // ignore load errors
  }
};

// 移除本扩展显式启用：只从 enabled_books 删，书自动回到未启用区（除非它同时是 ST 全局/角色/聊天激活书）。
// 不动 book_entry_modes/overrides（书重新启用时保留条目自定义态）、不动 excluded_books（那是参与排除语义）。
const disableBook = (name: string) => {
  const enabled = chatStore.settings.world_info.enabled_books;
  const xi = enabled.indexOf(name);
  if (xi !== -1) enabled.splice(xi, 1);
};

const toggleBookExpand = (name: string) => {
  if (bookExpanded.value.has(name)) bookExpanded.value.delete(name);
  else bookExpanded.value.add(name);
};

/** 任意模式下手动勾选条目：非 custom 先快照当前显示态（该书全部条目的勾选显示）进 overrides
 *  并切入 custom（toastr 提醒），再翻转所点条目；custom 下直接翻转对应覆盖位。 */
const toggleEntry = (bookName: string, uid: string | number) => {
  const wi = chatStore.settings.world_info;
  const uidKey = String(uid);
  if (getBookMode(bookName) !== 'custom') {
    const snap: Record<string, boolean> = {};
    for (const e of bookEntries.value[bookName] ?? []) {
      snap[String(e.uid)] = isEntryOn(bookName, e);
    }
    wi.book_entry_overrides[bookName] = snap;
    wi.book_entry_modes[bookName] = 'custom';
    toastr.info(t`Entered custom mode: "${bookName}"Items will take effect one by one by pressing the manual switch.`);
  }
  const bookOverrides = wi.book_entry_overrides[bookName] ?? {};
  const cur = bookOverrides[uidKey] ?? (isEntryOn(bookName, { uid: uid } as EntryInfo) as boolean);
  wi.book_entry_overrides[bookName] = { ...bookOverrides, [uidKey]: !cur };
};

const bookLightClass = (book: BookInfo) => (book.active || enabledBooksSet.value.has(book.name) ? 'active' : '');

const entryStateIcon = (entry: EntryInfo) => {
  if (entry.constant) return '🔵';
  if (entry.vectorized) return '🔗';
  return '🟢';
};

const refreshAll = async () => {
  const global = [...(selected_world_info ?? [])];
  const enabledSet = new Set(chatStore.settings.world_info.enabled_books);
  const charWorld = getStCharacter(this_chid)?.data?.extensions?.world as string | undefined;
  const chatBook = typeof chat_metadata?.[METADATA_KEY] === 'string' ? chat_metadata[METADATA_KEY] : '';
  const shujukuBook = await getShujukuTargetBook();
  const result: BookInfo[] = [];
  for (const name of world_names ?? []) {
    const isGlobal = global.includes(name) && !enabledSet.has(name);
    const isCharacter = charWorld === name;
    const isChat = chatBook === name;
    const isShujuku = shujukuBook === name;
    result.push({
      name,
      source: isGlobal ? 'global' : isCharacter ? 'character' : isChat ? 'chat' : '',
      // active 只表示 ST 源激活（global/character/chat/shujuku），不把 enabledSet 算进去——
      // 否则 disableBook 只改 enabled_books 时 book.active 残留 true，书不即时移动、要等下次 refreshAll。
      // 扩展显式启用的归属由 activeBooks/inactiveBooks computed 用 live enabled_books.includes 决定。
      active: global.includes(name) || isCharacter || isChat || isShujuku,
      isShujuku,
    });
  }
  allBooks.value = result;

  const entries: Record<string, EntryInfo[]> = {};
  for (const book of result) {
    const isExtEnabled = chatStore.settings.world_info.enabled_books.includes(book.name);
    if (!book.active && !isExtEnabled) continue;
    try {
      const data = (await loadWorldInfo(book.name)) as LoadedWorldInfo;
      if (data?.entries) {
        entries[book.name] = Object.values(data.entries).map((e: any) => ({
          uid: e.uid,
          comment: e.comment ?? '',
          key: e.key ?? [],
          content: e.content ?? '',
          constant: e.constant ?? false,
          disable: e.disable ?? false,
          vectorized: e.vectorized ?? false,
        }));
      }
    } catch {
      // ignore load errors
    }
  }
  bookEntries.value = entries;
  // v22 起不再把酒馆 disable 的条目自动复制进 excluded_entries：ST 关闭状态由三态模式的
  // follow 档直接承担，excluded_entries 只存用户在本扩展里的显式条目排除（否则 force
  // 档"无视酒馆关闭条目"会被自动复制的旧数据破坏）
};

let lateRefreshTimer: ReturnType<typeof setTimeout> | undefined;

onMounted(() => {
  refreshAll();
  if (this_chid === undefined) lateRefreshTimer = setTimeout(refreshAll, 500);
  eventSource.on(event_types.CHAT_CHANGED, refreshAll);
});
onActivated(refreshAll);
onUnmounted(() => {
  if (lateRefreshTimer !== undefined) clearTimeout(lateRefreshTimer);
  eventSource.removeListener(event_types.CHAT_CHANGED, refreshAll);
});
</script>

<style scoped>
.choice-wi-editor {
  display: flex;
  flex-direction: column;
  gap: var(--choice-space-2);
}

.choice-wi-checks {
  display: flex;
  gap: var(--choice-space-4);
  flex-wrap: wrap;
}

.choice-check {
  display: inline-flex;
  align-items: center;
  gap: var(--choice-space-1);
  font-size: var(--choice-text-xs);
  color: var(--choice-text-secondary);
}

.choice-wi-count {
  font-size: var(--choice-text-xs);
  color: var(--choice-text-muted);
  font-weight: normal;
}

.choice-wi-list {
  display: flex;
  flex-direction: column;
  gap: var(--choice-space-1);
}

.choice-wi-row {
  display: flex;
  align-items: center;
  gap: var(--choice-space-2);
  padding: var(--choice-space-1) var(--choice-space-2);
  border: 1px solid var(--choice-border);
  border-radius: var(--choice-radius-sm);
  background: var(--choice-bg-card);
  cursor: pointer;
  transition: background var(--choice-transition);
}

.choice-wi-row:hover {
  background: var(--choice-bg-hover);
}

.choice-wi-row.excluded {
  opacity: 0.4;
}

.choice-wi-row.inactive {
  opacity: 0.5;
}

.choice-wi-light {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--choice-bg-element);
  flex-shrink: 0;
}

.choice-wi-light.active {
  background: var(--choice-color-success);
  box-shadow: 0 0 6px var(--choice-color-success);
}

.choice-wi-name {
  flex: 1;
  font-size: var(--choice-text-sm);
  color: var(--choice-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 来源徽章：彩色文字 + 浅底（对齐 .choice-inline-cat-badge 语义色语言），
   不再用白字硬编码底色——白字在浅底上不可读，且硬编码色不随主题切换 */
.choice-wi-badge {
  font-size: var(--choice-text-xs);
  padding: 1px var(--choice-space-2);
  border-radius: var(--choice-radius-full);
  border: 1px solid transparent;
  flex-shrink: 0;
}

.badge-global {
  color: var(--choice-color-info);
  background: var(--choice-color-info-bg);
  border-color: var(--choice-color-info-bg);
}

.badge-character {
  color: var(--choice-color-warning);
  background: var(--choice-color-warning-bg);
  border-color: var(--choice-color-warning-bg);
}

.badge-chat {
  color: var(--choice-primary);
  background: var(--choice-primary-light);
  border-color: var(--choice-primary-light);
}

.badge-shujuku {
  color: var(--choice-color-success);
  background: var(--choice-color-success-bg);
  border-color: var(--choice-color-success-bg);
}

.badge-custom {
  color: var(--choice-color-warning);
  background: var(--choice-color-warning-bg);
  border-color: var(--choice-color-warning-bg);
}

.badge-global-excl {
  color: var(--choice-text-on-primary);
  background: var(--choice-color-error);
  border-color: var(--choice-color-error);
}

.choice-wi-entries {
  margin-left: 24px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px 0 var(--choice-space-1) var(--choice-space-3);
  border-left: 1px solid var(--choice-border);
}

.choice-wi-entry {
  display: flex;
  align-items: center;
  gap: var(--choice-space-2);
  padding: 2px var(--choice-space-2);
  font-size: var(--choice-text-xs);
}

.choice-wi-entry.excluded {
  opacity: 0.3;
  text-decoration: line-through;
}

.choice-wi-entry-state {
  font-size: var(--choice-text-sm);
  flex-shrink: 0;
  width: 16px;
  text-align: center;
}

.choice-wi-entry.disabled {
  opacity: 0.4;
  filter: grayscale(1);
}

.choice-wi-entry-name {
  flex: 1;
  color: var(--choice-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.choice-wi-enable-btn {
  font-size: var(--choice-text-xs);
  padding: 1px var(--choice-space-2);
  border: 1px solid var(--choice-border-strong);
  border-radius: var(--choice-radius-sm);
  background: var(--choice-bg-element);
  color: var(--choice-text-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background var(--choice-transition),
    border-color var(--choice-transition),
    color var(--choice-transition);
}
.choice-wi-enable-btn:hover {
  background: var(--choice-color-success-bg);
  border-color: var(--choice-color-success);
  color: var(--choice-color-success);
}

.choice-empty-hint {
  color: var(--choice-text-muted);
  font-size: var(--choice-text-sm);
  padding: var(--choice-space-2) 0;
}

.choice-hint {
  color: var(--choice-text-muted);
  font-size: var(--choice-text-xs);
}

.choice-wi-global-excl {
  margin-bottom: var(--choice-space-1);
}

.choice-wi-global-excl-body {
  padding: var(--choice-space-2) 0;
  display: flex;
  flex-direction: column;
  gap: var(--choice-space-2);
}

/* 已排除列表与可添加列表同样限高滚动，防止排除上百本时撑长整页；
 * 行需 flex-shrink:0——否则 flex 列容器会把全部行压缩进限高内（无滚动条、行不可读） */
.choice-wi-global-excl-body > .choice-wi-list {
  max-height: 180px;
  overflow-y: auto;
}

.choice-wi-global-excl-body .choice-wi-row {
  flex-shrink: 0;
}

.choice-wi-row.excluded-global {
  opacity: 0.6;
  background: var(--choice-color-error-bg);
  border-color: var(--choice-color-error);
}

.choice-wi-search {
  /* 仅覆盖宽度：底色/边框/聚焦态由 global.css 的 .choice-input 提供 */
  width: 100%;
}

.choice-wi-available {
  max-height: 180px;
  overflow-y: auto;
  border: 1px solid var(--choice-border);
  border-radius: var(--choice-radius-sm);
  padding: var(--choice-space-1);
}

.choice-wi-row.available {
  cursor: pointer;
}

/* 三态钩自绘指示器：空框（off）→ 内嵌块留间隔（follow，默认）→ 框内 ☑️ 打勾（force）；横杠（custom） */
.choice-wi-mode {
  width: 14px;
  height: 14px;
  border: 1px solid var(--choice-border-strong);
  border-radius: 2px;
  background: var(--choice-bg-card);
  position: relative;
  flex-shrink: 0;
  cursor: pointer;
}

.choice-wi-mode.mode-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.choice-wi-mode-block {
  position: absolute;
  display: none;
}

.choice-wi-mode.mode-follow .choice-wi-mode-block {
  display: block;
  inset: 3px;
  background: var(--choice-text-secondary);
}

/* custom：横杠（indeterminate 样式） */
.choice-wi-mode.mode-custom .choice-wi-mode-block {
  display: block;
  inset: 5px 3px;
  background: var(--choice-text-muted);
}

.choice-wi-mode-check {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--choice-text);
}

.choice-wi-entry input[type='checkbox']:disabled {
  cursor: not-allowed;
}
</style>
