import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

class MapControlButtons extends StatelessWidget {
  final MapController mapController;
  final LatLng currentLocation;

  const MapControlButtons({
    Key? key,
    required this.mapController,
    required this.currentLocation,
  }) : super(key: key);

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
          child: Icon(Icons.add),
          backgroundColor: Colors.white,
          foregroundColor: Colors.black,
          heroTag: "zoom_in",
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
          child: Icon(Icons.remove),
          backgroundColor: Colors.white,
          foregroundColor: Colors.black,
          heroTag: "zoom_out",
        ),

        SizedBox(height: 8),

        // My location
        FloatingActionButton(
          onPressed: () {
            mapController.move(currentLocation, 15.0);
          },
          child: Icon(Icons.my_location),
          backgroundColor: Colors.orange,
          heroTag: "my_location",
        ),
      ],
    );
  }
}
