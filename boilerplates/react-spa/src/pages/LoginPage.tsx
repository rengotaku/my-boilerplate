import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useNavigate } from "react-router-dom";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";

import { authApi } from "@/api";
import { useAuthStore } from "@/hooks";
import { loginFormSchema, type LoginFormData } from "@/schemas";

interface LocationState {
  from?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setToken = useAuthStore((s) => s.setToken);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const { token } = await authApi.login(data);
      setToken(token);
      const state = location.state as LocationState | null;
      navigate(state?.from || "/", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-narrow">
      <Card maxWidth={420} padding={4}>
        <VStack gap={4}>
          <Heading level={1}>Sign in</Heading>

          <form noValidate onSubmit={handleSubmit(onSubmit)}>
            <VStack gap={4}>
              <Controller
                control={control}
                name="email"
                render={({ field }) => (
                  <TextInput
                    label="Email"
                    type="email"
                    autoComplete="username"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    status={
                      errors.email
                        ? { type: "error", message: errors.email.message }
                        : undefined
                    }
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field }) => (
                  <TextInput
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    status={
                      errors.password
                        ? { type: "error", message: errors.password.message }
                        : undefined
                    }
                  />
                )}
              />

              {submitError && <Banner status="error" title={`Error: ${submitError}`} />}

              <Button
                label="Sign in"
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
              />
            </VStack>
          </form>
        </VStack>
      </Card>
    </div>
  );
}
