"use client";

import { useState } from "react";

interface Props {
  currency: string;
  label: string;
}

export function CheckoutButton({ currency, label }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="mt-8 flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-600 to-pink-600 text-sm font-semibold text-white transition hover:from-fuchsia-500 hover:to-pink-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Redirection…" : label}
    </button>
  );
}
