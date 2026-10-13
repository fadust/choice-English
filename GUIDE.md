# Choice — SillyTavern Mobile Options Plugin

Asynchronously generate "action options" for SillyTavern role-playing dialogues for players to fill in/send after clicking. Based on Vue 3 + Pinia + Zod + Vite.

## Features

- **Action Option Generation**: Call the API asynchronous generation option separately, without affecting the main reply generation. Supports four behavior modes: send / cover input box / insert at cursor / append at the end
- **Item pool management**: Total item library + configuration structure, configuration can be bound to roles or chats, the priority is chat > role > default
- **Prompt word modularization**: system/user/assistant module can be dragged and dropped to sort, copy, and edit, and supports special modules for polishing
- **Suspended ball**: status indicator (Idle/Generating/Disabled), long press the shortcut menu, drag to absorb the edge
- **Input Polishing**: AI rewrites user input into multiple polished versions to choose from, supporting a fixed number or random intervals
- **Dice Judgment** (default off): AI marks the required value in the option title (`[标题|档位|70]`), when clicked, roll D100 to determine the big success/success/failure/big failure and deduce the degree. Supports DND/COC dual mode, attribute-driven demand value, NdM dice expression, and in-place reroll; the judgment result is persisted with the message, and the main reply AI is aware of the judgment context
- **Card Collection** (default level): the overlay of the judgment pipeline - weapons/spells/blessings/trial four-slot equipment + star budget, action currency economy (according to the judgment ending income and expenditure → open the package 3 and choose 1), the character theme card pool is generated in batches AI according to the plot, permanent collection + trigger wear/action currency repair
- **Action Statistics and Recommendations** (default off): counts entry participation/hits according to configuration dimensions, adopts perceptual random baselines, generates entry weight adjustment recommendations and can be applied/undone with one click; optional AI attribution correction and recommendation reasons
- **World Info Injection**: Reuse ST native `getWorldInfoPrompt`, support excluding/enabling specific books
- **Chat History Filtering**: Filter chat history by tag/regular grouping by rules
- **Theme Follow**: Automatically detect ST light/dark theme, or completely follow ST color scheme (with contrast guard)
- **Import and Export**: entry pool + configuration one-click export JSON, supports merge/replace two import modes
- **BaiBai Book memory source**: optionally enable BaiBai Book summary + status as prompt word module

## Installation

```bash
# Clone to SillyTavern plug-in directory
cd SillyTavern/public/scripts/extensions/third-party
git clone https://github.com/Junwu-Git/choice.git
```

Enable the Choice plug-in in SillyTavern extension management panel and refresh the page.

## Quick Start

1. **Configuration API**: Open Settings → API tab, add API configuration (address + key + model), click save
2. **Create an item**: Open Settings → Item Pool → Item Library, add action option items (or import an item library shared by others)
3. **Bind configuration**: Create configuration, check entries, bind to current role or chat
4. **Generate options**: Click the "Generate" button below the message. AI After generating the options, click to fill in/send

## Development

```bash
pnpm install
pnpm build # One-time packaging
pnpm watch # Development listening mode (need to refresh the browser manually)
pnpm test # vitest unit test (extraction algorithm/dice determination/option analysis/attribution/card constraints)
pnpm typecheck # vue-tsc Type Check
pnpm lint       # ESLint
```

## License

[Aladdin Free Public License v9](LICENSE)
