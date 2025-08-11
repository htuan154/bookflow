// // lib/screens/home_screen.dart
// import 'package:flutter/material.dart';
// import '../home/components/hotel_card.dart';
// import '../home/components/nearby_hotel_card.dart';

// class HomeScreen extends StatelessWidget {
//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       appBar: AppBar(
//         title: Row(
//           children: [
//             Icon(Icons.location_on, color: Colors.orange),
//             SizedBox(width: 4),
//             Text('New York, USA', style: TextStyle(fontSize: 16)),
//             Icon(Icons.keyboard_arrow_down),
//           ],
//         ),
//         actions: [
//           Stack(
//             children: [
//               IconButton(
//                 icon: Icon(Icons.notifications_outlined, color: Colors.orange),
//                 onPressed: () {
//                   ScaffoldMessenger.of(context).showSnackBar(
//                     SnackBar(content: Text('Notifications clicked!')),
//                   );
//                 },
//               ),
//               Positioned(
//                 right: 8,
//                 top: 8,
//                 child: Container(
//                   width: 8,
//                   height: 8,
//                   decoration: BoxDecoration(
//                     color: Colors.red,
//                     shape: BoxShape.circle,
//                   ),
//                 ),
//               ),
//             ],
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
//             GestureDetector(
//               onTap: () {
//                 ScaffoldMessenger.of(context).showSnackBar(
//                   SnackBar(content: Text('Search clicked!')),
//                 );
//               },
//               child: Container(
//                 padding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
//                 decoration: BoxDecoration(
//                   color: Colors.grey[100],
//                   borderRadius: BorderRadius.circular(12),
//                 ),
//                 child: Row(
//                   children: [
//                     Icon(Icons.search, color: Colors.grey),
//                     SizedBox(width: 12),
//                     Text('Search', style: TextStyle(color: Colors.grey[600], fontSize: 16)),
//                   ],
//                 ),
//               ),
//             ),
            
//             SizedBox(height: 24),
            
//             // Recommended Hotel Section
//             Row(
//               mainAxisAlignment: MainAxisAlignment.spaceBetween,
//               children: [
//                 Text(
//                   'Recommended Hotel',
//                   style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
//                 ),
//                 GestureDetector(
//                   onTap: () {
//                     ScaffoldMessenger.of(context).showSnackBar(
//                       SnackBar(content: Text('See all recommended hotels clicked!')),
//                     );
//                   },
//                   child: Text(
//                     'See all',
//                     style: TextStyle(color: Colors.orange, fontSize: 16, fontWeight: FontWeight.w500),
//                   ),
//                 ),
//               ],
//             ),
            
//             SizedBox(height: 16),
            
//             // Hotel Cards Row
//             SingleChildScrollView(
//               scrollDirection: Axis.horizontal,
//               child: Row(
//                 children: [
//                   HotelCard(
//                     name: 'Hotel Galaxy',
//                     price: '\$120',
//                     discount: '10% Off',
//                     rating: 4.8,
//                     location: 'New York, USA',
//                     imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
//                   ),
//                   SizedBox(width: 16),
//                   HotelCard(
//                     name: 'Mariot INN',
//                     price: '\$100',
//                     discount: '10% Off',
//                     rating: 4.8,
//                     location: 'New York, USA',
//                     imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400',
//                   ),
//                 ],
//               ),
//             ),
            
//             SizedBox(height: 32),
            
//             // Nearby Hotel Section
//             Row(
//               mainAxisAlignment: MainAxisAlignment.spaceBetween,
//               children: [
//                 Text(
//                   'Nearby Hotel',
//                   style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
//                 ),
//                 GestureDetector(
//                   onTap: () {
//                     ScaffoldMessenger.of(context).showSnackBar(
//                       SnackBar(content: Text('See all nearby hotels clicked!')),
//                     );
//                   },
//                   child: Text(
//                     'See all',
//                     style: TextStyle(color: Colors.orange, fontSize: 16, fontWeight: FontWeight.w500),
//                   ),
//                 ),
//               ],
//             ),
            
//             SizedBox(height: 16),
            
//             // Nearby Hotel Cards
//             NearbyHotelCard(
//               name: 'Golden valley',
//               price: '\$150',
//               discount: '10% Off',
//               rating: 4.8,
//               location: 'New York, USA',
//               imageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400',
//             ),
            
//             NearbyHotelCard(
//               name: 'Resort Paradise',
//               price: '\$180',
//               discount: '15% Off',
//               rating: 4.8,
//               location: 'New York, USA',
//               imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400',
//             ),
//           ],
//         ),
//       ),

//     );
//   }
  
