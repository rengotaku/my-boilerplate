import { Button } from "@astryxdesign/core/Button";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";

export function NotFoundPage() {
  return (
    <VStack gap={3} align="center" paddingBlock={10}>
      <Heading level={1}>404</Heading>
      <Text type="supporting">This page could not be found.</Text>
      <Button label="Go to Runs" href="/runs" variant="primary" />
    </VStack>
  );
}
