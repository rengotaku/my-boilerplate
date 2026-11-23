import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { List, ListItem } from "@astryxdesign/core/List";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";

const FEATURES = [
  "Vite 8 + TypeScript 5.9",
  "React 19 + React Router",
  "Astryx (design system)",
  "Zustand (state management)",
  "React Hook Form + Zod (forms)",
  "Vitest + Testing Library",
  "Cloudflare Pages deployment",
];

export function HomePage() {
  return (
    <VStack gap={6}>
      <VStack gap={2}>
        <Heading level={1}>React SPA Boilerplate</Heading>
        <Text type="supporting">
          A standalone SPA boilerplate optimized for Cloudflare Pages deployment.
        </Text>
      </VStack>

      <Card maxWidth={520} padding={4}>
        <VStack gap={3}>
          <Heading level={2}>Features</Heading>
          <List listStyle="disc">
            {FEATURES.map((feature) => (
              <ListItem key={feature} label={feature} />
            ))}
          </List>
        </VStack>
      </Card>

      <HStack gap={2} wrap="wrap">
        <Button label="About" href="/about" variant="primary" />
        <Button label="Greeting Demo" href="/greeting" variant="secondary" />
      </HStack>
    </VStack>
  );
}
