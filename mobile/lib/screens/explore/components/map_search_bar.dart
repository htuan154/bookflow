import 'package:flutter/material.dart';

class MapSearchBar extends StatelessWidget {
  final Function(String) onSearch;
  final String selectedMapStyle;
  final Function(String) onMapStyleChanged;
  final Map<String, String> mapStyles;

  const MapSearchBar({
    super.key,
    required this.onSearch,
    required this.selectedMapStyle,
    required this.onMapStyleChanged,
    required this.mapStyles,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.black26, blurRadius: 8, offset: Offset(0, 2)),
        ],
      ),
      child: TextField(
        decoration: InputDecoration(
          hintText: 'Search hotels...',
          prefixIcon: Icon(Icons.search, color: Colors.grey),
          suffixIcon: PopupMenuButton<String>(
            icon: Icon(Icons.layers, color: Colors.grey),
            onSelected: onMapStyleChanged,
            itemBuilder: (context) => [
              PopupMenuItem(value: 'standard', child: Text('Standard')),
              PopupMenuItem(value: 'satellite', child: Text('Satellite')),
              PopupMenuItem(value: 'dark', child: Text('Dark')),
              PopupMenuItem(value: 'light', child: Text('Light')),
            ],
          ),
          border: InputBorder.none,
          contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
        onSubmitted: onSearch,
      ),
    );
  }
}
