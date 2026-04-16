import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import SellerStatisticsDashboard from "../../features/auction/SellerStatisticsDashboard";

export const SellerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    // Redirect to home if not a seller
    if (user && !user.roles?.includes("SELLER")) {
      navigate("/");
    }
  }, [user, navigate]);

  return <SellerStatisticsDashboard />;
};

export default SellerDashboard;
