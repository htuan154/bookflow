import React, { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
// ✅ 1. Import các component UI từ file riêng
import SocialButton from '../components/ui/SocialButton';
import { GoogleIcon, FacebookIcon, AppleIcon } from '../components/icons';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);

    // ✅ 2. Hàm xử lý để tự động chuyển về tab đăng nhập
    const handleRegisterSuccess = () => {
        // Có thể thêm một thông báo nhỏ ở đây nếu muốn
        console.log('Đăng ký thành công! Tự động chuyển sang trang đăng nhập.');
        setIsLogin(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {isLogin 
                        ? <LoginForm /> 
                        // ✅ 3. Truyền hàm xử lý vào RegisterForm
                        : <RegisterForm onRegisterSuccess={handleRegisterSuccess} />
                    }

                    {/* Divider */}
                    <div className="my-6 flex items-center">
                        <div className="flex-1 border-t border-gray-300"></div>
                        <div className="px-4 text-sm text-gray-500">Or sign {isLogin ? 'in' : 'up'} with</div>
                        <div className="flex-1 border-t border-gray-300"></div>
                    </div>

                    {/* Social Login */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                       <SocialButton icon={<GoogleIcon />} aria-label="Sign in with Google" />
                       <SocialButton icon={<FacebookIcon />} aria-label="Sign in with Facebook" />
                       <SocialButton icon={<AppleIcon />} aria-label="Sign in with Apple" />
                    </div>

                    {/* Toggle Between Login/Register */}
                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                            <button
                                type="button"
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-orange-600 hover:text-orange-700 font-medium"
                            >
                                {isLogin ? 'Sign up' : 'Sign in'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;