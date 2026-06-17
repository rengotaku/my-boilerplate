import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components";
import {
  RunsPage,
  RunDetailPage,
  JobsPage,
  JobDetailPage,
  JobFormPage,
  MetricsPage,
  LogsPage,
  ConfigPage,
  NotFoundPage,
} from "@/pages";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/runs" replace />} />
            <Route path="runs" element={<RunsPage />} />
            <Route path="runs/:id" element={<RunDetailPage />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="jobs/new" element={<JobFormPage />} />
            <Route path="jobs/:id" element={<JobDetailPage />} />
            <Route path="jobs/:id/edit" element={<JobFormPage />} />
            <Route path="metrics" element={<MetricsPage />} />
            <Route path="logs" element={<LogsPage />} />
            <Route path="config" element={<ConfigPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
