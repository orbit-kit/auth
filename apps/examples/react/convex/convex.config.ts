import { defineApp } from "convex/server";
import authSdk from "@orbit-kit/auth-sdk/convex.config.js";

const app = defineApp();
app.use(authSdk);

export default app;
