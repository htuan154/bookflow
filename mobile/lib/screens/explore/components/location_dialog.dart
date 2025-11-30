// import 'package:flutter/material.dart';
// import 'package:latlong2/latlong.dart';

// class LocationDialog {
//   static void show({
//     required BuildContext context,
//     required LatLng location,
//     required String address,
//     required VoidCallback onClose,
//     required VoidCallback onSearchNearby,
//   }) {
//     showDialog(
//       context: context,
//       builder: (context) => AlertDialog(
//         title: Row(
//           children: [
//             Icon(Icons.location_pin, color: Colors.red),
//             SizedBox(width: 8),
//             Text('Vị trí đã chọn'),
//           ],
//         ),
//         content: Column(
//           mainAxisSize: MainAxisSize.min,
//           crossAxisAlignment: CrossAxisAlignment.start,
//           children: [
//             Text('Địa chỉ:', style: TextStyle(fontWeight: FontWeight.bold)),
//             SizedBox(height: 4),
//             Text(address),
//             SizedBox(height: 12),
//             Text('Tọa độ:', style: TextStyle(fontWeight: FontWeight.bold)),
//             SizedBox(height: 4),
//             Text(
//               '${location.latitude.toStringAsFixed(6)}, ${location.longitude.toStringAsFixed(6)}',
//             ),
//           ],
//         ),
//         actions: [
//           TextButton(
//             onPressed: () {
//               onClose();
//               Navigator.pop(context);
//             },
//             child: Text('Xóa'),
//           ),
//           ElevatedButton(
//             onPressed: () {
//               Navigator.pop(context);
//               onSearchNearby();
//             },
//             child: Text('Tìm khách sạn gần đây'),
//             style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
//           ),
//         ],
//       ),
//     );
//   }
// }


import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';

class LocationDialog {
  static void show({
    required BuildContext context,
    required LatLng location,
    required String address,
    required VoidCallback onClose,
    required VoidCallback onSearchNearbyTouristLocations,
  }) {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: EdgeInsets.symmetric(horizontal: 20, vertical: 80),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.15),
                blurRadius: 20,
                spreadRadius: 0,
                offset: Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header với background màu
              Container(
                width: double.infinity,
                padding: EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.orange,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(20),
                    topRight: Radius.circular(20),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        Icons.location_pin,
                        color: Colors.orange,
                        size: 22,
                      ),
                    ),
                    SizedBox(width: 16),
                    Text(
                      'Vị trí đã chọn',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
              
              // Content
              Padding(
                padding: EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Địa chỉ section
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          margin: EdgeInsets.only(top: 2),
                          padding: EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: Colors.grey[100],
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            Icons.location_on,
                            color: Colors.grey[600],
                            size: 16,
                          ),
                        ),
                        SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Địa chỉ:',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.grey[600],
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                address,
                                style: TextStyle(
                                  fontSize: 15,
                                  color: Colors.grey[800],
                                  height: 1.4,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    
                    SizedBox(height: 24),
                    
                    // Buttons
                    Column(
                      children: [
                        // Nút tìm địa điểm - hiển thị full width
                        SizedBox(
                          width: double.infinity,
                          height: 50,
                          child: ElevatedButton(
                            onPressed: () {
                              Navigator.pop(context);
                              onSearchNearbyTouristLocations();
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green,
                              foregroundColor: Colors.white,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(15),
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.explore, size: 20),
                                SizedBox(width: 8),
                                Text(
                                  'Tìm địa điểm tham quan gần đây',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        SizedBox(height: 12),
                        // Nút xóa
                        SizedBox(
                          width: double.infinity,
                          height: 45,
                          child: OutlinedButton(
                            onPressed: () {
                              onClose();
                              Navigator.pop(context);
                            },
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.grey[700],
                              side: BorderSide(color: Colors.grey[300]!, width: 1.5),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(15),
                              ),
                              backgroundColor: Colors.grey[50],
                            ),
                            child: Text(
                              'Xóa vị trí',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}