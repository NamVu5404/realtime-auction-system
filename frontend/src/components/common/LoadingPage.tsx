import React from "react";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

interface LoadingPageProps {
  tip?: string;
  message?: string;
}

const LoadingPage: React.FC<LoadingPageProps> = ({
  tip = "Loading...",
  message = "Please wait while we prepare your experience",
}) => {
  const antIcon = (
    <LoadingOutlined
      style={{
        fontSize: 48,
        color: "#FED469",
        filter: "drop-shadow(0 0 15px rgba(254, 212, 105, 0.4))",
      }}
      spin
    />
  );

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#191B24",
        zIndex: 9999,
        transition: "all 0.5s ease-in-out",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "24px",
          animation: "fadeIn 0.8s ease-out",
        }}
      >
        {/* Animated Background Glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "200px",
            height: "200px",
            background:
              "radial-gradient(circle, rgba(254, 212, 105, 0.05) 0%, rgba(25, 27, 36, 0) 70%)",
            borderRadius: "50%",
            animation: "pulse 2s infinite ease-in-out",
          }}
        />

        <div style={{ position: "relative" }}>
          <Spin indicator={antIcon} />
        </div>

        <div style={{ textAlign: "center", zIndex: 1 }}>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 700,
              margin: "0 0 8px 0",
              letterSpacing: "-0.02em",
              background: "linear-gradient(135deg, #FED469 0%, #FEECBB 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {tip}
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "15px",
              margin: 0,
              maxWidth: "300px",
              animation: "pulseText 2s infinite ease-in-out",
            }}
          >
            {message}
          </p>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.3; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.3; }
        }
        @keyframes pulseText {
          0% { opacity: 0.4; }
          50% { opacity: 0.7; }
          100% { opacity: 0.4; }
        }
      `,
        }}
      />
    </div>
  );
};

export default LoadingPage;
