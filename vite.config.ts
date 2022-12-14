import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

// https://vitejs.dev/config/
export default defineConfig({
	resolve: {
		alias: {
			react: "preact/compat",
			"react-dom": "preact/compat",
		},
	},

	/** prevent vite from obscuring rust errors */
	clearScreen: false,

	/** tauri expects a fixed port */
	server: {
		strictPort: true,
	},

	/** Make use of `TAURI_PLATFORM`, `TAURI_ARCH`, `TAURI_FAMILY`,
	 * `TAURI_PLATFORM_VERSION`, `TAURI_PLATFORM_TYPE`, and `TAURI_DEBUG` env variables
	 */
	envPrefix: ["VITE_", "TAURI_"],

	plugins: [preact()],

	build: {
		target: ["es2021"],
		minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
		sourcemap: !!process.env.TAURI_DEBUG,
	},
});
