import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';

class LocationDialog {
  static void show({
    required BuildContext context,
    required LatLng location,
    required String address,
    required VoidCallback onClose,
    required VoidCallback onSearchNearby,
  }) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.location_pin, color: Colors.red),
            SizedBox(width: 8),
            Text('Vị trí đã chọn'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Địa chỉ:', style: TextStyle(fontWeight: FontWeight.bold)),
            SizedBox(height: 4),
            Text(address),
            SizedBox(height: 12),
            Text('Tọa độ:', style: TextStyle(fontWeight: FontWeight.bold)),
            SizedBox(height: 4),
            Text(
              '${location.latitude.toStringAsFixed(6)}, ${location.longitude.toStringAsFixed(6)}',
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              onClose();
              Navigator.pop(context);
            },
            child: Text('Xóa'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              onSearchNearby();
            },
            child: Text('Tìm khách sạn gần đây'),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
          ),
        ],
      ),
    );
  }
}
