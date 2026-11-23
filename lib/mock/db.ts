import { randomBytes, scryptSync } from "node:crypto";
import type { Asset } from "../../types/asset";
import { MOCK_ASSETS } from "./assets";

export interface Order {
  id: string;
  userId: string;
  assetId: string;
  title: string;
  price: number; // price at purchase time, minor units
  currency: "USD";
  createdAt: string;
  status: "paid";
}
export interface Creator {
  id: string;
  displayName: string;
  bio: string;
  joinedAt: string;
}
export interface User {
  id: string;
  email: string;
  passwordHash: string;
}
interface Db {
  orders: Order[];
  sold: Record<string, number>;
  assets: Asset[];
  creators: Record<string, Creator>;
  users: Record<string, User>;
  sessions: Record<string, { userId: string; expires: number }>;
  version: number;
}

function seed(): Db {
  const salt = randomBytes(16);
  const demoHash = `${salt.toString("hex")}:${scryptSync("demo1234", salt, 64).toString("hex")}`;
  const creators: Db["creators"] = {};
  const users: Db["users"] = {};
  for (const a of MOCK_ASSETS) {
    if (creators[a.creatorId]) continue;
    creators[a.creatorId] = {
      id: a.creatorId,
      displayName: a.creatorName,
      bio: "A sample creator account for the demo.",
      joinedAt: a.createdAt,
    };
    users[a.creatorId] = {
      id: a.creatorId,
      email: `${a.creatorId}@demo.dev`,
      passwordHash: demoHash,
    };
  }
  return {
    version: VERSION,
    orders: [],
    sold: {},
    assets: structuredClone(MOCK_ASSETS),
    creators,
    users,
    sessions: {},
  };
}

// globalThis keeps the data across hot reloads in dev.
const VERSION = 2;

const g = globalThis as unknown as { __mockDb?: Db };
const existing = g.__mockDb;
export const db: Db =
  existing && existing.version === VERSION ? existing : (g.__mockDb = seed());
