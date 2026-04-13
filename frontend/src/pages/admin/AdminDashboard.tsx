import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import AdminDashboardContent from "../../features/admin/AdminDashboardContent";

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    // Redirect to home if not an admin
    if (user && !user.roles?.includes("ADMIN")) {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <div>
      <h1
        style={{
          fontSize: "24px",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          marginBottom: "24px",
        }}
      >
        Dashboard
      </h1>

      <AdminDashboardContent />
    </div>
  );
};

export default AdminDashboard;
