// src/components/auth/LoginForm.js
import React, { useState, useContext } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { login } from '../../api/auth.service';
import { AuthContext } from '../../context/AuthContext';

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


const LoginForm = () => {
    const { login: setAuth } = useContext(AuthContext);
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
        try {
            const response = await login(formData.identifier, formData.password);
            if (response.data.status === 'success') {
                const { user, token } = response.data.data;
                setAuth(user, token);
            }
        } catch (err) {
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
                <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 transition-colors">
                    {loading ? 'Processing...' : 'Sign In'}
                </button>
            </form>
        </>
    );
};

export default LoginForm;
