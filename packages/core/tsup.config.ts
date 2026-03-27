import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/playwright/index.ts',
    'src/fileManager/index.ts',
    'src/agents/index.ts',
    'src/scheduler/index.ts'
  ],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  // tsup 默认会将 package.json 中的 dependencies 自动作为 external 处理
  // 不需要像 vite 那样手动配置内置模块或第三方依赖
});
