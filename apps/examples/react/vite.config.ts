import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const workspaceRoot = fileURLToPath(new URL("../../..", import.meta.url));
const authSdkReactEntry = fileURLToPath(
	new URL("../../../packages/auth-sdk/src/react/index.ts", import.meta.url),
);

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@orbit-kit/auth-sdk/react": authSdkReactEntry,
		},
	},
	server: {
		port: 3001,
		fs: {
			allow: [workspaceRoot],
		},
	},
});
