import { CameraOutlined, UserOutlined } from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import {
  Avatar,
  Button,
  Form,
  Image,
  Input,
  message,
  Space,
  Typography,
  Upload,
} from "antd";
import type { UploadProps } from "antd";
import ImgCrop from "antd-img-crop";
import userApi from "../../api/userApi";
import { useAuthStore } from "../../store/useAuthStore";
import { getAvatarUrl } from "../../utils/imageUtils";
import { useState } from "react";

const { Title, Text } = Typography;

const ProfilePage = () => {
  const { user, setUser } = useAuthStore();
  const [form] = Form.useForm();
  const [previewOpen, setPreviewOpen] = useState(false);

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: (data) => {
      setUser({ ...user, ...data.result } as any);
      message.success(data.message);
    },
    onError: (error: any) => {
      message.error(error.message);
    },
  });

  const { mutate: uploadAvatar, isPending: isUploading } = useMutation({
    mutationFn: userApi.uploadAvatar,
    onSuccess: (data) => {
      setUser({ ...user, ...data.result } as any);
      message.success(data.message);
    },
    onError: (error: any) => {
      message.error(error.message);
    },
  });

  const handleUpload: UploadProps["customRequest"] = ({
    file,
    onSuccess,
    onError,
  }) => {
    uploadAvatar(file as File, {
      onSuccess: () => {
        onSuccess?.("ok");
      },
      onError: (err) => {
        onError?.(err as any);
      },
    });
  };

  const onFinish = (values: any) => {
    const defaultName = user?.name || "";
    const defaultPhone = (user as any)?.phone || "";

    if (values.name === defaultName && (values.phone || "") === defaultPhone) {
      return;
    }

    updateProfile({
      name: values.name,
      phone: values.phone,
    });
  };

  const handleCancel = () => {
    form.resetFields();
  };

  return (
    <div>
      <Title
        level={2}
        style={{ color: "#fff", marginBottom: "24px", fontSize: "24px" }}
      >
        Profile Settings
      </Title>

      <div className="flex flex-col sm:flex-row items-center gap-6 mb-10 text-center sm:text-left">
        <div style={{ position: "relative" }}>
          <Avatar
            size={120}
            src={getAvatarUrl(user?.avatarUrl)}
            icon={<UserOutlined />}
            style={{
              cursor: "pointer",
              background: "rgba(255,193,7,0.1)",
              border: "2px solid rgba(255,255,255,0.08)",
            }}
            onClick={() => setPreviewOpen(true)}
          />

          <Image
            style={{ display: "none" }}
            src={getAvatarUrl(user?.avatarUrl)}
            preview={{
              visible: previewOpen,
              onVisibleChange: (visible) => setPreviewOpen(visible),
            }}
          />

          <ImgCrop rotationSlider>
            <Upload
              showUploadList={false}
              customRequest={handleUpload}
              accept="image/*"
            >
              <Button
                shape="circle"
                icon={<CameraOutlined />}
                loading={isUploading}
                style={{
                  position: "absolute",
                  bottom: "5px",
                  right: "5px",
                }}
              />
            </Upload>
          </ImgCrop>
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
          phone: (user as any)?.phone,
          bio: "",
        }}
        onFinish={onFinish}
        requiredMark={false}
      >
        <div className="grid grid-cols-1 gap-x-8 max-w-[540px]">
          <Form.Item
            label={
              <span style={{ color: "rgba(255,255,255,0.85)" }}>Full Name</span>
            }
            name="name"
            rules={[
              { required: true, message: "Please enter your name" },
              { max: 255, message: "Name cannot exceed 255 characters" },
            ]}
          >
            <Input
              placeholder="Enter your full name"
              size="large"
              maxLength={255}
            />
          </Form.Item>

          <Form.Item
            label={
              <span style={{ color: "rgba(255,255,255,0.85)" }}>
                Phone Number
              </span>
            }
            name="phone"
            rules={[
              {
                pattern: /^[0-9]{9,15}$/,
                message: "Phone number must be 9–15 digits",
              },
            ]}
          >
            <Input
              placeholder="Enter your phone number"
              size="large"
              maxLength={15}
            />
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
              { max: 255, message: "Email cannot exceed 255 characters" },
            ]}
          >
            <Input
              placeholder="Enter your email"
              size="large"
              maxLength={255}
              disabled
            />
          </Form.Item>
        </div>

        <Form.Item style={{ marginTop: "16px" }}>
          <Space>
            <Button type="primary" htmlType="submit" loading={isPending}>
              Save Changes
            </Button>
            <Button onClick={handleCancel} disabled={isPending}>
              Cancel
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ProfilePage;
