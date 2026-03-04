import { useNavigate } from "react-router";

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  

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
      <button 
        onClick={() => {
          const key = prompt('请输入访问密钥:');
          if (key === '294') {
            localStorage.setItem('vnote', key);
            navigate("/", { replace: true });
          }
        }}
        style={{ marginTop: '20px', padding: '10px 20px' }}
      >
        输入密钥
      </button>
    </div>
  );
};

export default UnauthorizedPage;
