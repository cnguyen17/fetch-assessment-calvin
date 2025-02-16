import React, { useState } from 'react';
import { Layout, Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../services/api';
import FetchLogo from '../../assets/Fetch-logo-white.png';
import './Login.css';
import useMediaQuery from 'react-responsive';

const { Header, Content } = Layout;

const Login: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const isMobile = useMediaQuery({ query: '(max-width: 768px)' });

    // Handles submission when the user logs in
    const onFinish = async (values: { name: string; email: string }) => {
        console.log('Attempting login with:', {
            name: values.name,
            email: values.email
        });

        try {
            setLoading(true);
            console.log('Sending login request...');
            
            const response = await loginUser(values.name, values.email);
            console.log('Login response status:', response.status);
            console.log('Login response headers:', response.headers);
            
            // Check for successful login
            if (response.status === 200) {
                console.log('Login successful - auth cookie should be set');
                console.log('Note: HttpOnly cookie cannot be accessed via JavaScript');               
                localStorage.setItem('isAuthenticated', 'true');
                message.success('Login successful! Welcome to Dog Finder');      
                setTimeout(() => {
                    navigate('/search');
                }, 500);
            } else {
                throw new Error('Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            message.error('Login failed. Please check your credentials and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            
            <Header className="login-header">
                <div className="header-left">
                    <img src={FetchLogo} alt="Fetch Logo" className="fetch-logo" />
                    {!isMobile && <h1 className="search-title">Dog Finder</h1>}
                </div>
            </Header>
            <Content className="login-container">
                <Card title="Welcome to Dog Finder" className="login-card">
                    <Form
                        name="login"
                        onFinish={onFinish}
                        layout="vertical"
                    >
                        <Form.Item
                            name="name"
                            rules={[{ required: true, message: 'Please input your name!' }]}
                        >
                            <Input 
                                prefix={<UserOutlined />} 
                                placeholder="Name" 
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            rules={[
                                { required: true, message: 'Please input your email!' },
                                { type: 'email', message: 'Please enter a valid email!' }
                            ]}
                        >
                            <Input 
                                prefix={<MailOutlined />} 
                                placeholder="Email" 
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button 
                                type="primary" 
                                htmlType="submit" 
                                loading={loading}
                                block
                                size="large"
                            >
                                Log in
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </Content>
        </Layout>
    );
};

export default Login;