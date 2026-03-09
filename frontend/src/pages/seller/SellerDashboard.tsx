import { useEffect } from "react";
import { Card, Empty } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";

export const SellerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    // Redirect to home if not a seller
    if (user && !user.roles?.includes("SELLER")) {
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
          marginBottom: "28px",
        }}
      >
        Seller Dashboard
      </h1>

      <Card>
        <Empty
          description="Seller dashboard features coming soon"
          style={{ padding: "50px 0" }}
        />
      </Card>
    </div>
  );
};

export default SellerDashboard;
