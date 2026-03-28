import { Card, Empty } from "antd";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";

const SellerNotificationPage: React.FC = () => {
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
        Seller Notifications
      </h1>

      <Card>
        <Empty
          description="Seller notification features coming soon"
          style={{ padding: "50px 0" }}
        />
      </Card>
    </div>
  );
};

export default SellerNotificationPage;
