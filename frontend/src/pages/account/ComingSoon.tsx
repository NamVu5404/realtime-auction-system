import { Empty, Typography } from "antd";

const { Title, Text } = Typography;

interface ComingSoonProps {
  title: string;
}

const ComingSoon = ({ title }: ComingSoonProps) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        textAlign: "center",
      }}
    >
      <Title
        level={2}
        style={{ color: "#fff", marginBottom: "24px", fontSize: "24px" }}
      >
        {title}
      </Title>
      <Empty
        description={
          <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "16px" }}>
            Features coming soon
          </span>
        }
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    </div>
  );
};

export default ComingSoon;
