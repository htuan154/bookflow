// screens/hotel_detail_screen.dart
import 'package:flutter/material.dart';
import '../hotel/widgets/custom_app_bar.dart';
import '../hotel/widgets/hotel_info.dart';
import '../hotel/widgets/tab_content.dart';
import '../hotel/widgets/image_slider.dart';
import '../hotel/widgets/booking_section.dart';
import '../hotel/widgets/hotel_model.dart';

class HotelDetailScreen extends StatefulWidget {
  @override
  _HotelDetailScreenState createState() => _HotelDetailScreenState();
}

class _HotelDetailScreenState extends State<HotelDetailScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;
  late Hotel hotel;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    hotel = Hotel.mockData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SafeArea(
        child: Column(
          children: [
            CustomAppBar(),
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    ImageSlider(images: hotel.images),
                    HotelInfo(
                      hotel: hotel,
                      tabController: _tabController,
                    ),
                    Container(
                      height: 400,
                      child: TabBarView(
                        controller: _tabController,
                        children: [
                          TabContent.about(hotel),
                          TabContent.reviews(hotel.reviews),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            BookingSection(price: hotel.price),
          ],
        ),
      ),
    );
  }
}





