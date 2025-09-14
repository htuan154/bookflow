import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { USER_ROLES } from '../../config/roles';
import useAuth from '../../hooks/useAuth';
import { authService } from '../../api/auth.service';
import InputField from '../common/InputField';

const LoginForm = () => {
    const [formData, setFormData] = useState({ identifier: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { isAuthenticated, user, login } = useAuth();

    // Navigate khi user và isAuthenticated được update
    useEffect(() => {
        if (isAuthenticated && user) {
            if (
                user.roleId === USER_ROLES.ADMIN ||
                user.roleId === USER_ROLES.HOTEL_OWNER
            ) {
                if (user.roleId === USER_ROLES.ADMIN) {
                    navigate('/admin/dashboard', { replace: true });
                } else {
                    navigate('/hotel-owner', { replace: true });
                }
            } else {
                navigate('/unauthorized', { replace: true });
            }
        }
    }, [isAuthenticated, user, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authService.login(formData.identifier, formData.password);

            const userData = response?.data?.data?.user;
            const token = response?.data?.data?.token;

            if (!userData || !token) {
                setError('Dữ liệu đăng nhập không hợp lệ');
                return;
            }

            login(userData, token);
         

        } catch (err) {

            setError(err.response?.data?.message || 'Đăng nhập thất bại');
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