//   Widget _buildHotelCard(BuildContext context, String name, String price, String discount, double rating, String location, String imageUrl) {
//     return GestureDetector(
//       onTap: () {
//         ScaffoldMessenger.of(context).showSnackBar(
//           SnackBar(content: Text('$name hotel clicked!')),
//         );
//       },
//       child: Container(
//         width: 180,
//         decoration: BoxDecoration(
//           color: Colors.white,
//           borderRadius: BorderRadius.circular(16),
//           boxShadow: [
//             BoxShadow(
//               color: Colors.grey.withOpacity(0.15),
//               spreadRadius: 1,
//               blurRadius: 10,
//               offset: Offset(0, 2),
//             ),
//           ],
//         ),
//         child: Column(
//           crossAxisAlignment: CrossAxisAlignment.start,
//           children: [
//             Stack(
//               children: [
//                 Container(
//                   height: 140,
//                   decoration: BoxDecoration(
//                     borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
//                     image: DecorationImage(
//                       image: NetworkImage(imageUrl),
//                       fit: BoxFit.cover,
//                       onError: (exception, stackTrace) {},
//                     ),
//                   ),
//                   child: Container(
//                     decoration: BoxDecoration(
//                       borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
//                       gradient: LinearGradient(
//                         begin: Alignment.topCenter,
//                         end: Alignment.bottomCenter,
//                         colors: [Colors.transparent, Colors.black.withOpacity(0.1)],
//                       ),
//                     ),
//                   ),
//                 ),
//                 Positioned(
//                   top: 12,
//                   left: 12,
//                   child: Container(
//                     padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
//                     decoration: BoxDecoration(
//                       color: Colors.orange,
//                       borderRadius: BorderRadius.circular(6),
//                     ),
//                     child: Text(
//                       discount,
//                       style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
//                     ),
//                   ),
//                 ),
//                 Positioned(
//                   top: 12,
//                   right: 12,
//                   child: GestureDetector(
//                     onTap: () {
//                       ScaffoldMessenger.of(context).showSnackBar(
//                         SnackBar(content: Text('$name added to favorites!')),
//                       );
//                     },
//                     child: Container(
//                       padding: EdgeInsets.all(6),
//                       decoration: BoxDecoration(
//                         color: Colors.white.withOpacity(0.9),
//                         shape: BoxShape.circle,
//                       ),
//                       child: Icon(Icons.favorite_outline, color: Colors.grey[600], size: 18),
//                     ),
//                   ),
//                 ),
//               ],
//             ),
//             Padding(
//               padding: EdgeInsets.all(12),
//               child: Column(
//                 crossAxisAlignment: CrossAxisAlignment.start,
//                 children: [
//                   Text(
//                     name, 
//                     style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
//                     maxLines: 1,
//                     overflow: TextOverflow.ellipsis,
//                   ),
//                   SizedBox(height: 4),
//                   Row(
//                     children: [
//                       Icon(Icons.location_on, color: Colors.grey[500], size: 14),
//                       SizedBox(width: 2),
//                       Expanded(
//                         child: Text(
//                           location, 
//                           style: TextStyle(color: Colors.grey[500], fontSize: 12),
//                           maxLines: 1,
//                           overflow: TextOverflow.ellipsis,
//                         ),
//                       ),
//                     ],
//                   ),
//                   SizedBox(height: 8),
//                   Row(
//                     mainAxisAlignment: MainAxisAlignment.spaceBetween,
//                     children: [
//                       Text(
//                         '$price/Day',
//                         style: TextStyle(
//                           color: Colors.orange,
//                           fontWeight: FontWeight.bold,
//                           fontSize: 16,
//                         ),
//                       ),
//                       Row(
//                         children: [
//                           Icon(Icons.star, color: Colors.orange, size: 16),
//                           SizedBox(width: 2),
//                           Text(
//                             '$rating', 
//                             style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
//                           ),
//                         ],
//                       ),
//                     ],
//                   ),
//                 ],
//               ),
//             ),
//           ],
//         ),
//       ),
//     );
//   }
  
