// frontend/src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { login } from '../api';

const Login = () => {
    const navigate = useNavigate();
    const setToken = useAuthStore((state) => state.setToken);
    
    // 状态管理
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // 处理登录提交
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault(); // 阻止表单默认的页面刷新行为

        if (!username || !password) {
            setError('请输入用户名和密码。');
            return;
        }

        setError(''); // 清除旧错误
        setLoading(true);

        try {
            // API 调用
            const response = await login(username, password);
            setToken(response.token);
            navigate('/dashboard');
        }
        catch {
            // 处理登录失败
            setError('登录失败，请检查用户名或密码。');
        }
        finally {
            setLoading(false);
        }
    };

    return (
        // ⭐️ 样式容器：使用 Flex 布局实现全屏覆盖和居中
        <div style={styles.container}>
            <form onSubmit={handleLogin} style={styles.loginBox}>
                <h2 style={styles.title}>行情系统登录</h2>
                
                {/* 错误提示区域 */}
                {error && <p style={styles.error}>{error}</p>}
                
                {/* 用户名输入 */}
                <div style={styles.inputGroup}>
                    <input 
                        type="text" 
                        placeholder='账号（任意）' 
                        style={styles.inputField}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    /> 
                </div>
                
                {/* 密码输入，修正 type="text" 为 type="password" */}
                <div style={styles.inputGroup}>
                    <input 
                        type="password" // 确保密码被隐藏
                        placeholder='密码（任意）' 
                        style={styles.inputField} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                
                {/* 登录按钮 */}
                <button 
                    type='submit' 
                    disabled={loading} 
                    style={{...styles.button, ...(loading ? styles.buttonDisabled : {})}}
                >
                    {loading ? '登录中...' : '登录'}
                </button>
            </form>
        </div>
    );
};

// ⭐️ 样式定义
const styles: { [key: string]: React.CSSProperties } = {
    // 1. container: 实现全屏铺满和居中
    container: { 
        display: 'flex',
        justifyContent: 'center', // 水平居中
        alignItems: 'center',    // 垂直居中
        height: '100vh',         // 占据整个视口高度
        width: '100vw',          // 占据整个视口宽度
        background: '#f0f2f5',   // 浅灰色背景
    },
    // 2. loginBox: 登录表单样式
    loginBox: {
        padding: 40,
        background: '#fff', // 白色卡片
        borderRadius: 12,
        // 修正：修正了 boxShadow 中的 'rgpa' 拼写错误为 'rgba'
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
        width: 360,
        maxWidth: '90%',
    },
    title: {
        textAlign: 'center',
        marginBottom: 24,
        color: '#333',
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputField: {
        width: '100%',
        padding: 12,
        border: '1px solid #d9d9d9',
        borderRadius: 6,
        boxSizing: 'border-box',
        fontSize: 16,
    },
    button: {
        width: '100%',
        padding: 12,
        backgroundColor: '#1890ff',
        color: 'white',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        fontSize: 16,
        transition: 'background-color 0.3s',
    },
    buttonDisabled: {
        backgroundColor: '#91d5ff',
        cursor: 'not-allowed',
    },
    error: {
        color: '#ff4d4f',
        marginBottom: 10,
        textAlign: 'center',
        fontSize: 14,
    }
};

export default Login;