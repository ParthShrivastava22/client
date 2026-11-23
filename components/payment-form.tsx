"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { purchaseAction } from "../app/actions";

const digits = (s: string) => s.replace(/\D/g, "");
const group = (s: string) => s.replace(/(.{4})(?=.)/g, "$1 ");
const fmtExp = (s: string) => {
  const d = digits(s).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};
const luhn = (n: string) => {
  let sum = 0;
  [...n].reverse().forEach((c, i) => {
    let d = Number(c);
    if (i % 2) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  });
  return sum % 10 === 0;
};
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Values = { name: string; number: string; exp: string; cvc: string };

function validate(v: Values) {
  const e: Partial<Record<keyof Values, string>> = {};
  if (v.name.trim().length < 2) e.name = "Enter the name on the card.";
  const n = digits(v.number);
  if (n.length !== 16 || !luhn(n))
    e.number = "Enter a valid 16-digit card number.";
  const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(v.exp);
  const now = new Date();
  if (
    !m ||
    (2000 + Number(m[2])) * 12 + Number(m[1]) <
      now.getFullYear() * 12 + now.getMonth() + 1
  )
    e.exp = "Enter a valid future date (MM/YY).";
  if (!/^\d{3}$/.test(v.cvc)) e.cvc = "Enter the 3-digit security code.";
  return e;
}

export function PaymentForm({
  assetId,
  total,
}: {
  assetId: string;
  total: string;
}) {
  const router = useRouter();
  const [v, setV] = useState<Values>({
    name: "",
    number: "",
    exp: "",
    cvc: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>(
    {},
  );
  const [busy, setBusy] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate(v);
    setErrors(err);
    if (Object.keys(err).length) return;
    setBusy("Contacting your bank…");
    await wait(900);
    setBusy("Confirming payment…");
    await wait(900);
    const res = await purchaseAction(assetId); // only the asset id leaves the browser
    if (res.ok) {
      toast.success("Payment complete");
      router.push(`/orders?new=${res.orderId}`);
    } else {
      toast.error(res.error);
      setBusy(null);
    }
  }

  const field = (
    k: keyof Values,
    label: string,
    props: React.ComponentProps<"input">,
  ) => (
    <div className="px-field">
      <label htmlFor={k}>{label}</label>
      <input
        id={k}
        value={v[k]}
        disabled={!!busy}
        aria-invalid={!!errors[k]}
        aria-describedby={errors[k] ? `${k}-err` : undefined}
        {...props}
        onChange={(e) =>
          setV((p) => ({
            ...p,
            [k]: props.name === "exp" ? fmtExp(e.target.value) : e.target.value,
          }))
        }
      />
      {errors[k] && (
        <span className="px-err" id={`${k}-err`}>
          {errors[k]}
        </span>
      )}
    </div>
  );

  const shown = group((digits(v.number) + "•".repeat(16)).slice(0, 16));

  return (
    <form className="px-form" onSubmit={submit} noValidate>
      <div className="px-cardprev" aria-hidden="true">
        <span className="px-chip" />
        <span className="px-cardnum">{shown}</span>
        <span className="px-cardmeta">
          <span>{v.name || "Name on card"}</span>
          <span>{v.exp || "MM/YY"}</span>
        </span>
      </div>

      {field("name", "Name on card", {
        name: "name",
        autoComplete: "cc-name",
        placeholder: "Alex Doe",
      })}
      {field("number", "Card number", {
        name: "number",
        autoComplete: "cc-number",
        inputMode: "numeric",
        placeholder: "4242 4242 4242 4242",
        onInput: (e) => {
          e.currentTarget.value = group(
            digits(e.currentTarget.value).slice(0, 16),
          );
        },
      })}
      <div className="px-row2">
        {field("exp", "Expiry", {
          name: "exp",
          autoComplete: "cc-exp",
          inputMode: "numeric",
          placeholder: "MM/YY",
          maxLength: 5,
        })}
        {field("cvc", "CVC", {
          name: "cvc",
          autoComplete: "cc-csc",
          inputMode: "numeric",
          placeholder: "123",
          maxLength: 3,
        })}
      </div>

      <button
        className="px-btn"
        type="submit"
        disabled={!!busy}
        aria-live="polite"
      >
        {busy ?? `Pay ${total}`}
      </button>
    </form>
  );
}
