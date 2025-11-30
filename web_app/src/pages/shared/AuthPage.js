import React from 'react';
import LoginForm from '../../components/auth/LoginForm';
import ImageSlider from '../../components/auth/ImageSlider';

const AuthPage = () => {

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Full-screen background slider with blur */}
            <div className="absolute inset-0">
                <ImageSlider />
            </div>

            {/* Content overlay - 2 columns on large screens */}
            <div className="relative z-10 min-h-screen flex items-center justify-center p-8 lg:p-12">
                <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                    {/* Left: Clear image preview (hidden on mobile) */}
                    <div className="hidden lg:block lg:w-1/2">
                        <ImageSlider showClearImage={true} />
                    </div>

                    {/* Right: Login form */}
                    <div className="w-full lg:w-1/2 max-w-md">
                        <div className="bg-white rounded-2xl shadow-2xl p-8">
                            <LoginForm />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;