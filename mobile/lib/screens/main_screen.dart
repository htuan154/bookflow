// // lib/screens/main_screen.dart
// import 'package:flutter/material.dart';
// // import 'home_screen.dart';
// // import 'explore_screen.dart';
// // import 'favourite_screen.dart';
// // import 'profile_screen.dart';

// class MainScreen extends StatefulWidget {
//   @override
//   _MainScreenState createState() => _MainScreenState();
// }

// class _MainScreenState extends State<MainScreen> {
//   int _currentIndex = 0;
  
//   // Danh sách các trang
//   final List<Widget> _pages = [
//     HomeScreen(),
//     ExploreScreen(),
//     FavouriteScreen(),
//     ProfileScreen(),
//   ];

//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       body: IndexedStack(
//         index: _currentIndex,
//         children: _pages,
//       ),
//       bottomNavigationBar: BottomNavigationBar(
//         type: BottomNavigationBarType.fixed,
//         currentIndex: _currentIndex,
//         onTap: (index) {
//           setState(() {
//             _currentIndex = index;
//           });
//         },
//         selectedItemColor: Colors.orange,
//         unselectedItemColor: Colors.grey,
//         items: [
//           BottomNavigationBarItem(
//             icon: Icon(Icons.home),
//             label: 'Home',
//           ),
//           BottomNavigationBarItem(
//             icon: Icon(Icons.explore),
//             label: 'Explore',
//           ),
//           BottomNavigationBarItem(
//             icon: Icon(Icons.favorite),
//             label: 'Favourite',
//           ),
//           BottomNavigationBarItem(
//             icon: Icon(Icons.person),
//             label: 'Profile',
//           ),
//         ],
//       ),
//     );
//   }
// }

// // lib/screens/home_screen.dart
// //import 'package:flutter/material.dart';

// class HomeScreen extends StatelessWidget {
//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       appBar: AppBar(
//         title: Row(
//           children: [
//             Icon(Icons.location_on, color: Colors.red),
//             Text('New York, USA'),
//             Icon(Icons.keyboard_arrow_down),
//           ],
//         ),
//         actions: [
//           IconButton(
//             icon: Icon(Icons.notifications, color: Colors.orange),
//             onPressed: () {},
//           ),
//         ],
//         backgroundColor: Colors.white,
//         foregroundColor: Colors.black,
//         elevation: 0,
//       ),
//       body: SingleChildScrollView(
//         padding: EdgeInsets.all(16),
//         child: Column(
//           crossAxisAlignment: CrossAxisAlignment.start,
//           children: [
//             // Search Bar
//             Container(
//               padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
//               decoration: BoxDecoration(
//                 color: Colors.grey[100],
//                 borderRadius: BorderRadius.circular(8),
//               ),
//               child: Row(
//                 children: [
//                   Icon(Icons.search, color: Colors.grey),
//                   SizedBox(width: 8),
//                   Text('Search', style: TextStyle(color: Colors.grey)),
//                 ],
//               ),
//             ),
            
//             SizedBox(height: 20),
            
//             // Recommended Hotel Section
//             Row(
//               mainAxisAlignment: MainAxisAlignment.spaceBetween,
//               children: [
//                 Text(
//                   'Recommended Hotel',
//                   style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
//                 ),
//                 Text(
//                   'See all',
//                   style: TextStyle(color: Colors.orange),
//                 ),
//               ],
//             ),
            
//             SizedBox(height: 16),
            
//             // Hotel Cards Row
//             SingleChildScrollView(
//               scrollDirection: Axis.horizontal,
//               child: Row(
//                 children: [
//                   _buildHotelCard(
//                     'Hotel Galaxy',
//                     '\$120',
//                     '10% OFF',
//                     4.8,
//                     'assets/hotel1.jpg',
//                   ),
//                   SizedBox(width: 16),
//                   _buildHotelCard(
//                     'Marlot INN',
//                     '\$100',
//                     '10% OFF',
//                     4.5,
//                     'assets/hotel2.jpg',
//                   ),
//                 ],
//               ),
//             ),
            
