import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Result
      status="404"
      title="404"
      subTitle="Sorry, the page you are looking for does not exist."
      extra={
        <Button type="primary" onClick={() => navigate('/')}>
          Back to Home
        </Button>
      }
    />
  );
};

export default NotFound;
