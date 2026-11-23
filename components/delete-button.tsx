// components/delete-button.tsx
"use client";

export function DeleteButton({ title }: { title: string }) {
  return (
    <button
      className="px-btn px-btn-sm px-btn-danger"
      type="submit"
      onClick={(e) => {
        if (!window.confirm(`Delete “${title}”? This can’t be undone.`))
          e.preventDefault();
      }}
    >
      Delete
    </button>
  );
}
