import React, { useEffect } from 'react';

const ModalNotification = ({ message, type, onClose }) => {
  // Tự động ẩn modal notification sau 3s
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => onClose(), 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        zIndex: 99999,
        display: message ? 'block' : 'none',
      }} onClick={onClose} />
      
      {/* Modal Content */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 100000,
        minWidth: 400,
        maxWidth: 500,
        background: type === 'error' ? '#fee2e2' : '#e0f2fe',
        color: type === 'error' ? '#b91c1c' : '#0369a1',
        border: `2px solid ${type === 'error' ? '#f87171' : '#38bdf8'}`,
        borderRadius: 16,
        padding: '32px 48px',
        boxShadow: '0 8px 64px rgba(0,0,0,0.3)',
        fontWeight: 600,
        textAlign: 'center',
        fontSize: 18,
        display: message ? 'block' : 'none',
        pointerEvents: 'auto',
      }}>
        {message}
        <button onClick={onClose} style={{ 
          position: 'absolute', 
          top: 12, 
          right: 16, 
          color: '#888', 
          background: 'none', 
          border: 'none', 
          fontSize: 24, 
          cursor: 'pointer',
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          transition: 'background-color 0.2s'
        }}>×</button>
      </div>
    </>
  );
};

export default ModalNotification;
