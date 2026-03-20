import ky from "ky";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export const apiClient = ky.create({
  prefixUrl: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  hooks: {
    beforeError: [
      async (error) => {
        const { response } = error;
        if (response) {
          try {
            const body = await response.json();
            error.message = (body as { message?: string }).message || error.message;
          } catch {
            // ignore JSON parse error
          }
        }
        return error;
      },
    ],
  },
});
