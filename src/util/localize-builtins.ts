import original from '../../localization/builtin-prompts.json';
import translated from '../../choice-prompts-optimized.json';
import type { GlobalSettings, PromptModule } from '@/type/settings';

export function localizeBuiltins(settings: GlobalSettings): boolean {
  let changed = false;
  for (const config of settings.configs) {
    if (config.is_default && config.name === '默认配置') {
      config.name = 'Default Configuration';
      changed = true;
    }
  }
  const collections = [settings.prompt_rules.modules, ...settings.prompt_configs.map(config => config.modules)];
  for (const modules of collections) for (const module of modules) {
    const old = original.find(item => item.id === module.id);
    const current = translated.modules.find(item => item.id === module.id);
    if (!old || !current) continue;
    for (const key of ['name', 'content'] as const) {
      if (old[key] && module[key] === old[key]) {
        module[key] = current[key] as PromptModule[typeof key];
        changed = true;
      }
    }
  }
  return changed;
}
