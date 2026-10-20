import type { auth } from "./auth";

export type User = typeof auth.$Infer.Session.user;
