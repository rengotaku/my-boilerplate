import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components";
import { HomePage, AboutPage, FormSample, NotFoundPage } from "@/pages";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="form" element={<FormSample />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