//             SizedBox(height: 24),
            
//             // Nearby Hotel Section
//             Row(
//               mainAxisAlignment: MainAxisAlignment.spaceBetween,
//               children: [
//                 Text(
//                   'Nearby Hotel',
//                   style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
//                 ),
//                 Text(
//                   'See all',
//                   style: TextStyle(color: Colors.orange),
//                 ),
//               ],
//             ),
            
//             SizedBox(height: 16),
            
//             // Nearby Hotel Card
//             _buildNearbyHotelCard(
//               'Golden valley',
//               '\$150',
//               '10% OFF',
//               4.8,
//               'New York, USA',
//               'assets/hotel3.jpg',
//             ),
//           ],
//         ),
//       ),
//     );
//   }
  
//   Widget _buildHotelCard(String name, String price, String discount, double rating, String imagePath) {
//     return Container(
//       width: 160,
//       decoration: BoxDecoration(
//         color: Colors.white,
//         borderRadius: BorderRadius.circular(12),
//         boxShadow: [
//           BoxShadow(
//             color: Colors.grey.withOpacity(0.1),
//             spreadRadius: 1,
//             blurRadius: 8,
//           ),
//         ],
//       ),
//       child: Column(
//         crossAxisAlignment: CrossAxisAlignment.start,
//         children: [
//           Stack(
//             children: [
//               Container(
//                 height: 120,
//                 decoration: BoxDecoration(
//                   color: Colors.grey[300],
//                   borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
//                 ),
//                 child: Center(child: Icon(Icons.hotel, size: 40, color: Colors.grey)),
//               ),
//               Positioned(
//                 top: 8,
//                 left: 8,
//                 child: Container(
//                   padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
//                   decoration: BoxDecoration(
//                     color: Colors.red,
//                     borderRadius: BorderRadius.circular(4),
//                   ),
//                   child: Text(
//                     discount,
//                     style: TextStyle(color: Colors.white, fontSize: 10),
//                   ),
//                 ),
//               ),
//               Positioned(
//                 top: 8,
//                 right: 8,
//                 child: Icon(Icons.favorite_border, color: Colors.white),
//               ),
//             ],
//           ),
//           Padding(
//             padding: EdgeInsets.all(8),
//             child: Column(
//               crossAxisAlignment: CrossAxisAlignment.start,
//               children: [
//                 Text(name, style: TextStyle(fontWeight: FontWeight.bold)),
//                 SizedBox(height: 4),
//                 Row(
//                   children: [
//                     Icon(Icons.star, color: Colors.orange, size: 14),
//                     Text(' $rating', style: TextStyle(fontSize: 12)),
//                   ],
//                 ),
//                 SizedBox(height: 4),
//                 Text(
//                   '$price/Day',
//                   style: TextStyle(
//                     color: Colors.orange,
//                     fontWeight: FontWeight.bold,
//                   ),
//                 ),
//               ],
//             ),
//           ),
//         ],
//       ),
//     );
//   }
  
