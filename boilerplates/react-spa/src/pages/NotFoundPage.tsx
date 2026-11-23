import { Button } from "@astryxdesign/core/Button";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";

export function NotFoundPage() {
  return (
    <VStack gap={6} hAlign="center" paddingBlockStart={8}>
      <Heading level={1}>404</Heading>
      <EmptyState
        headingLevel={2}
        title="Page Not Found"
        description="The page you are looking for does not exist."
        actions={<Button label="Go to Home" href="/" variant="primary" />}
      />
      <Text type="supporting">Check the address, or start again from the home page.</Text>
    </VStack>
  );
}
