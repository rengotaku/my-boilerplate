import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { List, ListItem } from "@astryxdesign/core/List";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";

const features = [
  "Vite + TypeScript",
  "React Router",
  "TanStack Query (API state)",
  "Zustand (UI state)",
  "ky (HTTP client)",
  "Vitest + Testing Library",
  "Astryx (design system)",
];

export function HomePage() {
  return (
    <VStack gap={6}>
      <VStack gap={2}>
        <Heading level={1}>React SPA Boilerplate</Heading>
        <Text type="supporting">
          A minimal React SPA with client-side routing, server state and UI state split
          apart.
        </Text>
      </VStack>

      <Card maxWidth={520} padding={4}>
        <VStack gap={3}>
          <Heading level={2}>Features</Heading>
          <List listStyle="disc">
            {features.map((feature) => (
              <ListItem key={feature} label={feature} />
            ))}
          </List>
        </VStack>
      </Card>

      <HStack gap={2}>
        <Button label="Users" href="/users" variant="primary" />
      </HStack>
    </VStack>
  );
}
