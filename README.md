# Choice — English

Generate action options from prompt presets and entry pools. Keep dice rulings, cards, character bindings, option filters, and input-polishing features. English text limits count words, including contractions and Unicode names.

An English adaptation of [Junwu-Git/choice](https://github.com/Junwu-Git/choice). Original authors and public interfaces remain credited and compatible.

## Install

In SillyTavern, open **Extensions → Install extension** and enter:

```text
https://github.com/fadust/choice-English
```

Reload SillyTavern. Keep one copy of this extension enabled: the English fork uses the same settings and chat-data keys as upstream. Back up settings and chats before replacing an existing installation. A ZIP installation should be extracted into one folder under `public/scripts/extensions/third-party/`; built runtime files are already included.

## First use

Open Action Options → Settings. Add a secondary API with URL https://nano-gpt.com/api/v1, your NanoGPT key, and an available model. Select it, choose a configuration and entry pool, then Generate options. Overwrite, Append, and Insert fill the input; Send submits an option.

Generated descriptions, summaries, explanations, and actions are requested in English. Proper names, quoted evidence, JSON keys, macros, IDs, and saved structures stay unchanged. Existing custom prompts remain yours; exact built-in prompts are migrated only where a matching legacy value can be identified safely.

## Development and verification

```sh
npm ci --legacy-peer-deps
npm test
npm run i18n:check -- --strict
npm run build
# In a SillyTavern extension checkout:
npm run typecheck
```

See [the full feature guide](GUIDE.md), [localization notes](LOCALIZATION.md), and [original Chinese documentation](README.zh-CN.md).
