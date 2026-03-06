import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig({
	server: {
		port: 5000,
	},
	resolve: {
		alias: {
			"@": fileURLToPath(new URL(".", import.meta.url)),
		},
	},
	plugins: [
		tailwindcss(),
		tsconfigPaths(),
		tanstackStart({
			srcDirectory: ".",
			router: {
				routesDirectory: "app",
			},
		}),
		react(),
	],
});
