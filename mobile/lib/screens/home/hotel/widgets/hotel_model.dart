// models/hotel_model.dart
class Hotel {
  final String name;
  final String location;
  final double rating;
  final int reviewCount;
  final int discount;
  final List<String> images;
  final List<Amenity> amenities;
  final String description;
  final double price;
  final List<Review> reviews;

  Hotel({
    required this.name,
    required this.location,
    required this.rating,
    required this.reviewCount,
    required this.discount,
    required this.images,
    required this.amenities,
    required this.description,
    required this.price,
    required this.reviews,
  });

  static Hotel mockData() {
    return Hotel(
      name: "Hotel Galaxy",
      location: "New York, USA",
      rating: 4.8,
      reviewCount: 107,
      discount: 20,
      images: [
        "assets/images/hotel1.jpg",
        "assets/images/hotel2.jpg",
        "assets/images/hotel3.jpg",
      ],
      amenities: [
        Amenity(icon: "🛏️", name: "2 Beds"),
        Amenity(icon: "🛁", name: "1 Bath"),
        Amenity(icon: "📐", name: "2000 sqft"),
        Amenity(icon: "❄️", name: "AC"),
        Amenity(icon: "📶", name: "Wi fi"),
        Amenity(icon: "🍳", name: "Breakfast"),
      ],
      description: "Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content. To demonstrate the visual form of a document or a typeface without relying on meaningful content.",
      price: 160,
      reviews: [
        Review(
          name: "John Dey",
          avatar: "JD",
          rating: 5.0,
          text: "Amazing experience! The pool area is absolutely stunning and the service was top-notch. Highly recommend this hotel for anyone visiting New York.",
          date: "2 days ago",
        ),
        Review(
          name: "Sarah Miller",
          avatar: "SM",
          rating: 5.0,
          text: "Perfect location and beautiful rooms. The breakfast was delicious and the staff was very friendly and helpful throughout our stay.",
          date: "5 days ago",
        ),
        Review(
          name: "Michael Johnson",
          avatar: "MJ",
          rating: 4.0,
          text: "Great hotel with modern amenities. The only minor issue was the Wi-Fi speed in some areas, but overall a wonderful stay.",
          date: "1 week ago",
        ),
      ],
    );
  }
}

class Review {
  final String name;
  final String avatar;
  final double rating;
  final String text;
  final String date;

  Review({
    required this.name,
    required this.avatar,
    required this.rating,
    required this.text,
    required this.date,
  });
}

class Amenity {
  final String icon;
  final String name;

  Amenity({required this.icon, required this.name});
}