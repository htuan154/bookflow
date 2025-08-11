// ============================================
// USER MODEL
// ============================================

import 'dart:convert';
import 'role_model.dart';

class User {
  final String userId;
  final String username;
  final String email;
  final String passwordHash;
  final String? phoneNumber;
  final String? fullName;
  final String? address;
  final String? profilePictureUrl;
  final int roleId;
  final bool isActive;
  final DateTime createdAt;

  // Quan hệ với Role (optional)
  final Role? role;

  User({
    required this.userId,
    required this.username,
    required this.email,
    required this.passwordHash,
    this.phoneNumber,
    this.fullName,
    this.address,
    this.profilePictureUrl,
    required this.roleId,
    this.isActive = true,
    required this.createdAt,
    this.role,
  });

  // Factory constructor từ JSON
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      userId: json['userId'] ?? json['user_id'] ?? '',
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      passwordHash: json['passwordHash'] ?? json['password_hash'] ?? '',
      phoneNumber: json['phoneNumber'] ?? json['phone_number'],
      fullName: json['fullName'] ?? json['full_name'],
      address: json['address'],
      profilePictureUrl:
          json['profilePictureUrl'] ?? json['profile_picture_url'],
      roleId: json['roleId'] ?? json['role_id'] ?? 0,
      isActive: json['isActive'] ?? json['is_active'] ?? true,
      createdAt: DateTime.parse(
        json['createdAt'] ??
            json['created_at'] ??
            DateTime.now().toIso8601String(),
      ),
      role: json['role'] != null ? Role.fromJson(json['role']) : null,
    );
  }

  // Chuyển đối tượng thành JSON
  Map<String, dynamic> toJson() {
    return {
      'user_id': userId,
      'username': username,
      'email': email,
      'password_hash': passwordHash,
      'phone_number': phoneNumber,
      'full_name': fullName,
      'address': address,
      'profile_picture_url': profilePictureUrl,
      'role_id': roleId,
      'is_active': isActive,
      'created_at': createdAt.toIso8601String(),
      if (role != null) 'role': role!.toJson(),
    };
  }

  // Chuyển đối tượng thành JSON string
  String toJsonString() => json.encode(toJson());

  // Tạo đối tượng từ JSON string
  factory User.fromJsonString(String jsonString) {
    return User.fromJson(json.decode(jsonString));
  }

  // CopyWith method
  User copyWith({
    String? userId,
    String? username,
    String? email,
    String? passwordHash,
    String? phoneNumber,
    String? fullName,
    String? address,
    String? profilePictureUrl,
    int? roleId,
    bool? isActive,
    DateTime? createdAt,
    Role? role,
  }) {
    return User(
      userId: userId ?? this.userId,
      username: username ?? this.username,
      email: email ?? this.email,
      passwordHash: passwordHash ?? this.passwordHash,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      fullName: fullName ?? this.fullName,
      address: address ?? this.address,
      profilePictureUrl: profilePictureUrl ?? this.profilePictureUrl,
      roleId: roleId ?? this.roleId,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      role: role ?? this.role,
    );
  }

  @override
  String toString() {
    return 'User(userId: $userId, username: $username, email: $email, fullName: $fullName, roleId: $roleId, isActive: $isActive)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is User && other.userId == userId;
  }

  @override
  int get hashCode => userId.hashCode;
}
