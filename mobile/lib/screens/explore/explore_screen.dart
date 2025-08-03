// lib/screens/explore_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import '../../services/geocoding_service.dart';
import 'components/hotel_model.dart';
import 'components/map_markers.dart';
import 'components/map_search_bar.dart';
import 'components/hotel_details_bottom_sheet.dart';
import 'components/loading_indicator.dart';
import 'components/selected_location_info.dart';
import 'components/hotel_count_badge.dart';
import 'components/location_dialog.dart';

// Import your geocoding service
// import 'path/to/your/geocoding_service.dart';

class ExploreScreen extends StatefulWidget {
  @override
  _ExploreScreenState createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  final MapController _mapController = MapController();
  LatLng _currentLocation = LatLng(10.8231, 106.6297); // HCM City default
  List<Marker> _markers = [];
  List<Hotel> _hotels = [];
  bool _isLoadingLocation = false;
  bool _isLoadingHotels = false;
  String _selectedMapStyle = 'standard';
  double _currentZoom = 13.0;
  bool _hasLocationPermission = false;
  bool _hasCheckedPermission = false;

  // Thêm các biến cho click location
  LatLng? _selectedLocation;
  String? _selectedAddress;
  bool _isLoadingAddress = false;

  // Map styles
  final Map<String, String> _mapStyles = {
    'standard': 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    'satellite':
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    'dark':
        'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
    'light':
        'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
  };

  @override
  void initState() {
    super.initState();
    _checkLocationPermission(); // Chỉ kiểm tra permission, không yêu cầu GPS
    _loadDemoHotels();
  }

  // Xử lý sự kiện click vào map
  void _onTapMap(TapPosition tapPosition, LatLng latLng) async {
    setState(() {
      _selectedLocation = latLng;
      _selectedAddress = null;
      _isLoadingAddress = true;
    });

    // Cập nhật markers ngay lập tức
    _updateMarkers();

    try {
      final address = await GeocodingService.getAddressFromCoordinates(
        latLng.latitude,
        latLng.longitude,
      );

      setState(() {
        _selectedAddress = address ?? 'Không tìm thấy địa chỉ';
        _isLoadingAddress = false;
      });

      // Hiển thị dialog với thông tin địa chỉ
      _showLocationDialog(latLng, _selectedAddress!);
    } catch (e) {
      setState(() {
        _selectedAddress = 'Lỗi khi lấy địa chỉ';
        _isLoadingAddress = false;
      });
      print('Error getting address: $e');
    }
  }

  // Hiển thị dialog thông tin địa chỉ được chọn
  void _showLocationDialog(LatLng location, String address) {
    LocationDialog.show(
      context: context,
      location: location,
      address: address,
      onClose: () {
        setState(() {
          _selectedLocation = null;
          _selectedAddress = null;
        });
        _updateMarkers();
      },
      onSearchNearby: () => _searchHotelsNearLocation(location),
    );
  }

