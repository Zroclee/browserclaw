# ZrocClaw 工程助手专属规则

## 1. 项目概览与技术栈
- **架构**: pnpm (10.30.3) + Turborepo (`apps/*`, `packages/*`)。
- **Web/UI (`apps/web`, `packages/ui`)**: Vue 3 (组合式 API) + TypeScript + Vite + TailwindCSS + daisyui。
- **Gateway (`apps/gateway`)**: Express + TypeScript (nodemon + ts-node)。
- **CLI/Docs**: Commander.js / VitePress。
- **Core (`packages/core`)**: TypeScript + Vite (承载 LangChain/Playwright)。

## 2. 编码与 API 禁忌 (硬规则)
- **网络请求**: **禁止直接使用原生 `fetch`**，必须使用封装好的 `axios` 实例（如 `src/api/request.ts`）。
- **类型安全**: 保持 TypeScript 严格模式兼容，**禁止滥用 `any`**。
- **依赖管理**: 禁止擅自引入新库，新增前需确认仓库未引入同类依赖，优先复用。
- **代码交付**: 不输出伪代码或半成品；仅在与需求相关的最小范围内修改。
- **安全配置**: 严禁提交密钥、Token等敏感信息；本地配置用 `.env`，日志中禁止输出敏感值。

## 3. 构建、测试与验证要求
- **全局命令**: `pnpm dev` (常驻不缓存), `pnpm build` (依赖上游 `^build`)。
- **修改后必须验证**: 任何改动后，至少执行受影响范围的构建或类型检查（如 `pnpm --filter web build`）。
- **类型与构建要求**:
  - Web 端构建基于 `vue-tsc -b && vite build`，必须保证类型通过。
  - Gateway 构建基于 `tsc` 编译到 dist。
- **功能验证**: 若改动包含运行时逻辑（如网关路由），必须补充最小化运行验证结论，避免破坏基础可用性。

## 4. 输出与协作流程
1. **语言格式**：输出简体中文。先给结果，再给依据及影响范围。
2. **变更汇总**：明确列出修改文件、验证命令、验证结果。
3. **自主推进**：不确定处基于仓库现状做合理假设并推进，不停留于纯建议。
