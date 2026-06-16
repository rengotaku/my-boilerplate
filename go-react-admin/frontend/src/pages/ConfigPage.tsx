import { useState } from "react";
import { Button } from "@/components/ui/button";
import { KindBadge } from "@/components/admin/kind-badge";
import { useConfig, useRestart, useUpdateConfig } from "@/hooks/useConfig";
import type { ConfigItem, UpdateConfigInput } from "@/types/run";

// SourceBadge tags a setting with where it comes from. env = read-only,
// toml = editable from this screen.
function SourceBadge({ source }: { source: ConfigItem["source"] }) {
  return source === "env" ? (
    <KindBadge label="env" color="#64748b" />
  ) : (
    <KindBadge label="toml" color="#4f46e5" />
  );
}

export function ConfigPage() {
  const { data, isLoading, isError, error } = useConfig();
  const updateConfig = useUpdateConfig();
  const restart = useRestart();

  // Track only the user's edits (keyed by setting). The displayed value is the
  // edit if present, otherwise the server value — so no effect-based seeding is
  // needed, and a refetch after save naturally shows the persisted values.
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [restarting, setRestarting] = useState(false);

  const editableItems = data?.items.filter((i) => i.editable) ?? [];
  const envItems = data?.items.filter((i) => !i.editable) ?? [];
  const dirty = Object.keys(edits).length > 0;

  const valueFor = (key: string, fallback: string) => edits[key] ?? fallback;

  const onChange = (key: string, value: string) => {
    setEdits((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const onSave = () => {
    const input: UpdateConfigInput = {
      worker_interval: edits["worker_interval"],
      shutdown_timeout: edits["shutdown_timeout"],
    };
    updateConfig.mutate(input, {
      onSuccess: () => {
        setEdits({});
        setSaved(true);
      },
    });
  };

  // Restart, then poll /health until the server is back, then reload the page so
  // the freshly-applied config is shown.
  const onRestart = () => {
    setRestarting(true);
    restart.mutate(undefined, {
      onSuccess: async () => {
        await waitForHealth();
        window.location.reload();
      },
      onError: () => setRestarting(false),
    });
  };

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Config</h1>
        {data?.configPath && (
          <p className="mt-1 text-sm text-slate-500">
            Editable values are stored in{" "}
            <span className="font-mono text-xs">{data.configPath}</span> and applied on
            restart.
          </p>
        )}
      </div>

      {isError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Failed to load config: {(error as Error)?.message}
        </div>
      )}
      {isLoading && <p className="text-sm text-slate-500">Loading…</p>}

      {/* Environment — read-only */}
      {envItems.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-slate-700">
            Environment (read-only)
          </h2>
          <div className="overflow-hidden rounded-md border border-slate-200">
            {envItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50 px-3 py-2 last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  <SourceBadge source={item.source} />
                </div>
                <span className="font-mono text-xs text-slate-600">{item.value}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* File (toml) — editable */}
      {editableItems.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-slate-700">File (editable)</h2>
          <div className="flex flex-col gap-3 rounded-md border border-slate-200 p-3">
            {editableItems.map((item) => (
              <label key={item.key} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  <SourceBadge source={item.source} />
                </span>
                <input
                  className="w-40 rounded-md border border-slate-300 px-2 py-1 text-right font-mono text-sm focus:border-indigo-400 focus:outline-none"
                  value={valueFor(item.key, item.value)}
                  onChange={(e) => onChange(item.key, e.target.value)}
                />
              </label>
            ))}

            <p className="text-xs text-slate-400">
              Durations use Go syntax, e.g. <span className="font-mono">15s</span>,{" "}
              <span className="font-mono">2m</span>.
            </p>

            {updateConfig.isError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {(updateConfig.error as Error)?.message ?? "Failed to save"}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button onClick={onSave} disabled={!dirty || updateConfig.isPending}>
                {updateConfig.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Restart banner — shown once a save lands, since changes need a restart */}
      {saved && (
        <div className="flex items-center justify-between gap-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-3">
          <span className="text-sm text-amber-800">
            Saved. Restart to apply the new values to the running server.
          </span>
          <Button variant="default" onClick={onRestart} disabled={restarting}>
            {restarting ? "Restarting…" : "Restart & apply"}
          </Button>
        </div>
      )}
    </div>
  );
}

// waitForHealth polls /health until the restarted server responds (or times out).
async function waitForHealth(timeoutMs = 15000): Promise<void> {
  const base = import.meta.env.VITE_API_BASE_URL ?? "";
  const deadline = Date.now() + timeoutMs;
  // Give the old process a moment to drop before polling.
  await sleep(500);
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${base}/health`, { cache: "no-store" });
      if (res.ok) return;
    } catch {
      // server still down; keep polling
    }
    await sleep(500);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
