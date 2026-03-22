import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Button from "@mui/material/Button";

export function HomePage() {
  const features = [
    "Vite + TypeScript",
    "React Router",
    "TanStack Query (API state)",
    "Zustand (UI state)",
    "ky (HTTP client)",
    "Vitest + Testing Library",
    "Material UI",
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        React SPA Boilerplate
      </Typography>
      <Typography variant="body1" gutterBottom>
        A minimal React SPA template with:
      </Typography>
      <List dense>
        {features.map((feature) => (
          <ListItem key={feature}>
            <ListItemText primary={feature} />
          </ListItem>
        ))}
      </List>
      <Button variant="contained" component={RouterLink} to="/users">
        Users
      </Button>
    </Box>
  );
}
