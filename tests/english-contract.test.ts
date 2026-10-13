import { describe, expect, it } from 'vitest';
import { parseOptionType, parseOptionStyle, parseOptionRate } from '../src/util/option-format';
import { localizeBuiltins } from '../src/util/localize-builtins';
import original from '../localization/builtin-prompts.json';
import translated from '../choice-prompts-optimized.json';
import type { GlobalSettings } from '../src/type/settings';

describe('English option and saved-prompt contracts', () => {
  it('parses English risk labels without changing the title or legacy labels', () => {
    const text = '[Ask Rowan O’Connor|Balanced|DC 55] "Rowan, may I borrow the archive key?"';
    expect(parseOptionType(text)).toBe('Ask Rowan O’Connor');
    expect(parseOptionStyle(text)).toBe('balanced');
    expect(parseOptionRate(text)).toBe(55);
    expect(parseOptionStyle('[询问|平衡|55]正文')).toBe('balanced');
  });
  it('localizes untouched built-ins and preserves user edits and IDs', () => {
    const builtIn = { ...original[0] };
    const custom = { ...original[0], content: 'My custom prose rule.', name: 'My custom name' };
    const settings = { configs: [], prompt_configs: [{ modules: [custom] }], prompt_rules: { modules: [builtIn] } } as unknown as GlobalSettings;
    expect(localizeBuiltins(settings)).toBe(true);
    expect(builtIn.id).toBe(original[0].id);
    expect(builtIn.content).toBe(translated.modules[0].content);
    expect(custom.content).toBe('My custom prose rule.');
    expect(custom.name).toBe('My custom name');
    expect(localizeBuiltins(settings)).toBe(false);
  });
  it('preserves every built-in prompt macro', () => {
    const macros = (text: string) => [...text.matchAll(/\{\{[^}]+\}\}/g)].map(match => match[0]).sort();
    for (const entry of original) {
      const current = translated.modules.find(module => module.id === entry.id)!;
      expect(macros(current.content), entry.id).toEqual(macros(entry.content));
    }
  });
});
