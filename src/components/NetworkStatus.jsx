import { Alert } from "@mui/material";
import useOnlineStatus from "../hooks/useOnlineStatus";

export default function NetworkStatus() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <Alert severity="warning" variant="filled" className="justify-center rounded-none">
      Bạn đang offline
    </Alert>
  );
}

