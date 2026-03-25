import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";

export function UsersPage() {
  // TODO: Implement GraphQL integration in Phase 3
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Users
      </Typography>
      <Alert severity="info">
        GraphQL integration pending. Run codegen first.
      </Alert>
    </Box>
  );
}
