import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import { contactSchema } from "@/schemas/contactSchema";
import type { ContactFormData } from "@/schemas/contactSchema";

export function FormSample() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = () => {
    setSubmitted(true);
    reset();
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Contact Form
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        A sample form with React Hook Form and Zod validation.
      </Typography>

      {submitted && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Thank you for your message! We will get back to you soon.
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 400 }}>
        <TextField
          {...register("name")}
          label="Name"
          fullWidth
          margin="normal"
          error={!!errors.name}
          helperText={errors.name?.message}
        />
        <TextField
          {...register("email")}
          label="Email"
          type="email"
          fullWidth
          margin="normal"
          error={!!errors.email}
          helperText={errors.email?.message}
        />
        <TextField
          {...register("message")}
          label="Message"
          multiline
          rows={4}
          fullWidth
          margin="normal"
          error={!!errors.message}
          helperText={errors.message?.message}
        />
        <Button type="submit" variant="contained" sx={{ mt: 2 }}>
          Submit
        </Button>
      </Box>
    </Box>
  );
}
