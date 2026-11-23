"use client";

import { useActionState, useState } from "react";
import type { FormState } from "../app/sell/actions";
import type { Asset } from "../types/asset";
import { CATEGORIES } from "../types/asset";
import { CATEGORY_LABELS } from "../lib/asset-utils";

function initialValues(a?: Asset): Record<string, string> | undefined {
  if (!a) return undefined;
  return {
    title: a.title,
    description: a.description,
    category: a.category,
    price: (a.price / 100).toFixed(2),
    availability:
      a.editionLimit === null
        ? "unlimited"
        : a.editionLimit === 1
          ? "exclusive"
          : "limited",
    limit: a.editionLimit && a.editionLimit > 1 ? String(a.editionLimit) : "",
    tags: (a.tags ?? []).join(", "),
    formats: (a.fileFormats ?? []).join(", "),
    tools: (a.compatibleWith ?? []).join(", "),
  };
}

export function ListingForm({
  action,
  initial,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  initial?: Asset;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    {},
  );
  const v = state.values ?? initialValues(initial) ?? {};
  const e = state.errors ?? {};
  const [avail, setAvail] = useState(v.availability ?? "unlimited");

  const aria = (k: string) => ({
    "aria-invalid": !!e[k],
    "aria-describedby": e[k] ? `${k}-err` : undefined,
  });
  const err = (k: string) =>
    e[k] ? (
      <span className="px-err" id={`${k}-err`}>
        {e[k]}
      </span>
    ) : null;

  return (
    <form key={JSON.stringify(v)} action={formAction} className="px-form">
      {Object.keys(e).length > 0 && (
        <p className="px-err" role="alert">
          {e.form ?? "Please fix the highlighted fields."}
        </p>
      )}

      <div className="px-field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          defaultValue={v.title}
          maxLength={80}
          {...aria("title")}
        />
        {err("title")}
      </div>

      <div className="px-field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={v.description}
          maxLength={2000}
          {...aria("description")}
        />
        {err("description")}
      </div>

      <div className="px-row2">
        <div className="px-field">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            defaultValue={v.category ?? ""}
            {...aria("category")}
          >
            <option value="" disabled>
              Choose one
            </option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          {err("category")}
        </div>
        <div className="px-field">
          <label htmlFor="price">Price (USD)</label>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0.99"
            max="999.99"
            inputMode="decimal"
            defaultValue={v.price}
            {...aria("price")}
          />
          {err("price")}
        </div>
      </div>

      <fieldset className="px-field px-radios">
        <legend>Availability</legend>
        {[
          ["unlimited", "Unlimited", "Anyone can buy it, any number of times."],
          ["limited", "Limited edition", "A fixed number of copies."],
          ["exclusive", "Exclusive (1 of 1)", "Sold to a single buyer."],
        ].map(([val, label, hint]) => (
          <label key={val} className="px-radio">
            <input
              type="radio"
              name="availability"
              value={val}
              checked={avail === val}
              onChange={() => setAvail(val)}
            />
            <span>
              <strong>{label}</strong>
              <small className="px-muted">{hint}</small>
            </span>
          </label>
        ))}
        {avail === "limited" && (
          <div className="px-field">
            <label htmlFor="limit">Number of copies</label>
            <input
              id="limit"
              name="limit"
              type="number"
              min="2"
              max="10000"
              defaultValue={v.limit}
              {...aria("limit")}
            />
            {err("limit")}
          </div>
        )}
        {err("availability")}
      </fieldset>

      <div className="px-field">
        <label htmlFor="images">Preview images</label>
        <input
          id="images"
          name="images"
          type="file"
          accept="image/png,image/gif,image/webp"
          multiple
          {...aria("images")}
        />
        <span className="px-muted">
          PNG, GIF or WebP, up to 3 files of 250 KB each. Leave empty to get a
          generated placeholder (demo).
        </span>
        {err("images")}
      </div>

      <div className="px-field">
        <label htmlFor="formats">File formats</label>
        <input
          id="formats"
          name="formats"
          defaultValue={v.formats}
          placeholder="PNG, ASE, TMX"
        />
      </div>
      <div className="px-field">
        <label htmlFor="tools">Works with</label>
        <input
          id="tools"
          name="tools"
          defaultValue={v.tools}
          placeholder="Godot, Unity, GameMaker"
        />
      </div>
      <div className="px-field">
        <label htmlFor="tags">Tags</label>
        <input
          id="tags"
          name="tags"
          defaultValue={v.tags}
          placeholder="dungeon, 16x16, top-down"
        />
      </div>

      <div className="px-actions">
        {initial ? (
          <button className="px-btn" type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </button>
        ) : (
          <>
            <button
              className="px-btn px-btn-ghost"
              type="submit"
              name="intent"
              value="draft"
              disabled={pending}
            >
              Save draft
            </button>
            <button
              className="px-btn"
              type="submit"
              name="intent"
              value="published"
              disabled={pending}
            >
              {pending ? "Saving…" : "Publish"}
            </button>
          </>
        )}
      </div>
    </form>
  );
}
