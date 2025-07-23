import React, { useState } from 'react';
import InputField from '../common/InputField'; // ✅ 1. Import component dùng chung
import { authService } from '../../api/auth.service';

// Thêm prop để báo cho AuthPage biết cần chuyển tab
const RegisterForm = ({ onRegisterSuccess }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        password: '',
        agreeTerms: false
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(''); // Thêm state cho thông báo thành công
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.agreeTerms) {
            setError('You must agree to the Terms & Conditions.');
            return;
        }
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            await authService.register({
                fullName: formData.fullName,
                username: formData.username,
                email: formData.email,
                password: formData.password
            });
            setSuccess('Registration successful! Please sign in.');
            
            // ✅ 2. Gọi hàm callback sau khi đăng ký thành công
            if (onRegisterSuccess) {
                setTimeout(() => {
                    onRegisterSuccess();
                }, 2000); // Chờ 2 giây rồi chuyển qua tab login
            }

        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h1>
                <p className="text-gray-600 text-sm">Join us today! Create your account to get started.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* ✅ Sử dụng InputField đã import */}
                <InputField label="Full Name" type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Enter your full name" />
                <InputField label="Username" type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Enter your username" />
                <InputField label="Email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter your email address" />
                <InputField label="Password" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter your password" />
                
                <div className="flex items-center">
                    <input type="checkbox" name="agreeTerms" checked={formData.agreeTerms} onChange={handleChange} className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500" required />
                    <label className="ml-2 text-sm text-gray-700">
                        I agree with <button type="button" className="text-orange-600 hover:text-orange-700 font-medium underline">Terms & Conditions</button>
                    </label>
                </div>

                {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                {success && <p className="text-sm text-green-600 text-center">{success}</p>}
                
                <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 transition-colors">
                    {loading ? 'Processing...' : 'Sign Up'}
                </button>
            </form>
        </>
    );
};

export default RegisterForm;