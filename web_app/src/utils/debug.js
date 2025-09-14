// // Debug utility để kiểm tra auth status
// export const debugAuth = () => {
//   const token = localStorage.getItem('token');
//   const user = localStorage.getItem('user');
  
//   console.log('🔍 DEBUG AUTH STATUS:');
//   console.log('Token exists:', !!token);
//   console.log('Token value:', token ? `${token.substring(0, 20)}...` : 'null');
//   console.log('User exists:', !!user);
//   console.log('User data:', user ? JSON.parse(user) : 'null');
  
//   return { token, user: user ? JSON.parse(user) : null };
// };

// export const testHotelAPI = async (hotelId) => {
//   try {
//     console.log('🧪 Testing hotel API endpoints for ID:', hotelId);
    
//     // Test direct fetch
//     const response = await fetch(`http://localhost:8080/api/v1/hotels/${hotelId}`, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
//       }
//     });
    
//     console.log('🧪 API Response status:', response.status);
//     const data = await response.text();
//     console.log('🧪 API Response data:', data);
    
//     return { status: response.status, data };
//   } catch (error) {
//     console.error('🧪 API Test error:', error);
//     return { error: error.message };
//   }
// };