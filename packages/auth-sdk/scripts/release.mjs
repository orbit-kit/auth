import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(packageDir, "..", "..");
const packageJsonPath = path.join(packageDir, "package.json");
const packageJsonGitPath = "packages/auth-sdk/package.json";
const npmExecPath = process.env.npm_execpath;

const [releaseType = "patch", preid] = process.argv.slice(2);

function run(command, args, cwd) {
  execFileSync(command, args, {
    cwd,
    stdio: "inherit",
  });
}

function runNpm(args, cwd) {
  if (npmExecPath) {
    run(process.execPath, [npmExecPath, ...args], cwd);
    return;
  }

  run(process.platform === "win32" ? "npm.cmd" : "npm", args, cwd);
}

function readVersion() {
  return JSON.parse(readFileSync(packageJsonPath, "utf8")).version;
}

function finalizeRelease(version) {
  run("git", ["add", packageJsonGitPath], repoRoot);
  run("git", ["commit", "-m", `release(auth-sdk): v${version}`], repoRoot);
  run("git", ["tag", `v${version}`], repoRoot);
  run("git", ["push", "--follow-tags"], repoRoot);
}

if (releaseType === "resume") {
  const currentVersion = readVersion();
  finalizeRelease(currentVersion);
  console.log(`Published existing @orbit-kit/auth-sdk version ${currentVersion}`);
  process.exit(0);
}

const beforeVersion = readVersion();
const npmArgs = [
  "version",
  releaseType,
  "--no-git-tag-version",
  "--workspaces-update=false",
];

if (preid) {
  npmArgs.push("--preid", preid);
}

runNpm(npmArgs, packageDir);

const nextVersion = readVersion();

if (nextVersion === beforeVersion) {
  throw new Error(`Version did not change: ${beforeVersion}`);
}

finalizeRelease(nextVersion);

console.log(`Released @orbit-kit/auth-sdk ${beforeVersion} -> ${nextVersion}`);
