import { Navigate } from "react-router-dom";

// Legacy route — credit management now lives inside the unified Admin Command Center.
const AdminCredits = () => <Navigate to="/admin/analytics" replace />;

export default AdminCredits;