//   Widget _buildNearbyHotelCard(String name, String price, String discount, double rating, String location, String imagePath) {
//     return Container(
//       decoration: BoxDecoration(
//         color: Colors.white,
//         borderRadius: BorderRadius.circular(12),
//         boxShadow: [
//           BoxShadow(
//             color: Colors.grey.withOpacity(0.1),
//             spreadRadius: 1,
//             blurRadius: 8,
//           ),
//         ],
//       ),
//       child: Row(
//         children: [
//           Stack(
//             children: [
//               Container(
//                 width: 100,
//                 height: 100,
//                 decoration: BoxDecoration(
//                   color: Colors.grey[300],
//                   borderRadius: BorderRadius.horizontal(left: Radius.circular(12)),
//                 ),
//                 child: Center(child: Icon(Icons.hotel, size: 30, color: Colors.grey)),
//               ),
//               Positioned(
//                 top: 8,
//                 left: 8,
//                 child: Container(
//                   padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
//                   decoration: BoxDecoration(
//                     color: Colors.red,
//                     borderRadius: BorderRadius.circular(4),
//                   ),
//                   child: Text(
//                     discount,
//                     style: TextStyle(color: Colors.white, fontSize: 10),
//                   ),
//                 ),
//               ),
//             ],
//           ),
//           Expanded(
//             child: Padding(
//               padding: EdgeInsets.all(12),
//               child: Column(
//                 crossAxisAlignment: CrossAxisAlignment.start,
//                 children: [
//                   Row(
//                     mainAxisAlignment: MainAxisAlignment.spaceBetween,
//                     children: [
//                       Text(name, style: TextStyle(fontWeight: FontWeight.bold)),
//                       Icon(Icons.favorite_border, color: Colors.grey),
//                     ],
//                   ),
//                   SizedBox(height: 4),
//                   Row(
//                     children: [
//                       Icon(Icons.location_on, color: Colors.grey, size: 14),
//                       Text(location, style: TextStyle(color: Colors.grey, fontSize: 12)),
//                     ],
//                   ),
//                   SizedBox(height: 4),
//                   Row(
//                     mainAxisAlignment: MainAxisAlignment.spaceBetween,
//                     children: [
//                       Text(
//                         '$price/Day',
//                         style: TextStyle(
//                           color: Colors.orange,
//                           fontWeight: FontWeight.bold,
//                         ),
//                       ),
//                       Row(
//                         children: [
//                           Icon(Icons.star, color: Colors.orange, size: 14),
//                           Text(' $rating', style: TextStyle(fontSize: 12)),
//                         ],
//                       ),
//                     ],
//                   ),
//                 ],
//               ),
//             ),
//           ),
//         ],
//       ),
//     );
//   }
// }

// // lib/screens/explore_screen.dart
// //import 'package:flutter/material.dart';

// class ExploreScreen extends StatelessWidget {
//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       appBar: AppBar(
//         title: Text('Explore'),
//         backgroundColor: Colors.white,
//         foregroundColor: Colors.black,
//         elevation: 0,
//       ),
//       body: Center(
//         child: Text(
//           'Explore Screen',
//           style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
//         ),
//       ),
//     );
//   }
// }

// // lib/screens/favourite_screen.dart
// //import 'package:flutter/material.dart';

// class FavouriteScreen extends StatelessWidget {
//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       appBar: AppBar(
//         title: Text('Favourite'),
//         backgroundColor: Colors.white,
//         foregroundColor: Colors.black,
//         elevation: 0,
//       ),
//       body: Center(
//         child: Text(
//           'Favourite Screen',
//           style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
//         ),
//       ),
//     );
//   }
// }

// // lib/screens/profile_screen.dart
// //import 'package:flutter/material.dart';

// class ProfileScreen extends StatelessWidget {
//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       appBar: AppBar(
//         title: Text('Profile'),
//         backgroundColor: Colors.white,
//         foregroundColor: Colors.black,
//         elevation: 0,
//       ),
//       body: Center(
//         child: Text(
//           'Profile Screen',
//           style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
//         ),
//       ),
//     );
//   }
// }

// // lib/main.dart - Cập nhật file main.dart
// // import 'package:flutter/material.dart';
// // import 'screens/main_screen.dart';

// void main() {
//   runApp(MyApp());
// }

// class MyApp extends StatelessWidget {
//   @override
//   Widget build(BuildContext context) {
//     return MaterialApp(
//       title: 'Hotel Booking App',
//       theme: ThemeData(
//         primarySwatch: Colors.orange,
//         visualDensity: VisualDensity.adaptivePlatformDensity,
//       ),
//       home: MainScreen(),
//       debugShowCheckedModeBanner: false,
//     );
//   }
// }