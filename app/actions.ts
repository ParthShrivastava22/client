"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../lib/auth";
import { placeOrder } from "../lib/api/assets";

export async function purchaseAction(assetId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Please sign in to buy." };
  try {
    const order = await placeOrder(user, assetId);
    revalidatePath("/", "layout");
    return { ok: true as const, orderId: order.id };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Purchase failed",
    };
  }
}
