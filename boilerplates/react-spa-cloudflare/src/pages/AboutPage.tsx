import { Button } from "@astryxdesign/core/Button";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";

export function AboutPage() {
  return (
    <VStack gap={4}>
      <Heading level={1}>About</Heading>

      <Text>
        This is a React SPA boilerplate designed for deployment on Cloudflare Pages. It
        includes a modern tech stack with TypeScript, Astryx, and a comprehensive testing
        setup.
      </Text>

      <Heading level={2}>SPA Routing</Heading>

      <Text>
        This page demonstrates client-side routing. You can access this page directly via
        URL or by navigating from the home page. The Cloudflare Pages configuration
        ensures proper fallback routing for SPA navigation.
      </Text>

      <div>
        <Button label="Back to Home" href="/" variant="primary" />
      </div>
    </VStack>
  );
}
