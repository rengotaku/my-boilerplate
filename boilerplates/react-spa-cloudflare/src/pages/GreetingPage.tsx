import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";

import { useGreetingStore } from "@/hooks/useGreetingStore";

export function GreetingPage() {
  const { name } = useParams<{ name: string }>();
  const { visitCount, incrementVisit } = useGreetingStore();
  const hasIncremented = useRef(false);

  useEffect(() => {
    if (name && !hasIncremented.current) {
      hasIncremented.current = true;
      incrementVisit(name);
    }
  }, [name, incrementVisit]);

  const decodedName = name ? decodeURIComponent(name) : "Guest";

  return (
    <VStack gap={6} hAlign="center" paddingBlockStart={4}>
      <Heading level={1}>Hello, {decodedName}!</Heading>

      <Card padding={4}>
        <Text type="supporting">You are visitor #{visitCount}</Text>
      </Card>

      <Button label="Try Another Name" href="/greeting" variant="primary" />
    </VStack>
  );
}