  // Tìm khách sạn gần vị trí được chọn
  void _searchHotelsNearLocation(LatLng location) {
    // Tính khoảng cách đến các khách sạn và sắp xếp
    List<Hotel> nearbyHotels = _hotels.map((hotel) {
      return hotel;
    }).toList();

    // Sắp xếp theo khoảng cách
    nearbyHotels.sort((a, b) {
      double distanceA = Geolocator.distanceBetween(
        location.latitude,
        location.longitude,
        a.location.latitude,
        a.location.longitude,
      );
      double distanceB = Geolocator.distanceBetween(
        location.latitude,
        location.longitude,
        b.location.latitude,
        b.location.longitude,
      );
      return distanceA.compareTo(distanceB);
    });

    // Hiển thị khách sạn gần nhất
    if (nearbyHotels.isNotEmpty) {
      Hotel nearestHotel = nearbyHotels.first;
      double distance = Geolocator.distanceBetween(
        location.latitude,
        location.longitude,
        nearestHotel.location.latitude,
        nearestHotel.location.longitude,
      );

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Khách sạn gần nhất: ${nearestHotel.name} (${(distance / 1000).toStringAsFixed(1)} km)',
          ),
          action: SnackBarAction(
            label: 'Xem',
            onPressed: () => _showHotelDetails(nearestHotel),
          ),
          duration: Duration(seconds: 4),
        ),
      );

      // Di chuyển đến khách sạn gần nhất
      _mapController.move(nearestHotel.location, 16.0);
    }
  }

  // Kiểm tra permission GPS mà không yêu cầu ngay lập tức
  Future<void> _checkLocationPermission() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _hasLocationPermission = false;
          _hasCheckedPermission = true;
        });
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();

      setState(() {
        _hasLocationPermission =
            permission == LocationPermission.always ||
            permission == LocationPermission.whileInUse;
        _hasCheckedPermission = true;
      });

      // Nếu có permission, tự động lấy vị trí hiện tại một lần
      if (_hasLocationPermission) {
        _getCurrentLocationSilently();
      }
    } catch (e) {
      setState(() {
        _hasLocationPermission = false;
        _hasCheckedPermission = true;
      });
      print('Error checking location permission: $e');
    }
  }

  // Lấy vị trí hiện tại mà không hiển thị dialog (chỉ khi đã có permission)
  Future<void> _getCurrentLocationSilently() async {
    try {
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      setState(() {
        _currentLocation = LatLng(position.latitude, position.longitude);
      });

      _updateMarkers();
    } catch (e) {
      print('Error getting location silently: $e');
    }
  }

  // Lấy vị trí hiện tại (được gọi khi người dùng nhấn nút My Location)
  Future<void> _getCurrentLocation() async {
    setState(() {
      _isLoadingLocation = true;
    });

    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();

      if (!serviceEnabled) {
        _showLocationPermissionDialog(
          'Location Services Disabled',
          'Please enable location services to find hotels near you.',
        );
        setState(() {
          _isLoadingLocation = false;
        });
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          _showLocationPermissionDialog(
            'Location Permission Denied',
            'Location permissions are denied. Using default location.',
          );
          setState(() {
            _isLoadingLocation = false;
          });
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        _showLocationPermissionDialog(
          'Location Permission Permanently Denied',
          'Location permissions are permanently denied, we cannot request permissions.',
        );
        setState(() {
          _isLoadingLocation = false;
        });
        return;
      }

      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      setState(() {
        _currentLocation = LatLng(position.latitude, position.longitude);
        _isLoadingLocation = false;
      });

      // Animate to current location
      _mapController.move(_currentLocation, 15.0);
      _updateMarkers();
    } catch (e) {
      setState(() {
        _isLoadingLocation = false;
      });
      print('Error getting location: $e');
    }
  }

  // Convert address to coordinates using your geocoding service
  Future<LatLng?> _getCoordinatesFromAddress(String address) async {
    try {
      final result = await GeocodingService.getCoordinatesFromAddress(address);
      if (result != null) {
        return LatLng(result['latitude']!, result['longitude']!);
      }
    } catch (e) {
      print('Error geocoding address "$address": $e');
    }
    return null;
  }

  // Load demo hotels data with addresses
  Future<void> _loadDemoHotels() async {
    setState(() {
      _isLoadingHotels = true;
    });

    // Hotel data with addresses instead of coordinates
    final List<Map<String, dynamic>> hotelData = [
      {
        'id': '1',
        'name': 'Hotel Galaxy',
        'description': 'Luxury hotel in city center with amazing views',
        'price': 120,
        'rating': 4.8,
        'address': '123 Nguyễn Huệ, Quận 1, TP.HCM',
        'category': 'luxury',
        'amenities': ['WiFi', 'Pool', 'Spa', 'Restaurant'],
        'images': [
          'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400',
        ],
      },
      {
        'id': '2',
        'name': 'Golden Valley Resort',
        'description': 'Premium resort with pool and spa facilities',
        'price': 150,
        'rating': 4.9,
        'address': '456 Lê Lợi, Quận 1, TP.HCM',
        'category': 'resort',
        'amenities': ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym'],
        'images': [
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400',
        ],
      },
      {
        'id': '3',
        'name': 'Marlot INN',
        'description': 'Comfortable business hotel near airport',
        'price': 100,
        'rating': 4.5,
        'address': '789 Võ Văn Kiệt, Quận 5, TP.HCM',
        'category': 'business',
        'amenities': ['WiFi', 'Restaurant', 'Meeting Room'],
        'images': [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
        ],
      },
      {
        'id': '4',
        'name': 'Riverside Hotel',
        'description': 'Beautiful riverside location with great sunset views',
        'price': 90,
        'rating': 4.6,
        'address': '321 Tôn Đức Thắng, Quận 1, TP.HCM',
        'category': 'boutique',
        'amenities': ['WiFi', 'Restaurant', 'River View'],
        'images': [
          'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400',
        ],
      },
      {
        'id': '5',
        'name': 'City Center Plaza',
        'description': 'Modern hotel in the heart of the city',
        'price': 110,
        'rating': 4.7,
        'address': '654 Hai Bà Trưng, Quận 3, TP.HCM',
        'category': 'modern',
        'amenities': ['WiFi', 'Pool', 'Restaurant', 'Gym', 'Spa'],
        'images': [
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400',
        ],
      },
    ];

    List<Hotel> loadedHotels = [];

    // Convert addresses to coordinates
    for (final data in hotelData) {
      final coordinates = await _getCoordinatesFromAddress(data['address']);

      if (coordinates != null) {
        loadedHotels.add(
          Hotel(
            id: data['id'],
            name: data['name'],
            description: data['description'],
            price: data['price'].toDouble(),
            rating: data['rating'].toDouble(),
            location: coordinates,
            address: data['address'],
            category: data['category'],
            amenities: List<String>.from(data['amenities']),
            images: List<String>.from(data['images']),
          ),
        );
      } else {
        // Fallback to default coordinates if geocoding fails
        print(
          'Failed to geocode ${data['name']} at ${data['address']}, using fallback',
        );
        // You can add fallback coordinates here if needed
      }

      // Add small delay between requests to avoid rate limiting
      await Future.delayed(Duration(milliseconds: 200));
    }

    setState(() {
      _hotels = loadedHotels;
      _isLoadingHotels = false;
    });

    _updateMarkers();
  }

  // Update markers on map
  void _updateMarkers() {
    setState(() {
      _markers = MapMarkers.createMarkers(
        currentLocation: _currentLocation,
        hotels: _hotels,
        onHotelTap: _showHotelDetails,
        selectedLocation: _selectedLocation,
      );
    });
  }

  // Show hotel details bottom sheet
  void _showHotelDetails(Hotel hotel) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => HotelDetailsBottomSheet(
        hotel: hotel,
        currentLocation: _currentLocation,
        onGetDirections: _getDirections,
        onBookHotel: _bookHotel,
      ),
    );
  }

  // Get directions (simulate)
  void _getDirections(LatLng destination) {
    // Calculate simple distance
    double distance = Geolocator.distanceBetween(
      _currentLocation.latitude,
      _currentLocation.longitude,
      destination.latitude,
      destination.longitude,
    );

    Navigator.pop(context);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Distance: ${(distance / 1000).toStringAsFixed(1)} km'),
        action: SnackBarAction(
          label: 'Navigate',
          onPressed: () {
            // Here you would integrate with a navigation service
            // For demo, just center map on destination
            _mapController.move(destination, 16.0);
          },
        ),
      ),
    );
  }

  // Book hotel (simulate)
  void _bookHotel(Hotel hotel) {
    Navigator.pop(context);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Book ${hotel.name}'),
        content: Text(
          'Would you like to book this hotel for \$${hotel.price.toInt()}/night?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Booking confirmed for ${hotel.name}!'),
                  backgroundColor: Colors.green,
                ),
              );
            },
            child: Text('Confirm'),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
          ),
        ],
      ),
    );
  }

  // Show location permission dialog
  void _showLocationPermissionDialog(String title, String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('OK'),
          ),
        ],
      ),
    );
  }

  // Search hotels
  void _searchHotels(String query) {
    // Implement search functionality
    print('Searching for: $query');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Map
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _currentLocation,
              initialZoom: _currentZoom,
              minZoom: 5.0,
              maxZoom: 18.0,
              onTap: _onTapMap, // Thêm sự kiện click vào map
              onPositionChanged: (position, hasGesture) {
                if (hasGesture) {
                  setState(() {
                    _currentZoom = position.zoom ?? _currentZoom;
                  });
                }
              },
            ),
            children: [
              // Tile layer with selected style
              TileLayer(
                urlTemplate: _mapStyles[_selectedMapStyle]!,
                userAgentPackageName: 'com.example.hotel_app',
                maxNativeZoom: 19,
                subdomains: ['a', 'b', 'c'],
              ),

              // Markers layer
              MarkerLayer(markers: _markers),
            ],
          ),

          // Top search bar
          Positioned(
            top: MediaQuery.of(context).padding.top + 10,
            left: 16,
            right: 16,
            child: MapSearchBar(
              onSearch: _searchHotels,
              selectedMapStyle: _selectedMapStyle,
              onMapStyleChanged: (style) =>
                  setState(() => _selectedMapStyle = style),
              mapStyles: _mapStyles,
            ),
          ),

          // Loading indicators (chỉ hiển thị khi thực sự đang load)
          if (_isLoadingLocation)
            Positioned(
              top: MediaQuery.of(context).padding.top + 70,
              left: 16,
              right: 16,
              child: LoadingIndicator(message: 'Getting your location...'),
            ),

          if (_isLoadingHotels)
            Positioned(
              top: MediaQuery.of(context).padding.top + 70,
              left: 16,
              right: 16,
              child: LoadingIndicator(message: 'Loading hotels...'),
            ),

          // // Thông báo GPS nếu chưa có permission
          // if (_hasCheckedPermission &&
          //     !_hasLocationPermission &&
          //     !_isLoadingLocation)
          //   Positioned(
          //     bottom: 100,
          //     left: 16,
          //     right: 16,
          //     child: Container(
          //       padding: EdgeInsets.all(12),
          //       decoration: BoxDecoration(
          //         color: Colors.blue.shade50,
          //         borderRadius: BorderRadius.circular(8),
          //         border: Border.all(color: Colors.blue.shade200),
          //       ),
          //       child: Row(
          //         children: [
          //           Icon(Icons.info_outline, color: Colors.blue, size: 16),
          //           SizedBox(width: 8),
          //           Expanded(
          //             child: Text(
          //               'Nhấn nút vị trí để bật GPS và tìm khách sạn gần bạn',
          //               style: TextStyle(
          //                 fontSize: 12,
          //                 color: Colors.blue.shade700,
          //               ),
          //             ),
          //           ),
          //         ],
          //       ),
          //     ),
          //   ),
          if (_isLoadingAddress)
            Positioned(
              bottom: 100,
              left: 16,
              right: 16,
              child: LoadingIndicator(message: 'Đang lấy địa chỉ...'),
            ),

          // Hotel count badge
          if (_hotels.isNotEmpty)
            Positioned(
              top: MediaQuery.of(context).padding.top + 70,
              right: 16,
              child: HotelCountBadge(hotelCount: _hotels.length),
            ),

          // Hiển thị thông tin vị trí đã chọn ở bottom
          if (_selectedLocation != null &&
              _selectedAddress != null &&
              !_isLoadingAddress)
            Positioned(
              bottom: 20,
              left: 16,
              right: 16,
              child: SelectedLocationInfo(
                selectedLocation: _selectedLocation!,
                selectedAddress: _selectedAddress!,
                onClose: () {
                  setState(() {
                    _selectedLocation = null;
                    _selectedAddress = null;
                  });
                  _updateMarkers();
                },
                onSearchNearby: () =>
                    _searchHotelsNearLocation(_selectedLocation!),
              ),
            ),
        ],
      ),

      // Floating action buttons
      floatingActionButton: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          // Zoom in
          FloatingActionButton(
            mini: true,
            onPressed: () {
              _mapController.move(
                _mapController.camera.center,
                _mapController.camera.zoom + 1,
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
              _mapController.move(
                _mapController.camera.center,
                _mapController.camera.zoom - 1,
              );
            },
            child: Icon(Icons.remove),
            backgroundColor: Colors.white,
            foregroundColor: Colors.black,
            heroTag: "zoom_out",
          ),

          SizedBox(height: 8),

          // My location - chỉ yêu cầu GPS khi người dùng nhấn
          FloatingActionButton(
            onPressed: _getCurrentLocation,
            child: Icon(Icons.my_location),
            backgroundColor: Colors.orange,
            heroTag: "my_location",
          ),
        ],
      ),
    );
  }
}
