import { useState } from "react";
import { useNavigate } from "react-router";
import { verifyToken } from "../../api";

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const key = prompt('请输入访问密钥:');
    if (!key) return;

    setIsLoading(true);
    setError(null);

    const isValid = await verifyToken(key);

    if (isValid) {
      localStorage.setItem('vnote', key);
      navigate("/", { replace: true });
    } else {
      setError('密钥无效，请重试');
    }

    setIsLoading(false);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <h1>❌ 无权限访问</h1>
      <p>请输入正确的访问密钥</p>
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={isLoading}
        style={{ marginTop: '20px', padding: '10px 20px' }}
      >
        {isLoading ? '验证中...' : '输入密钥'}
      </button>
    </div>
  );
};

export default UnauthorizedPage;
