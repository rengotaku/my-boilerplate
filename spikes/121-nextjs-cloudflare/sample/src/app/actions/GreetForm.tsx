"use client";

import { useState, useTransition } from "react";
import { greet } from "./greet";

export function GreetForm() {
  const [result, setResult] = useState<string>("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          const r = await greet(formData);
          setResult(r.message);
        });
      }}
      className="flex flex-col gap-2"
    >
      <input
        name="name"
        defaultValue="cloudflare"
        className="border px-2 py-1"
      />
      <button type="submit" disabled={pending} className="border px-3 py-1">
        {pending ? "..." : "greet"}
      </button>
      {result && <p data-testid="result">{result}</p>}
    </form>
  );
}
