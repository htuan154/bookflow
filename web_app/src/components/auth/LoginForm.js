import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InputField from '../common/InputField';
import { authService } from '../../api/auth.service';
import useAuth from '../../hooks/useAuth';
import { USER_ROLES } from '../../constants/roles';

const LoginForm = () => {
    const { login } = useAuth(); // ✅ Đổi từ handleLoginSuccess thành login
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ identifier: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        console.log('Bắt đầu submit form');

        try {
            const response = await authService.login(formData.identifier, formData.password);
            console.log('Response:', response);

            const user = response?.data?.data?.user;
            const token = response?.data?.data?.token;

            if (!user || !token) {
                console.error('Dữ liệu user hoặc token bị thiếu:', { user, token });
                setError('Dữ liệu đăng nhập không hợp lệ (thiếu user hoặc token)');
                return;
            }

            if (!login) {
                console.error('Hàm login không tồn tại trong useAuth()');
                setError('Lỗi nội bộ: login không khả dụng');
                return;
            }

            console.log('Gọi login...');
            login(user, token); // ✅ Gọi đúng hàm

            console.log('user:', user);
            console.log('USER_ROLES.ADMIN:', USER_ROLES.ADMIN);
            console.log('user.roleId:', user.roleId);

            if (user.roleId === USER_ROLES.ADMIN) {
                console.log('➡ Điều hướng đến /admin');
                navigate('/admin', { replace: true });
            } else {
                console.log('➡ Điều hướng đến /');
                navigate('/');
            }

        } catch (err) {
            console.error('Lỗi trong quá trình đăng nhập:', err);
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h1>
                <p className="text-gray-600 text-sm">Welcome back! Please enter your details.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <InputField
                    label="Email or Username"
                    type="text"
                    name="identifier"
                    value={formData.identifier}
                    onChange={handleChange}
                    placeholder="Enter your email or username"
                />
                <InputField
                    label="Password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                />
                <div className="text-right">
                    <button type="button" className="text-sm text-orange-600 hover:text-orange-700 font-medium underline">
                        Forgot Password?
                    </button>
                </div>
                {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                    {loading ? 'Processing...' : 'Sign In'}
                </button>
            </form>
        </>
    );
};

export default LoginForm;
