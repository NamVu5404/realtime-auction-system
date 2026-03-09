import { CameraOutlined, SaveOutlined, UserOutlined } from "@ant-design/icons";
import {
  Avatar,
  Button,
  Form,
  Input,
  message,
  Space,
  Typography,
  Upload,
} from "antd";
import { useAuthStore } from "../../store/useAuthStore";

const { Title, Text } = Typography;
const { TextArea } = Input;

const ProfilePage = () => {
  const { user } = useAuthStore();
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    message.success("Profile updated successfully!");
    console.log("Success:", values);
  };

  return (
    <div>
      <Title
        level={2}
        style={{ color: "#fff", marginBottom: "32px", fontSize: "24px" }}
      >
        Profile Settings
      </Title>

      <div className="flex flex-col sm:flex-row items-center gap-6 mb-10 text-center sm:text-left">
        <div style={{ position: "relative" }}>
          <Avatar
            size={120}
            src={user?.avatarUrl}
            icon={<UserOutlined />}
            style={{
              background: "rgba(255,193,7,0.1)",
              border: "2px solid rgba(255,255,255,0.08)",
            }}
          />
          <Upload showUploadList={false}>
            <Button
              shape="circle"
              icon={<CameraOutlined />}
              style={{
                position: "absolute",
                bottom: "5px",
                right: "5px",
                background: "#1890ff",
                color: "#fff",
                border: "none",
                boxShadow: "0 4px 12px rgba(24,144,255,0.4)",
              }}
            />
          </Upload>
        </div>
        <div>
          <Title level={4} style={{ color: "#fff", margin: 0 }}>
            {user?.name}
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.45)" }}>
            Update your photo and personal details
          </Text>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: user?.name,
          email: user?.email,
          bio: "",
        }}
        onFinish={onFinish}
        requiredMark={false}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <Form.Item
            label={
              <span style={{ color: "rgba(255,255,255,0.85)" }}>Full Name</span>
            }
            name="name"
            rules={[{ required: true, message: "Please enter your name" }]}
          >
            <Input placeholder="Enter your full name" size="large" />
          </Form.Item>

          <Form.Item
            label={
              <span style={{ color: "rgba(255,255,255,0.85)" }}>
                Email Address
              </span>
            }
            name="email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input placeholder="Enter your email" size="large" disabled />
          </Form.Item>
        </div>

        <Form.Item
          label={<span style={{ color: "rgba(255,255,255,0.85)" }}>Bio</span>}
          name="bio"
        >
          <TextArea
            rows={4}
            placeholder="Tell us a bit about yourself..."
            style={{
              borderRadius: "12px",
              background: "rgba(255,255,255,0.03)",
            }}
          />
        </Form.Item>

        <Form.Item style={{ marginTop: "32px" }}>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              size="large"
              style={{
                borderRadius: "100px",
                padding: "0 28px",
                height: "44px",
                fontWeight: 600,
                boxShadow: "0 4px 12px rgba(24,144,255,0.4)",
              }}
            >
              Save Changes
            </Button>
            <Button type="text" style={{ color: "rgba(255,255,255,0.45)" }}>
              Cancel
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ProfilePage;
