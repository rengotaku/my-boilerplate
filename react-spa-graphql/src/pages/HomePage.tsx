import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Button from "@mui/material/Button";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

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

      <Card sx={{ maxWidth: 400, mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Features
          </Typography>
          <List dense disablePadding>
            {features.map((feature) => (
              <ListItem key={feature} disableGutters>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckCircleOutlineIcon color="primary" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={feature} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      <Button variant="contained" component={RouterLink} to="/users">
        Users
      </Button>
    </Box>
  );
}
