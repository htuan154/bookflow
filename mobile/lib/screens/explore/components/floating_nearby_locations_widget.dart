import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import '../../../classes/nearby_tourist_location.dart';

class FloatingNearbyLocationsWidget extends StatefulWidget {
  final List<NearbyTouristLocation> locations;
  final Function(NearbyTouristLocation) onLocationSelected;
  final VoidCallback onClose;

  const FloatingNearbyLocationsWidget({
    Key? key,
    required this.locations,
    required this.onLocationSelected,
    required this.onClose,
  }) : super(key: key);

  @override
  State<FloatingNearbyLocationsWidget> createState() => _FloatingNearbyLocationsWidgetState();
}

class _FloatingNearbyLocationsWidgetState extends State<FloatingNearbyLocationsWidget> {
  bool _isExpanded = true;
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    if (widget.locations.isEmpty) return SizedBox.shrink();

    return Positioned(
      bottom: 20,
      left: 16,
      right: 16,
      child: AnimatedContainer(
        duration: Duration(milliseconds: 300),
        curve: Curves.easeInOut,
        height: _isExpanded ? 180 : 60,
        child: Material(
          elevation: 8,
          borderRadius: BorderRadius.circular(20),
          color: Colors.white,
          child: _isExpanded ? _buildExpandedView() : _buildCollapsedView(),
        ),
      ),
    );
  }

  Widget _buildExpandedView() {
    final nearbyLocation = widget.locations[_currentIndex];
    final location = nearbyLocation.location;

    return Container(
      padding: EdgeInsets.all(16),
      child: Column(
        children: [
          // Header với nút đóng
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.green[50],
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(Icons.place, color: Colors.green, size: 24),
              ),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Địa điểm gần đây',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey[800],
                      ),
                    ),
                    Text(
                      '${_currentIndex + 1}/${widget.locations.length} địa điểm',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: Icon(Icons.remove, color: Colors.grey[600]),
                onPressed: () {
                  setState(() {
                    _isExpanded = false;
                  });
                },
                padding: EdgeInsets.zero,
                constraints: BoxConstraints(),
              ),
              SizedBox(width: 8),
              IconButton(
                icon: Icon(Icons.close, color: Colors.grey[600]),
                onPressed: widget.onClose,
                padding: EdgeInsets.zero,
                constraints: BoxConstraints(),
              ),
            ],
          ),
          
          SizedBox(height: 12),
          
          // Location info
          Expanded(
            child: Row(
              children: [
                // Rank badge
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: _getRankColor(_currentIndex),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Center(
                    child: Text(
                      '${_currentIndex + 1}',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ),
                SizedBox(width: 12),
                
                // Location details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        location.name,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey[800],
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(Icons.location_on, size: 14, color: Colors.orange),
                          SizedBox(width: 4),
                          Text(
                            nearbyLocation.distanceText,
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.orange,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          SizedBox(width: 8),
                          Icon(Icons.location_city, size: 14, color: Colors.grey[500]),
                          SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              location.city,
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[600],
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                
                // View button
                ElevatedButton(
                  onPressed: () {
                    widget.onLocationSelected(nearbyLocation);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                    padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    elevation: 0,
                  ),
                  child: Text(
                    'Xem',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          SizedBox(height: 12),
          
          // Navigation buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _currentIndex > 0
                      ? () {
                          setState(() {
                            _currentIndex--;
                          });
                        }
                      : null,
                  icon: Icon(Icons.arrow_back, size: 16),
                  label: Text('Trước', style: TextStyle(fontSize: 13)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.green,
                    side: BorderSide(color: Colors.green[300]!),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    padding: EdgeInsets.symmetric(vertical: 8),
                  ),
                ),
              ),
              SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _currentIndex < widget.locations.length - 1
                      ? () {
                          setState(() {
                            _currentIndex++;
                          });
                        }
                      : null,
                  icon: Icon(Icons.arrow_forward, size: 16),
                  label: Text('Sau', style: TextStyle(fontSize: 13)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.green,
                    side: BorderSide(color: Colors.green[300]!),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    padding: EdgeInsets.symmetric(vertical: 8),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCollapsedView() {
    return InkWell(
      onTap: () {
        setState(() {
          _isExpanded = true;
        });
      },
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: Colors.green,
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.place, color: Colors.white, size: 20),
            ),
            SizedBox(width: 12),
            Expanded(
              child: Text(
                '${widget.locations.length} địa điểm tham quan gần đây',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[800],
                ),
              ),
            ),
            Icon(Icons.expand_less, color: Colors.grey[600]),
            SizedBox(width: 8),
            IconButton(
              icon: Icon(Icons.close, color: Colors.grey[600], size: 20),
              onPressed: widget.onClose,
              padding: EdgeInsets.zero,
              constraints: BoxConstraints(),
            ),
          ],
        ),
      ),
    );
  }

  Color _getRankColor(int index) {
    if (index == 0) return Colors.amber;
    if (index == 1) return Colors.grey[600]!;
    if (index == 2) return Colors.brown[400]!;
    return Colors.green;
  }
}
