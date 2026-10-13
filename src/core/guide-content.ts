/**
 * 引导内容单一来源：章节化向导步骤 + 各功能页/弹窗的 ❓ 页内指引。
 *
 * 此前步骤文案、tab 指引（tab-definitions 的 GUIDE_CONTENTS）与弹窗内嵌
 * guideHtml 三处平行维护，已经出现说法漂移（外观页新旧两版主题描述并存、
 * 「自动生成仅对当前聊天生效」这类与实现相反的描述）。归并到本模块后，
 * 向导章节与页内指引共用同一份数据——改文案只改这里，不会再漂。
 *
 * 结构上只依赖 onboarding.ts 的 OnboardingStep 类型（type-only import，
 * 不构成运行时循环）；onboarding.ts 反向 import 本模块的章节数据。
 */
import type { TabId } from '@/components/shared/tab-definitions';
import { ADVANCED_TAB_IDS } from '@/components/shared/tab-definitions';
import type { OnboardingStep } from '@/core/onboarding';
import { resolveCustomApi, lastOptionsGeneratedAt } from '@/core/generator';
import { useGlobalSettingsStore } from '@/store/global-settings';
import { pinia } from '@/pinia';

/** 功能课堂章节：原 22 步全流程向导按功能域拆分归档，quick-start 是唯一默认路径 */
export interface GuideChapter {
  id: 'quick-start' | 'pool' | 'generation' | 'prompt' | 'worldinfo' | 'filter' | 'appearance';
  icon: string;
  title: string;
  /** 章节菜单里的一行简介 */
  brief: string;
  steps: OnboardingStep[];
}

/**
 * 进阶章判定：id 落在高级 tab 集合内的章节。复用 tab-definitions 的
 * ADVANCED_TAB_IDS——tab 与章节的进阶划分必须同步演进，两处各写一份迟早漂移。
 * debug 无章节，天然覆盖不到；quick-start/pool/generation/appearance 是基础章。
 */
export const isAdvancedChapter = (id: GuideChapter['id']): boolean =>
  (ADVANCED_TAB_IDS as readonly string[]).includes(id);

const isApiReady = (): boolean => {
  const gs = useGlobalSettingsStore(pinia);
  return !!resolveCustomApi(gs.settings.active_api_id, gs.settings.apis);
};

