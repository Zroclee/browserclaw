import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
	build: {
		lib: {
			entry: {
				index: path.resolve(__dirname, "src/index.ts"),
				playwright: path.resolve(__dirname, "src/playwright/index.ts"),
				fileManager: path.resolve(__dirname, "src/fileManager/index.ts"),
				agents: path.resolve(__dirname, "src/agents/index.ts"),
			},
			name: "@browserclaw/core",
			formats: ["es", "cjs"],
			fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
		},
		rollupOptions: {
			external: [/^@langchain/, 'langchain', 'playwright', 'zod', 'os', 'path', 'fs'],
		}
	},
});