//   Widget _buildNearbyHotelCard(BuildContext context, String name, String price, String discount, double rating, String location, String imageUrl) {
//     return GestureDetector(
//       onTap: () {
//         ScaffoldMessenger.of(context).showSnackBar(
//           SnackBar(content: Text('$name hotel clicked!')),
//         );
//       },
//       child: Container(
//         decoration: BoxDecoration(
//           color: Colors.white,
//           borderRadius: BorderRadius.circular(16),
//           boxShadow: [
//             BoxShadow(
//               color: Colors.grey.withOpacity(0.15),
//               spreadRadius: 1,
//               blurRadius: 10,
//               offset: Offset(0, 2),
//             ),
//           ],
//         ),
//         child: Row(
//           children: [
//             Stack(
//               children: [
//                 Container(
//                   width: 120,
//                   height: 120,
//                   decoration: BoxDecoration(
//                     borderRadius: BorderRadius.horizontal(left: Radius.circular(16)),
//                     image: DecorationImage(
//                       image: NetworkImage(imageUrl),
//                       fit: BoxFit.cover,
//                       onError: (exception, stackTrace) {},
//                     ),
//                   ),
//                 ),
//                 Positioned(
//                   top: 12,
//                   left: 12,
//                   child: Container(
//                     padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
//                     decoration: BoxDecoration(
//                       color: Colors.orange,
//                       borderRadius: BorderRadius.circular(6),
//                     ),
//                     child: Text(
//                       discount,
//                       style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
//                     ),
//                   ),
//                 ),
//               ],
//             ),
//             Expanded(
//               child: Padding(
//                 padding: EdgeInsets.all(16),
//                 child: Column(
//                   crossAxisAlignment: CrossAxisAlignment.start,
//                   children: [
//                     Row(
//                       mainAxisAlignment: MainAxisAlignment.spaceBetween,
//                       children: [
//                         Expanded(
//                           child: Text(
//                             name, 
//                             style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
//                             maxLines: 1,
//                             overflow: TextOverflow.ellipsis,
//                           ),
//                         ),
//                         GestureDetector(
//                           onTap: () {
//                             ScaffoldMessenger.of(context).showSnackBar(
//                               SnackBar(content: Text('$name added to favorites!')),
//                             );
//                           },
//                           child: Icon(Icons.favorite_outline, color: Colors.grey[400]),
//                         ),
//                       ],
//                     ),
//                     SizedBox(height: 6),
//                     Row(
//                       children: [
//                         Icon(Icons.location_on, color: Colors.grey[500], size: 14),
//                         SizedBox(width: 4),
//                         Text(location, style: TextStyle(color: Colors.grey[500], fontSize: 12)),
//                       ],
//                     ),
//                     SizedBox(height: 12),
//                     Row(
//                       mainAxisAlignment: MainAxisAlignment.spaceBetween,
//                       children: [
//                         Text(
//                           '$price/Day',
//                           style: TextStyle(
//                             color: Colors.orange,
//                             fontWeight: FontWeight.bold,
//                             fontSize: 16,
//                           ),
//                         ),
//                         Row(
//                           children: [
//                             Icon(Icons.star, color: Colors.orange, size: 16),
//                             SizedBox(width: 2),
//                             Text(
//                               '$rating', 
//                               style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
//                             ),
//                           ],
//                         ),
//                       ],
//                     ),
//                   ],
//                 ),
//               ),
//             ),
//           ],
//         ),
//       ),
//     );
//   }
// }

// lib/screens/home_screen.dart
import 'package:flutter/material.dart';
import '../home/components/hotel_card.dart';
import '../home/components/nearby_hotel_card.dart';
import '../home/hotel/hotel_screen.dart'; 

class HomeScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Icon(Icons.location_on, color: Colors.orange),
            SizedBox(width: 4),
            Text('New York, USA', style: TextStyle(fontSize: 16)),
            Icon(Icons.keyboard_arrow_down),
          ],
        ),
        actions: [
          Stack(
            children: [
              IconButton(
                icon: Icon(Icons.notifications_outlined, color: Colors.orange),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Notifications clicked!')),
                  );
                },
              ),
              Positioned(
                right: 8,
                top: 8,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          ),
        ],
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Search Bar
            GestureDetector(
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Search clicked!')),
                );
              },
              child: Container(
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(Icons.search, color: Colors.grey),
                    SizedBox(width: 12),
                    Text(
                      'Search',
                      style: TextStyle(color: Colors.grey[600], fontSize: 16),
                    ),
                  ],
                ),
              ),
            ),
            SizedBox(height: 24),

            // Recommended Hotel Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Recommended Hotel',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                GestureDetector(
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('See all recommended hotels clicked!')),
                    );
                  },
                  child: Text(
                    'See all',
                    style: TextStyle(
                      color: Colors.orange,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 16),

            // Hotel Cards Row
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  HotelCard(
                    name: 'Hotel Galaxy',
                    price: '\$120',
                    discount: '10% Off',
                    rating: 4.8,
                    location: 'New York, USA',
                    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => HotelDetailScreen(),
                        ),
                      );
                    },
                  ),
                  SizedBox(width: 16),
                  HotelCard(
                    name: 'Mariot INN',
                    price: '\$100',
                    discount: '10% Off',
                    rating: 4.8,
                    location: 'New York, USA',
                    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => HotelDetailScreen(),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
            SizedBox(height: 32),

            // Nearby Hotel Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Nearby Hotel',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                GestureDetector(
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('See all nearby hotels clicked!')),
                    );
                  },
                  child: Text(
                    'See all',
                    style: TextStyle(
                      color: Colors.orange,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 16),

            // Nearby Hotel Cards
            NearbyHotelCard(
              name: 'Golden valley',
              price: '\$150',
              discount: '10% Off',
              rating: 4.8,
              location: 'New York, USA',
              imageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400',
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => HotelDetailScreen(),
                  ),
                );
              },
            ),
            NearbyHotelCard(
              name: 'Resort Paradise',
              price: '\$180',
              discount: '15% Off',
              rating: 4.8,
              location: 'New York, USA',
              imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400',
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => HotelDetailScreen(),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}