export const GUIDE_CHAPTERS: GuideChapter[] = [
  {
    id: 'quick-start',
    icon: 'fa-solid fa-rocket',
    title: 'Get started quickly',
    brief: 'Configure API and generate the first set of options, running through the core link in three minutes',
    steps: [
      {
        id: 'welcome',
        icon: 'fa-solid fa-chess',
        title: "Welcome to Action Options",
        html: "<p>Generate possible next actions separately from the main chat. Clicking an option can send it, replace your input, append it, or insert it at the cursor.</p><p>Start by configuring an API, selecting entries, and generating options. Use the graduation-cap button to explore other features whenever you need them.</p>",
        target: '[data-tour="settings-header"]',
      },
      {
        id: 'api-fill',
        icon: 'fa-solid fa-plug',
        title: "Step 1: Configure your API",
        html: "<p>Choice uses its own <strong>OpenAI-compatible API configuration</strong>. It can use a different connection from your main SillyTavern chat.</p><p>Enter a configuration name, base URL, key, and model. Use <strong>Fetch</strong> to load available models. The default temperature and token limit are a good starting point.</p>",
        tab: 'api',
        target: '[data-tour="api-form"]',
      },
      {
        id: 'api-save',
        icon: 'fa-solid fa-floppy-disk',
        title: "Step 1: Save the connection",
        html: "<p>Click <strong>Save</strong> to apply the connection. Leaving the page does not save an unfinished form.</p><p>Once the connection is saved, the status indicator confirms this step and the guide moves on.</p>",
        target: '[data-tour="api-save"]',
        done: isApiReady,
      },
      {
        id: 'pool-ready',
        icon: 'fa-solid fa-layer-group',
        title: "Step 2: Check your entries",
        html: "<p>The <strong>Entry Library</strong> contains writing directions. The active <strong>configuration</strong> chooses which entries can be used.</p><p>A new installation includes examples and a default configuration. If the panel reports an empty pool, use <strong>Select Entries</strong> to add entries to that configuration. You can customize or import entries later.</p>",
        tab: 'pool',
        target: '[data-tour="pool-library"]',
      },
      {
        id: 'run-generate',
        icon: 'fa-solid fa-wand-magic-sparkles',
        title: "Generate your first options",
        html: "<p>Close Settings with <strong>×</strong>, then click the generation icon in the Action Options panel beneath an AI reply. Automatic generation runs after new replies when enabled.</p><p>If no AI reply exists yet, begin the chat first. Generation also needs a saved API connection and a nonempty active entry selection.</p>",
        done: () => lastOptionsGeneratedAt.value > 0,
      },
      {
        id: 'done',
        icon: 'fa-solid fa-flag-checkered',
        title: "Ready to play",
        html: "<p>Your connection and entry selection are ready. Click an action option to use it with the behavior you selected.</p><p>The question-mark button explains the current page. The graduation-cap button opens the feature guide by chapter.</p>",
      },
    ],
  },
  {
    id: 'pool',
    icon: 'fa-solid fa-layer-group',
    title: 'Entry Pool',
    brief: 'Two-layer structure of item library and configuration, check items in the configuration',
    steps: [
      {
        id: 'pool-concept',
        icon: 'fa-solid fa-layer-group',
        title: "Library and configurations",
        html: "<p>The <strong>library</strong> stores each entry’s title, content, rules, and category. A <strong>configuration</strong> selects entries and overrides their weight or pinned status.</p><p>Configurations can be bound to a chat or character. Priority is <strong>chat → character → default</strong>; the winning configuration replaces the others.</p>",
        tab: 'pool',
        target: '[data-tour="pool-library"]',
      },
      {
        id: 'pool-open',
        icon: 'fa-solid fa-database',
        title: "Explore the Entry Library",
        html: "<p>Open the library to search entries, filter categories, edit content, and create or remove entries. You can also import and export entries.</p><p>Editing an entry changes the shared library item used by every configuration that references it.</p>",
        action: 'pool-library',
        target: '[data-tour="entrypool-toolbar"]',
      },
      {
        id: 'pool-add',
        icon: 'fa-solid fa-list-check',
        title: "Select entries for a configuration",
        html: "<p>Choose or create a configuration, then open <strong>Select Entries</strong>. Select the library entries you want available for generation.</p><p>This creates references to the original entries, keeping the library as the single source of content.</p>",
        target: '[data-tour="pool-add"]',
        action: 'close-all',
      },
      {
        id: 'pool-select',
        icon: 'fa-solid fa-square-check',
        title: "Adjust the selected entries",
        html: "<p>Confirm your selection, then enable or disable entries, change their weights, or pin entries that must appear.</p><p>Higher weight increases the chance of selection; pinning makes inclusion mandatory. The configuration can be bound to the current character or chat.</p>",
        action: 'pool-select-entries',
        target: '[data-tour="select-entries-list"]',
      },
    ],
  },
  {
    id: 'generation',
    icon: 'fa-solid fa-bolt',
    title: 'Generation and click behavior',
    brief: 'Automatic generation, three modes of click behavior, quantity and Character count',
    steps: [
      {
        id: 'gen-auto',
        icon: 'fa-solid fa-bolt',
        title: "Automatic options and input polishing",
        html: "<p>Automatic generation produces options after an AI reply. You can turn it off and generate manually whenever you prefer.</p><p><strong>Polish Input</strong> creates alternative wording for your current input. It uses a separate option history, so polishing does not replace action suggestions.</p>",
        tab: 'generation',
        target: '[data-tour="gen-auto"]',
      },
      {
        id: 'gen-behavior',
        icon: 'fa-solid fa-paper-plane',
        title: "Choose what a click does",
        html: "<p>Select <strong>Send</strong>, <strong>Replace Input</strong>, <strong>Insert at Cursor</strong>, or <strong>Append</strong>.</p><p>Replace or Insert lets you review and edit an option before sending it. Send submits it immediately.</p>",
        target: '[data-tour="gen-behavior"]',
      },
      {
        id: 'gen-count',
        icon: 'fa-solid fa-sliders',
        title: "Count, word limits, and perspective",
        html: "<p>Choose a fixed option count or a random range. Sampling can include extra candidates before the final set is produced.</p><p>Set the <strong>word range</strong> separately for action options and polished input. Choose the narrative perspective for each; existing chat prose does not override your selection.</p>",
        target: '[data-tour="gen-count"]',
      },
    ],
  },
  {
    id: 'prompt',
    icon: 'fa-solid fa-align-left',
    title: 'prompt word',
    brief: 'Sorting, starting, stopping and editing of modular prompt words',
    steps: [
      {
        id: 'prompt-intro',
        icon: 'fa-solid fa-align-left',
        title: "Build the generation prompt",
        html: "<p>Prompts are assembled from ordered system, user, and assistant modules. Enable, edit, duplicate, or reorder modules to change the request.</p><p>Background, character information, World Info, and chat history supply context. Rules and output-format modules define what the model should produce. Keep JSON keys, tags, and macros intact.</p>",
        tab: 'prompt',
        target: '[data-tour="prompt-toolbar"]',
      },
    ],
  },
  {
    id: 'worldinfo',
    icon: 'fa-solid fa-book',
    title: 'World Info',
    brief: 'Injection switch, global exclusion and book-by-book three-state selection',
    steps: [
      {
        id: 'wi-enable',
        icon: 'fa-solid fa-book',
        title: "Include World Info",
        html: "<p>Enable World Info to supply relevant setting details. Choice uses SillyTavern’s own activation and injection rules.</p><p>Optional integration modules provide BaiBai Book or other supported memory sources when those extensions are available.</p>",
        tab: 'worldinfo',
        target: '[data-tour="wi-checks"]',
      },
      {
        id: 'wi-exclude',
        icon: 'fa-solid fa-ban',
        title: "Exclude unwanted books",
        html: "<p>Exclude a book when its content should not influence action suggestions. The setting affects Choice’s request, rather than permanently editing the book.</p><p>Generation restores temporary World Info changes after assembling the request.</p>",
        target: '[data-tour="wi-excl"]',
      },
      {
        id: 'wi-books',
        icon: 'fa-solid fa-list',
        title: "Choose how each book participates",
        html: "<p>Use <strong>Off</strong> to exclude a book, <strong>Follow</strong> for its normal enabled entries, <strong>Force</strong> for all entries, or <strong>Custom</strong> to select individual entries.</p><p>Expand a book to inspect its entries and change selections.</p>",
        target: '[data-tour="wi-books"]',
      },
    ],
  },
  {
    id: 'filter',
    icon: 'fa-solid fa-filter',
    title: 'filter',
    brief: 'Tag extraction: One-click extraction of tag content; advanced cleaning of three partitions and regular library; top switch controls whether to use the pub regular first',
    steps: [
      {
        id: 'filter-zones',
        icon: 'fa-solid fa-filter',
        title: "Filter the chat history",
        html: "<p>Filtering is organized into rule groups. Tag extraction chooses the narrative blocks to keep; other enabled rules remove or transform unwanted text.</p><p>Use filters to omit status panels or technical blocks from generation while preserving the actual chat.</p>",
        tab: 'filter',
        target: '[data-tour="filter-extract-quick"]',
        action: 'close-all',
      },
      {
        id: 'filter-library-open',
        icon: 'fa-solid fa-code',
        title: "Reuse regex rules",
        html: "<p>The regex library stores reusable rules. Rule groups reference those rules or contain inline rules.</p><p>Edit a library rule once to update every group that references it.</p>",
        action: 'filter-library',
        target: '[data-tour="regexlib-toolbar"]',
      },
      {
        id: 'filter-st-import',
        icon: 'fa-solid fa-cloud-arrow-down',
        title: "Import SillyTavern regex rules",
        html: "<p>Open the import dialog to select rules from SillyTavern. Review the pattern, replacement, and enabled state before importing.</p><p>Imported copies belong to Choice and can be adjusted independently.</p>",
        target: '[data-tour="regexlib-st-import"]',
      },
      {
        id: 'filter-reference',
        icon: 'fa-solid fa-book-open',
        title: "Add a rule to a group",
        html: "<p>Choose a library rule or create an inline rule, then add it to the desired group. Enable the group and arrange its rules in the order you want them applied.</p><p>Disabling a group preserves its rules for later use.</p>",
        action: 'close-all',
        target: '[data-tour="filter-group-addlib"]',
      },
    ],
  },
  {
    id: 'appearance',
    icon: 'fa-solid fa-palette',
    title: 'Appearance',
    brief: 'Floating ball, panel docking position, theme and font',
    steps: [
      {
        id: 'appearance-panel',
        icon: 'fa-solid fa-window-maximize',
        title: "Place and size the controls",
        html: "<p>Choose the options panel position, whether it stays expanded, and how it follows new messages.</p><p>The floating button can be moved and resized. Its quick menu gives access to generation, polishing, and settings.</p>",
        tab: 'appearance',
        target: '[data-tour="appearance-floating"]',
      },
      {
        id: 'appearance-theme',
        icon: 'fa-solid fa-palette',
        title: "Theme and text size",
        html: "<p>Follow SillyTavern’s colors or choose a built-in theme. Set font size and spacing to suit your device.</p><p>Long English labels and names wrap on narrow screens; important buttons remain reachable.</p>",
        target: '[data-tour="appearance-theme"]',
      },
    ],
  },
];

