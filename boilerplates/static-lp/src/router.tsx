import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components";
import { HomePage, PrivacyPage, NotFoundPage } from "@/pages";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
