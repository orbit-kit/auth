import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig: NextConfig = {
	typescript: {
		ignoreBuildErrors: false,
	},
	turbopack: {
		root: rootDir,
	},
};

export default nextConfig;