/** ❓ 页内指引：一句话说明 + 要点列表，替代此前的 HTML 长文（结构化渲染，无 v-html） */
export interface PageHint {
  icon: string;
  title: string;
  /** 一句话说明本页是干什么的 */
  brief: string;
  /** 要点列表 */
  points: string[];
}

export const PAGE_HINTS: Record<TabId, PageHint> = {
  pool: {
    icon: 'fa-solid fa-layer-group',
    title: 'Entry Pool',
    brief: 'Entry pool = entry library (stores all entries) + configuration (determines which entries are extracted from this generation).',
    points: [
      'The configuration selects items from the item library. When generating, AI extracts items from the currently effective configuration as writing materials.',
      'Configuration can be bound to chat or role, priority: chat binding > role binding > default configuration, hit and use, not merged.',
      'Operation process: Create new configuration → Check "Add entry" → Bind chat/role, it will automatically take effect next time it is generated.',
      'The new installation has a set of sample entries and default configuration built-in, ready to use out of the box; the entry library supports import/export and group management.',
    ],
  },
  generation: {
    icon: 'fa-solid fa-bolt',
    title: 'Generate',
    brief: 'Control how options are generated and what happens after clicking one.',
    points: [
      'Automatically generated (global setting, effective for all chats): A set of options will automatically appear after each AI reply is completed, no need to click manually.',
      'Input polishing: Rewrite your input into multiple polished versions for selection before sending, and the selected one will be sent out.',
      'Click behavior: send = send directly; overwrite = replace the content of the input box (you can change it first and then send); append = append to the end of the input box; insert = insert at the cursor (keep the existing content).',
      'The click behavior is synchronized with the toggle button at the head of the options panel and can be changed at any time during chat.',
      'The quantity supports fixed values or intervals (such as 3-6 = random each time); further down, there is also the word number and person perspective of each item.',
    ],
  },
  prompt: {
    icon: 'fa-solid fa-align-left',
    title: 'prompt word',
    brief: 'The option content is driven by modular prompt words, and the default configuration is available out of the box; the module content seen in the editor is the prompt word actually sent to AI.',
    points: [
      'Modules are segmented by role: system = system command, user = material and context, assistant = format start (the default modules are all system, which does not rely on model pre-filling capabilities; if you want a pre-filling effect, you can change the role of individual modules to assistant and lay out the beginning of the reply in advance); you can drag and drop to sort, start, stop, and edit.',
      'The default prompt words have incorporated basic principles such as scene anchoring, information boundaries, and directional differences into core rules, and are no longer split into a row of superimposed rule switches; edit the core rules directly when changes are needed.',
      'Tavern macros such as {{user}} are still replaced by SillyTavern engine (executed equally in each character module); the plug-in\'s own placeholders (such as {{count}}, {{pool_selected}}) will be replaced with the actual values of this round before being sent.',
      'The number of context rounds determines how many history messages are brought to the AI generation option.',
      '🔒 Marked non-editable modules are automatically managed by the system (injections such as World Info entries, character descriptions, etc.).',
      'Anti-duplication: Prompt words will no longer be injected into the previous round of options (anti-pollution). After generation, options that are duplicates of the previous AI floor/current floor will be automatically eliminated - the same title will only be eliminated if the content is similar. Different titles will be judged based on text similarity and will be automatically filled in if insufficient (up to 2 round).',
    ],
  },
  api: {
    icon: 'fa-solid fa-plug',
    title: 'API',
    brief: 'A separate AI interface used to configure generation options, independent of the API used to talk to SillyTavern owner.',
    points: [
      'Four items are required: configuration name, API address (OpenAI compatible interface), key, and model name.',
      'After filling in the address, click "Pull" to automatically obtain a list of available models. Click to select.',
      '⚠️ You must click "Save" after modification to take effect. Switching pages or closing the window will not save automatically.',
      'Options cannot be generated when API is not configured (the floating ball will dim the prompt).',
    ],
  },
  worldinfo: {
    icon: 'fa-solid fa-book',
    title: 'World Info',
    brief: 'Control which World Info entries are injected into the prompt words generated by the options, so that the options fit the world view.',
    points: [
      '"Enable World Info" is the master switch. If it is turned off, it will not be injected at all.',
      'Each book has a three-state cycle: Off (no participation at all) → Follow (enabled by tavern entry) → Forced (all participation); expand the book title to enter custom check items one by one.',
      '"Globally excluded" books will never be referenced in all chats and can be removed and revoked at any time.',
      '🔵 Blue light = resident entry (always injected), 🟢 Green light = keyword triggered (injected on match).',
      'The injection target World Info of SP·Database needs to turn on the "Database" switch on the prompt word page to participate in option generation: blue light index/summary entries are always injected, green light memory entries are activated by keyword hits, and the scanning depth is consistent with SillyTavern owner\'s generation. Books bound to chat will display the "Chat" badge on this page, and the "Database" switch can explicitly control the participation of the target book.',
      'After creating/deleting the World Info, click "Refresh List" to synchronize the changes on SillyTavern side.',
    ],
  },
  filter: {
    icon: 'fa-solid fa-filter',
    title: 'filter',
    brief: 'Clean chat records according to rules before generation. Newbies use the "Tag Extraction" at the top, and the switch at the top of the page controls whether to take SillyTavern rule first.',
    points: [
      'In "Tag Extraction" (top of page), only fill in the tag name: fill in "Text" to keep the <Text>...</Text> paragraph and send it to AI, and discard the rest; multiple extractions are combined.',
      '"Go to SillyTavern rules" switch: On (default) = First go through SillyTavern global/default/character card rules, and then go through the rules on this page; Off = Only use the rules on this page, escape hatch: Default rules clear the old layer. Turn off when user input causes assistant to be merged.',
      'The extraction function is only in the quick area at the top of the page, with independent storage and independent start and stop - the three regular partitions and the regular library only perform "filtering" (deletion/replacement), and no extraction rules appear.',
      'The execution order is constant: extract first, then filter - the partition rules continue to delete unnecessary parts of the extraction results, and the two work together without fighting.',
      'Three zones: global regular zone (always in effect), default regular zone (switched with SillyTavern default), and character card regular zone (switched with the character card).',
      'Groups that do not belong to the current preset/role will be displayed semi-transparently and will not take effect. The top status bar displays the number of groups that are actually currently in effect.',
      'The rules are centrally stored in the regular library and need to be referenced by the group in the partition to take effect; inline rules (label matching/regular) can also be added directly to the group.',
      '"Import from SillyTavern" can batch import existing rules from the global/default/character card areas of SillyTavern.',
    ],
  },
  stats: {
    icon: 'fa-solid fa-ranking-star',
    title: 'Statistics',
    brief: 'The generation/selection count, trends and rankings of action options support dimensional viewing and one-click application of preferred recommendations by item pool configuration.',
    points: [
      'The statistics dimension can be switched at the top: "Global" (all configurations are mixed and accumulated) or a certain entry pool configuration (only sessions in which this configuration is effective are counted); sessions that are not bound to any configuration are recorded separately in the "Unbound Configuration" file.',
      'Only action options view: AI Options successfully generated and displayed in each round are not counted as generated, and the user clicks Apply to count the selection; polish (enrich) is not counted at all.',
      '"Trend" displays generated/selected activities by day (7/30 days can be switched, and the dimension can be selected at will), accumulated since v51, and the history is not backfilled; the card provides the number of active days, pool participation rate and the latest statistical time.',
      'Comparison of entry list hit rate and "expectation": Expectation = random benchmark calculated based on the number of options in each round (25% when 4 entries, 10% when 10 entries), the more it is higher than the expectation, the more worthy of a power increase, the more lower than the expectation, the more worthy of a downgrade; a single configuration dimension also shows the hit rate of the nearly 10 round window (50 round rolling window).',
      'The insight label only prompts that the weight should not be changed, but can be applied with one click: sufficient samples (≥10 rounds) and significantly lower than expectations → "candidate downweight", significantly higher than expectations → "good performance", items with lower than default weights will automatically propose "weight recovery" when neutral and gradually recover; automation will never automatically deactivate items (only adjust weights). Click the check mark next to the label or "Apply all suggestions" to write the weight modification into the current configuration (can be undone).',
      '"Sample Distribution" displays three levels of samples according to the current dimension\'s effective pool: sufficient/insufficient/never participated. The higher the sufficient proportion, the more credible the optimization suggestions are.',
      '"Export JSON" downloads complete statistics (total amount of each dimension, daily count, item statistics and item database join information); "Clear Statistics" clears all dimensions and is irrevocable.',
    ],
  },
  library: {
    icon: 'fa-solid fa-layer-group',
    title: 'Card Library',
    brief: 'The cards you own: can be equipped into the deck, and the cards drawn repeatedly will be automatically converted into action coins.',
    points: [
      'Only the cards you already own are listed here (including built-in/set/character theme cards), showing star rating, type, trigger conditions and effects.',
      'Cards are permanently collected and will not be damaged; when you open a card pack and draw an already owned card, it will automatically be converted into a small amount of action coins.',
      'To see the full set of illustrations and collection progress for cards you don’t own, go to the “Collection” page.',
    ],
  },
  deck: {
    icon: 'fa-solid fa-table-cells',
    title: 'deck',
    brief: 'Edit 4 type slots (1 each for weapons/spells/blessings/trials) according to the currently effective entry pool configuration, subject to star budget constraints (3 stars ≤ 2/4 stars ≤ 1/5 stars ≤ 1).',
    points: [
      'Automatic grouping is on by default: the 4 slot is automatically filled from existing cards, with zero management; the slot position can be manually adjusted.',
      'The largest number of 1 cards of its kind; 3 star ≤ 2, 4 star ≤ 1, 5 star ≤ 1, structurally preventing strong card stack explosion.',
      'When clicking the option judgment, the equipped card will apply effects when the trigger conditions are met.',
      'When a novice starts the game for the first time, 4 basic cards will be automatically issued to make the deck immediately full.',
    ],
  },
  collection: {
    icon: 'fa-solid fa-box-archive',
    title: 'Collection',
    brief: 'Collection progress, illustrations and achievements: See all available cards and collect sets to unlock special effects.',
    points: [
      'Collection progress: statistics on the number of collected/collectable cards and the distribution of each star level; the built-in card library is a complete illustration.',
      'Action coins are at the top of the page: click on the option to determine the increase or decrease according to the ending (big success + 5/success + 2/failure-1/big failure-3). If you save enough 5 coins, you can open a card pack (for 3, choose 1, including character theme cards).',
      'Set collection: Each set displays the collection progress. Collecting one set will unlock its special effects (triggered when ≥2 complete sets of cards are equipped).',
      'Achievements: Automatically celebrate once when all collections of a single type, collection milestones, and sets are completed (the historical backlog only records and does not replay).',
      'Currency and collections both belong to the global progress layer, and "Clear Statistics" will not clear them.',
    ],
  },
  appearance: {
    icon: 'fa-solid fa-palette',
    title: 'Appearance',
    brief: 'Floating window, chat interface panel, theme and font size.',
    points: [
      '"Suspended Window" area: Switch controls the floating ball in the lower right corner of the screen; click to bring up the options pop-up window or exit settings (right-click/long press to view options or enter settings).',
      '"Chat interface" area: option panel switch (after closing, use the floating ball pop-up window to view options, input polishing and synchronization hiding), docking position (in the chat/above the input box), magic wand menu entrance.',
      '"Advanced Functions" area: Show and hide switches for advanced sub-areas such as prompt words, World Info, filtering, and debugging.',
      'The theme has five modes: automatic (detecting the light and dark of SillyTavern), following SillyTavern color matching, forced dark/bright color, and 4 independent preset themes (dusk/cherry blossom/celadon/honey).',
      'The font defaults to follow the device (small size for mobile phone, medium size for desktop). Click the specific gear to fix it, and click "Automatic" to restore it.',
    ],
  },
  debug: {
    icon: 'fa-solid fa-gear',
    title: 'Debugging',
    brief: 'Version and statistical information, factory reset.',
    points: [
      'Displays the current data version and statistical information such as modules and entries.',
      'Factory reset will delete all settings and return to the initial state of the plug-in. ⚠️ It is irrevocable. Please export the prompt word backup before executing.',
    ],
  },
};

