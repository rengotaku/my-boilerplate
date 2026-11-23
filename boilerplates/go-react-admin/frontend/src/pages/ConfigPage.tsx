import { useState } from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Divider } from "@astryxdesign/core/Divider";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";
import { KindBadge } from "@/components/admin/kind-badge";
import { useConfig, useRestart, useUpdateConfig } from "@/hooks/useConfig";
import type { ConfigItem, UpdateConfigInput } from "@/types/run";

// SourceBadge tags a setting with where it comes from. env = read-only,
// toml = editable from this screen.
function SourceBadge({ source }: { source: ConfigItem["source"] }) {
  return source === "env" ? (
    <KindBadge label="env" tone="neutral" />
  ) : (
    <KindBadge label="toml" tone="info" />
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
      time_zone: edits["time_zone"],
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
    <VStack gap={6} maxWidth={900}>
      <VStack gap={1}>
        <Heading level={1}>Config</Heading>
        {data?.configPath && (
          <Text type="supporting">
            Editable values are stored in <Text type="code">{data.configPath}</Text> and
            applied on restart.
          </Text>
        )}
      </VStack>

      {isError && (
        <Banner
          status="error"
          title="Failed to load config"
          description={(error as Error)?.message}
        />
      )}
      {isLoading && <Text type="supporting">Loading…</Text>}

      {/* Environment — read-only */}
      {envItems.length > 0 && (
        <VStack gap={2}>
          <Text weight="semibold">Environment (read-only)</Text>
          <Card padding={0}>
            {envItems.map((item, index) => (
              <div key={item.key}>
                {index > 0 && <Divider />}
                <HStack
                  justify="between"
                  align="center"
                  gap={4}
                  paddingInline={3}
                  paddingBlock={2}
                >
                  <HStack gap={2} align="center">
                    <Text weight="medium">{item.label}</Text>
                    <SourceBadge source={item.source} />
                  </HStack>
                  <Text type="code">{item.value}</Text>
                </HStack>
              </div>
            ))}
          </Card>
        </VStack>
      )}

      {/* File (toml) — editable */}
      {editableItems.length > 0 && (
        <VStack gap={3}>
          <Text weight="semibold">File (editable)</Text>
          <Card>
            <VStack gap={3}>
              {editableItems.map((item) => (
                <HStack key={item.key} justify="between" align="center" gap={4}>
                  <HStack gap={2} align="center">
                    <Text weight="medium">{item.label}</Text>
                    <SourceBadge source={item.source} />
                  </HStack>
                  <TextInput
                    label={item.label}
                    isLabelHidden
                    size="sm"
                    width={160}
                    value={valueFor(item.key, item.value)}
                    onChange={(value) => onChange(item.key, value)}
                  />
                </HStack>
              ))}

              <Text type="supporting">Durations use Go syntax, e.g. 15s, 2m.</Text>

              {updateConfig.isError && (
                <Banner
                  status="error"
                  title="Failed to save"
                  description={(updateConfig.error as Error)?.message ?? "Failed to save"}
                />
              )}

              <HStack gap={3} align="center">
                <Button
                  label="Save"
                  variant="primary"
                  onClick={onSave}
                  isDisabled={!dirty || updateConfig.isPending}
                  isLoading={updateConfig.isPending}
                />
              </HStack>
            </VStack>
          </Card>
        </VStack>
      )}

      {/* Restart banner — shown once a save lands, since changes need a restart */}
      {saved && (
        <Banner
          status="warning"
          title="Saved. Restart to apply the new values to the running server."
          endContent={
            <Button label="Restart & apply" onClick={onRestart} isLoading={restarting} />
          }
        />
      )}
    </VStack>
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
