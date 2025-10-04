import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

class MapControlButtons extends StatelessWidget {
  final MapController mapController;
  final LatLng currentLocation;

  const MapControlButtons({
    super.key,
    required this.mapController,
    required this.currentLocation,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        // Zoom in
        FloatingActionButton(
          mini: true,
          onPressed: () {
            mapController.move(
              mapController.camera.center,
              mapController.camera.zoom + 1,
            );
          },
          backgroundColor: Colors.white,
          foregroundColor: Colors.black,
          heroTag: "zoom_in",
          child: Icon(Icons.add),
        ),

        SizedBox(height: 8),

        // Zoom out
        FloatingActionButton(
          mini: true,
          onPressed: () {
            mapController.move(
              mapController.camera.center,
              mapController.camera.zoom - 1,
            );
          },
          backgroundColor: Colors.white,
          foregroundColor: Colors.black,
          heroTag: "zoom_out",
          child: Icon(Icons.remove),
        ),

        SizedBox(height: 8),

        // My location
        FloatingActionButton(
          onPressed: () {
            mapController.move(currentLocation, 15.0);
          },
          backgroundColor: Colors.orange,
          heroTag: "my_location",
          child: Icon(Icons.my_location),
        ),
      ],
    );
  }
}