/** 弹窗级 ❓ 指引（EntryPoolDialog / RegexLibraryDialog 各自引用） */
export const DIALOG_HINTS: { entryPool: PageHint; regexLibrary: PageHint } = {
  entryPool: {
    icon: 'fa-solid fa-database',
    title: 'Entry Library',
    brief: 'The general warehouse of all action option entries, managed by groups; entries in the configuration are checked and referenced from here.',
    points: [
      'Click the group name to expand/collapse, click + next to the group name to add an entry, 📋 to copy the entire group; empty groups will be automatically cleared when the pop-up window is closed.',
      'Supports dragging items across groups and dragging ☰ to adjust order.',
      'After checking the checkbox, click "Export File" to export only the checked items (unchecked, all will be exported).',
      'Modifying the entry library will synchronously affect all configurations that reference the entry.',
    ],
  },
  regexLibrary: {
    icon: 'fa-solid fa-code',
    title: 'Regex Library',
    brief: 'Centralized storage of all filtering rules, managed by groups, for reference by filtering partitions.',
    points: [
      'Click the group name to expand/collapse, drag the left handle to sort the group or drag items into other groups; + next to the group name to add a rule.',
      'There are two types of rules: tag matching (stripping tag pairs), regular expressions (supporting replacement); "Extract" is not in the library/partition, only at the top of the filter page.',
      'Top toolbar: Expand/collapse all, create new group, import/export files, "Import from tavern".',
      '"Import from SillyTavern" can select the existing regular rules from the three areas of SillyTavern global/default/character card to import in batches.',
      'The regular rules in the library will not take effect directly. They need to participate in filtering after the "Filter" page is referenced by the group in the partition.',
    ],
  },
};
