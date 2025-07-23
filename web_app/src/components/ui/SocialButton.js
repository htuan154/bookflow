import React from 'react';

const SocialButton = ({ icon, ...props }) => (
    <button 
        {...props} 
        className="flex-1 flex items-center justify-center py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
    >
        {icon}
    </button>
);

export default SocialButton;