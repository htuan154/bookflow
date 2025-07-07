// src/components/auth/RegisterForm.js
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { register } from '../../api/auth.service';

const InputField = ({ label, type, name, value, onChange, placeholder, required = true }) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordField = type === 'password';
    const togglePasswordVisibility = () => setShowPassword(!showPassword);
  
    return (
      <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
          <div className="relative">
              <input
                  type={isPasswordField ? (showPassword ? 'text' : 'password') : type}
                  name={name}
                  value={value}
                  onChange={onChange}
                  placeholder={placeholder}
                  required={required}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              />
              {isPasswordField && (
                  <button type="button" onClick={togglePasswordVisibility} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
              )}
          </div>
      </div>
    );
};

const RegisterForm = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        password: '',
        agreeTerms: false
    });
    const [error, setError] = useState('');
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
        setLoading(true);
        try {
            await register({
                fullName: formData.fullName,
                username: formData.username,
                email: formData.email,
                password: formData.password
            });
            alert('Registration successful! Please sign in.');
            // Ideally, you would switch the view back to login here
            // This can be done by passing a function from AuthPage
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
                
                <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 transition-colors">
                    {loading ? 'Processing...' : 'Sign Up'}
                </button>
            </form>
        </>
    );
};

export default RegisterForm;
