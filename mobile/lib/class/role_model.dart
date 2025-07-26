// ============================================
// ROLE MODEL
// ============================================

import 'dart:convert';

class Role {
  final int roleId;
  final String roleName;
  final String? roleDescription;
  final bool isActive;
  final DateTime createdAt;

  Role({
    required this.roleId,
    required this.roleName,
    this.roleDescription,
    this.isActive = true,
    required this.createdAt,
  });

  // Factory constructor từ JSON
  factory Role.fromJson(Map<String, dynamic> json) {
    return Role(
      roleId: json['role_id'] as int,
      roleName: json['role_name'] as String,
      roleDescription: json['role_description'] as String?,
      isActive: json['is_active'] as bool? ?? true,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  // Chuyển đối tượng thành JSON
  Map<String, dynamic> toJson() {
    return {
      'role_id': roleId,
      'role_name': roleName,
      'role_description': roleDescription,
      'is_active': isActive,
      'created_at': createdAt.toIso8601String(),
    };
  }

  // Chuyển đối tượng thành JSON string
  String toJsonString() => json.encode(toJson());

  // Tạo đối tượng từ JSON string
  factory Role.fromJsonString(String jsonString) {
    return Role.fromJson(json.decode(jsonString));
  }

  // CopyWith method để tạo bản sao với các giá trị mới
  Role copyWith({
    int? roleId,
    String? roleName,
    String? roleDescription,
    bool? isActive,
    DateTime? createdAt,
  }) {
    return Role(
      roleId: roleId ?? this.roleId,
      roleName: roleName ?? this.roleName,
      roleDescription: roleDescription ?? this.roleDescription,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  String toString() {
    return 'Role(roleId: $roleId, roleName: $roleName, roleDescription: $roleDescription, isActive: $isActive, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Role && other.roleId == roleId;
  }

  @override
  int get hashCode => roleId.hashCode;
}