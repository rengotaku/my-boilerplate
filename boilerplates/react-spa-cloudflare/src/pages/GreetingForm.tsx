import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";

import { useGreetingStore } from "@/hooks/useGreetingStore";

const nameSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
});

type NameFormData = z.infer<typeof nameSchema>;

export function GreetingForm() {
  const navigate = useNavigate();
  const { visitCount, lastVisitor } = useGreetingStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NameFormData>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = (data: NameFormData) => {
    navigate(`/greeting/${encodeURIComponent(data.name)}`);
  };

  return (
    <VStack gap={6}>
      <VStack gap={2}>
        <Heading level={1}>Greeting Demo</Heading>
        <Text type="supporting">Enter your name to receive a personalized greeting.</Text>
      </VStack>

      {visitCount > 0 && (
        <Banner
          status="info"
          title={`Total visits: ${visitCount}`}
          description={lastVisitor ? `Last visitor: ${lastVisitor}` : undefined}
        />
      )}

      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <VStack gap={4} maxWidth={420}>
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <TextInput
                label="Your Name"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
                hasAutoFocus
                autoComplete="off"
                status={
                  errors.name
                    ? { type: "error", message: errors.name.message }
                    : undefined
                }
              />
            )}
          />
          <div>
            <Button label="Say Hello" type="submit" variant="primary" />
          </div>
        </VStack>
      </form>
    </VStack>
  );
}
