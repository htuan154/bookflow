import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';

class SelectedLocationInfo extends StatelessWidget {
  final LatLng selectedLocation;
  final String selectedAddress;
  final VoidCallback onClose;
  final VoidCallback onSearchNearby;

  const SelectedLocationInfo({
    super.key,
    required this.selectedLocation,
    required this.selectedAddress,
    required this.onClose,
    required this.onSearchNearby,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.black26, blurRadius: 8, offset: Offset(0, 2)),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.location_pin, color: Colors.red, size: 20),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Vị trí đã chọn',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
              ),
              IconButton(icon: Icon(Icons.close, size: 20), onPressed: onClose),
            ],
          ),
          SizedBox(height: 4),
          Text(
            selectedAddress,
            style: TextStyle(fontSize: 12, color: Colors.grey[600]),
          ),
          SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: onSearchNearby,
                  style: OutlinedButton.styleFrom(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    textStyle: TextStyle(fontSize: 12),
                  ),
                  child: Text('Tìm khách sạn gần đây'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
