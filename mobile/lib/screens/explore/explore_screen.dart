// lib/screens/explore_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import '../../services/geocoding_service.dart';
import '../../services/vietnam_province_service.dart';
import '../../services/tourist_location_service.dart';
import '../../services/food_recommendation_service.dart';
import '../../classes/tourist_location_model.dart';
import '../../classes/food_recommendation_model.dart';
import '../../classes/nearby_tourist_location.dart';
import 'components/loading_indicator.dart';
import 'components/location_dialog.dart';
import 'components/food_marker_dialog.dart';
import 'components/tourist_location_dialog.dart';
import 'components/floating_nearby_locations_widget.dart';

class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key});

  @override
  _ExploreScreenState createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  final MapController _mapController = MapController();
  final VietnamProvinceService _provinceService = VietnamProvinceService();
  final TouristLocationService _touristLocationService = TouristLocationService();
  final FoodRecommendationService _foodRecommendationService = FoodRecommendationService();
  
  LatLng _currentLocation = LatLng(10.8231, 106.6297); // HCM City default
  List<Marker> _markers = [];
  bool _isLoadingLocation = false;
  bool _isLoadingProvinces = false;
  bool _isLoadingData = false;
  String _selectedMapStyle = 'standard';
  double _currentZoom = 13.0;
  bool _hasLocationPermission = false;
  bool _hasCheckedPermission = false;

  // Thêm các biến cho click location
  LatLng? _selectedLocation;
  String? _selectedAddress;
  bool _isLoadingAddress = false;

  // Thêm các biến cho province search
  List<Province> _allProvinces = [];
  List<Province> _filteredProvinces = [];
  Province? _selectedProvince;
  final TextEditingController _provinceSearchController = TextEditingController();
  bool _showProvinceSearch = false;

  // Dữ liệu tourist locations và foods
  List<TouristLocation> _touristLocations = [];
  List<FoodRecommendation> _foodRecommendations = [];
  String _currentCity = 'Hồ Chí Minh'; // Default city

  // Danh sách địa điểm gần đây
  List<NearbyTouristLocation> _nearbyLocations = [];
  bool _showNearbyLocations = false;

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
    _checkLocationPermission();
    _loadProvinces();
    _loadCityData(_currentCity); // Load dữ liệu mặc định cho Hồ Chí Minh
  }

  // Load dữ liệu tourist locations và food recommendations theo city
  Future<void> _loadCityData(String city) async {
    setState(() {
      _isLoadingData = true;
    });

    try {
      debugPrint('🔍 Loading data for city: $city');
      
      // Load tourist locations
      final locationResult = await _touristLocationService.getLocationsByCityVn(city);
      debugPrint('📍 Location API Response: ${locationResult['success']}');
      debugPrint('📍 Location Data: ${locationResult['data']}');
      
      // Load food recommendations
      final foodResult = await _foodRecommendationService.getRecommendationsByCity(city);
      debugPrint('🍽️ Food API Response: ${foodResult['success']}');
      debugPrint('🍽️ Food Data: ${foodResult['data']}');

      if (locationResult['success'] && foodResult['success']) {
        final locations = locationResult['data'] as List<TouristLocation>;
        final foods = foodResult['data'] as List<FoodRecommendation>;
        
        debugPrint('✅ Loaded ${locations.length} locations and ${foods.length} foods');
        
        // Debug chi tiết từng location
        for (var loc in locations) {
          debugPrint('  📌 Location: ${loc.name} - Lat: ${loc.latitude}, Lng: ${loc.longitude}');
        }
        
        // Debug chi tiết từng food
        for (var food in foods) {
          debugPrint('  🍴 Food: ${food.name} - Lat: ${food.latitude}, Lng: ${food.longitude}');
        }
        
        setState(() {
          _touristLocations = locations;
          _foodRecommendations = foods;
          _isLoadingData = false;
        });
        
        // Cập nhật markers
        _updateMarkers();
      } else {
        setState(() {
          _isLoadingData = false;
        });
        debugPrint('❌ Error loading data: ${locationResult['message']}, ${foodResult['message']}');
      }
    } catch (e, stackTrace) {
      setState(() {
        _isLoadingData = false;
      });
      debugPrint('❌ Exception loading city data: $e');
      debugPrint('Stack trace: $stackTrace');
    }
  }

  // Load danh sách tỉnh/thành
  Future<void> _loadProvinces() async {
    setState(() {
      _isLoadingProvinces = true;
    });

    try {
      final provinces = await _provinceService.fetchProvinces();
      setState(() {
        _allProvinces = provinces;
        _filteredProvinces = provinces;
        _isLoadingProvinces = false;
      });
    } catch (e) {
      debugPrint('Error loading provinces: $e');
      setState(() {
        _isLoadingProvinces = false;
      });
    }
  }

  // Filter provinces
  void _filterProvinces(String keyword) {
    setState(() {
      _filteredProvinces = _provinceService.searchProvinces(keyword, _allProvinces);
      if (_selectedProvince != null &&
          !_filteredProvinces.contains(_selectedProvince)) {
        _selectedProvince = null;
      }
    });
  }

  // Chọn tỉnh/thành và di chuyển map
  void _onProvinceSelected(Province? province) async {
    setState(() {
      _selectedProvince = province;
    });

    if (province != null) {
      // Cập nhật city hiện tại
      _currentCity = province.name;
      
      // Load dữ liệu mới cho city
      await _loadCityData(_currentCity);
      
      // Geocode để lấy tọa độ của tỉnh/thành
      final coordinates = await _getCoordinatesFromAddress(province.name);
      if (coordinates != null) {
        setState(() {
          _currentLocation = coordinates;
        });
        _mapController.move(coordinates, 13.0);
        _updateMarkers();
      }
    }
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
      onSearchNearbyTouristLocations: () {
        _searchNearbyTouristLocations(location);
      },
    );
  }

  // Tìm kiếm các địa điểm tham quan gần vị trí được chọn
  Future<void> _searchNearbyTouristLocations(LatLng location) async {
    // Show loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Center(
        child: Container(
          padding: EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(color: Colors.green),
              SizedBox(height: 16),
              Text(
                'Đang tìm địa điểm gần đây...',
                style: TextStyle(fontSize: 14),
              ),
            ],
          ),
        ),
      ),
    );

    try {
      final result = await _touristLocationService.getNearestLocations(
        location.latitude,
        location.longitude,
      );

      // Close loading dialog
      Navigator.pop(context);

      if (result['success'] && result['data'] != null) {
        final locations = result['data'] as List<NearbyTouristLocation>;
        
        if (locations.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Không tìm thấy địa điểm tham quan gần đây'),
              backgroundColor: Colors.orange,
            ),
          );
          return;
        }

        // Move to the nearest location
        if (locations.isNotEmpty) {
          final nearest = locations.first.location;
          if (nearest.latitude != null && nearest.longitude != null) {
            _mapController.move(
              LatLng(nearest.latitude!, nearest.longitude!),
              15.0,
            );
          }
        }

        // Show floating widget with results
        setState(() {
          _nearbyLocations = locations;
          _showNearbyLocations = true;
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Không thể tìm kiếm địa điểm'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      // Close loading dialog if still open
      Navigator.pop(context);
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi khi tìm kiếm: $e'),
          backgroundColor: Colors.red,
        ),
      );
      debugPrint('Error searching nearby locations: $e');
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

  // Update markers on map
  void _updateMarkers() {
    List<Marker> newMarkers = [];

    // Add current location marker
    newMarkers.add(
      Marker(
        point: _currentLocation,
        width: 40,
        height: 40,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.blue,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 3),
          ),
          child: Icon(Icons.person, color: Colors.white, size: 20),
        ),
      ),
    );

    // Add tourist location markers
    for (var location in _touristLocations) {
      if (location.latitude != null && location.longitude != null) {
        newMarkers.add(
          Marker(
            point: LatLng(location.latitude!, location.longitude!),
            width: 50,
            height: 50,
            child: GestureDetector(
              onTap: () => _onTouristLocationMarkerTap(location),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.green,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 3),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black26,
                      blurRadius: 4,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                child: Icon(Icons.place, color: Colors.white, size: 24),
              ),
            ),
          ),
        );
      }
    }

    // Add food recommendation markers
    for (var food in _foodRecommendations) {
      if (food.latitude != null && food.longitude != null) {
        newMarkers.add(
          Marker(
            point: LatLng(food.latitude!, food.longitude!),
            width: 50,
            height: 50,
            child: GestureDetector(
              onTap: () => _onFoodMarkerTap(food),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.orange,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 3),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black26,
                      blurRadius: 4,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                child: Icon(Icons.restaurant, color: Colors.white, size: 24),
              ),
            ),
          ),
        );
      }
    }

    // Add selected location marker if exists
    if (_selectedLocation != null) {
      newMarkers.add(
        Marker(
          point: _selectedLocation!,
          width: 40,
          height: 40,
          child: Container(
            decoration: BoxDecoration(
              color: Colors.red,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 3),
            ),
            child: Icon(Icons.location_on, color: Colors.white, size: 20),
          ),
        ),
      );
    }

    setState(() {
      _markers = newMarkers;
    });
  }

  // Xử lý khi nhấn vào marker của tourist location
  void _onTouristLocationMarkerTap(TouristLocation location) {
    // Lấy các món ăn có location_id tương ứng
    final nearbyFoods = _foodRecommendations
        .where((food) => food.locationId == location.locationId)
        .toList();

    TouristLocationDialog.show(
      context: context,
      location: location,
      nearbyFoods: nearbyFoods,
      onClose: () {
        // Không làm gì khi đóng
      },
      onFoodSelected: (food) {
        // Di chuyển đến marker của food
        if (food.latitude != null && food.longitude != null) {
          _mapController.move(
            LatLng(food.latitude!, food.longitude!),
            16.0,
          );
          
          // Hiển thị dialog của food sau một chút
          Future.delayed(Duration(milliseconds: 300), () {
            _onFoodMarkerTap(food);
          });
        }
      },
    );
  }

  // Xử lý khi nhấn vào marker của food
  void _onFoodMarkerTap(FoodRecommendation food) {
    // Tìm tourist location tương ứng
    TouristLocation? location;
    if (food.locationId != null) {
      try {
        location = _touristLocations.firstWhere(
          (loc) => loc.locationId == food.locationId,
        );
      } catch (e) {
        location = null;
      }
    }

    FoodMarkerDialog.show(
      context: context,
      food: food,
      location: location,
      onClose: () {
        // Không làm gì khi đóng
      },
      onExploreLocation: location != null
          ? () {
              // Di chuyển đến marker của location
              if (location!.latitude != null && location.longitude != null) {
                _mapController.move(
                  LatLng(location.latitude!, location.longitude!),
                  16.0,
                );
                // Hiển thị dialog của location sau một chút
                Future.delayed(Duration(milliseconds: 300), () {
                  _onTouristLocationMarkerTap(location!);
                });
              }
            }
          : null,
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

  // Build province search form
  Widget _buildProvinceSearchForm() {
    return Container(
      margin: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header với nút đóng
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Tìm kiếm địa điểm',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              IconButton(
                icon: Icon(Icons.close),
                onPressed: () {
                  setState(() {
                    _showProvinceSearch = false;
                  });
                },
              ),
            ],
          ),
          SizedBox(height: 16),

          // Province search
          TextField(
            controller: _provinceSearchController,
            decoration: InputDecoration(
              labelText: 'Tìm kiếm tỉnh/thành',
              prefixIcon: Icon(Icons.search),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            onChanged: _filterProvinces,
          ),
          SizedBox(height: 10),

          // Province dropdown
          Theme(
            data: Theme.of(context).copyWith(
              canvasColor: Colors.white,
            ),
            child: DropdownButtonFormField<Province>(
              value: _selectedProvince,
              decoration: InputDecoration(
                labelText: 'Chọn tỉnh/thành',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                fillColor: Colors.white,
                filled: true,
              ),
              dropdownColor: Colors.white,
              items: _filteredProvinces.map((province) {
                return DropdownMenuItem(
                  value: province,
                  child: Text(province.name),
                );
              }).toList(),
              onChanged: (value) {
                _onProvinceSelected(value);
                // Tự động đóng form sau khi chọn
                Future.delayed(Duration(milliseconds: 500), () {
                  setState(() {
                    _showProvinceSearch = false;
                  });
                });
              },
            ),
          ),
        ],
      ),
    );
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

          // Province search form (ở trên cùng khi mở)
          if (_showProvinceSearch)
            Positioned(
              top: MediaQuery.of(context).padding.top,
              left: 0,
              right: 0,
              child: _buildProvinceSearchForm(),
            ),

          // Nút mở form search (chỉ hiển thị khi form đóng)
          if (!_showProvinceSearch)
            Positioned(
              top: MediaQuery.of(context).padding.top + 10,
              left: 16,
              right: 16,
              child: GestureDetector(
                onTap: () {
                  setState(() {
                    _showProvinceSearch = true;
                  });
                },
                child: Container(
                  padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 8,
                        offset: Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.search, color: Colors.grey[600]),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _selectedProvince?.name ?? 'Tìm kiếm tỉnh/thành...',
                          style: TextStyle(
                            color: _selectedProvince != null ? Colors.black : Colors.grey[600],
                            fontSize: 16,
                          ),
                        ),
                      ),
                      // Hiển thị icon map style ở bên phải
                      Theme(
                        data: Theme.of(context).copyWith(
                          canvasColor: Colors.white,
                          cardColor: Colors.white,
                        ),
                        child: PopupMenuButton<String>(
                          icon: Icon(Icons.layers, color: Colors.grey[600]),
                          color: Colors.white,
                          onSelected: (style) {
                            setState(() {
                              _selectedMapStyle = style;
                            });
                          },
                          itemBuilder: (context) => _mapStyles.keys.map((style) {
                            return PopupMenuItem<String>(
                              value: style,
                              child: Row(
                                children: [
                                  Icon(
                                    _selectedMapStyle == style
                                        ? Icons.radio_button_checked
                                        : Icons.radio_button_unchecked,
                                    color: Colors.orange,
                                  ),
                                  SizedBox(width: 8),
                                  Text(style[0].toUpperCase() + style.substring(1)),
                                ],
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ],
                  ),
                ),
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

          // Đã loại bỏ _isLoadingHotels và LoadingIndicator liên quan

          if (_isLoadingProvinces)
            Positioned(
              top: MediaQuery.of(context).padding.top + 70,
              left: 16,
              right: 16,
              child: LoadingIndicator(message: 'Loading provinces...'),
            ),

          if (_isLoadingData)
            Positioned(
              top: MediaQuery.of(context).padding.top + 70,
              left: 16,
              right: 16,
              child: LoadingIndicator(message: 'Đang tải dữ liệu...'),
            ),

          if (_isLoadingAddress)
            Positioned(
              bottom: 100,
              left: 16,
              right: 16,
              child: LoadingIndicator(message: 'Đang lấy địa chỉ...'),
            ),

          // Floating nearby locations widget
          if (_showNearbyLocations && _nearbyLocations.isNotEmpty)
            FloatingNearbyLocationsWidget(
              locations: _nearbyLocations,
              onLocationSelected: (nearbyLocation) {
                final location = nearbyLocation.location;
                // Move map to selected location
                if (location.latitude != null && location.longitude != null) {
                  _mapController.move(
                    LatLng(location.latitude!, location.longitude!),
                    16.0,
                  );
                  
                  // Show location details dialog after a short delay
                  Future.delayed(Duration(milliseconds: 300), () {
                    _onTouristLocationMarkerTap(location);
                  });
                }
              },
              onClose: () {
                setState(() {
                  _showNearbyLocations = false;
                  _nearbyLocations = [];
                });
              },
            ),
        ],
      ),

      // Floating action buttons - đặt ở đây để không bị che bởi widget khác
      floatingActionButton: Padding(
        padding: EdgeInsets.only(
          bottom: _showNearbyLocations && _nearbyLocations.isNotEmpty ? 200 : 0,
        ),
        child: Column(
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
                _mapController.move(
                  _mapController.camera.center,
                  _mapController.camera.zoom - 1,
                );
              },
              backgroundColor: Colors.white,
              foregroundColor: Colors.black,
              heroTag: "zoom_out",
              child: Icon(Icons.remove),
            ),

            SizedBox(height: 8),

            // My location - chỉ yêu cầu GPS khi người dùng nhấn
            FloatingActionButton(
              onPressed: _getCurrentLocation,
              backgroundColor: Colors.orange,
              heroTag: "my_location",
              child: Icon(Icons.my_location),
            ),
          ],
        ),
      ),
    );
  }
}
