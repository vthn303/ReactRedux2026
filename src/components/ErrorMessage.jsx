import { Alert, AlertTitle, Button } from "@mui/material";

export default function ErrorMessage({ error, onRetry }) {
  return (
    <Alert
      severity="error"
      variant="filled"
      action={
        <Button color="inherit" size="small" onClick={onRetry}>
          Thử lại
        </Button>
      }
    >
      <AlertTitle>Lỗi ({error.code})</AlertTitle>
      {error.message}
    </Alert>
  );
}

