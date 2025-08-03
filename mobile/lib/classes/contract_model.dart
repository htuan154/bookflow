// ============================================
// CONTRACT MODEL
// ============================================

import 'dart:convert';
import 'user_model.dart';
import 'hotel_model.dart';

class Contract {
  final String contractId;
  final String userId;
  final String hotelId;
  final String contractNumber;
  final String contractType;
  final String title;
  final String? description;
  final DateTime startDate;
  final DateTime? endDate;
  final DateTime? signedDate;
  final double? contractValue;
  final String currency;
  final String? paymentTerms;
  final String status;
  final String? contractFileUrl;
  final String? termsAndConditions;
  final String? notes;
  final String? createdBy;
  final String? approvedBy;
  final DateTime createdAt;

  // Quan hệ với các model khác (optional)
  final User? user;
  final Hotel? hotel;
  final User? creator;
  final User? approver;

  Contract({
    required this.contractId,
    required this.userId,
    required this.hotelId,
    required this.contractNumber,
    required this.contractType,
    required this.title,
    this.description,
    required this.startDate,
    this.endDate,
    this.signedDate,
    this.contractValue,
    this.currency = 'VND',
    this.paymentTerms,
    this.status = 'draft',
    this.contractFileUrl,
    this.termsAndConditions,
    this.notes,
    this.createdBy,
    this.approvedBy,
    required this.createdAt,
    this.user,
    this.hotel,
    this.creator,
    this.approver,
  });

  // Factory constructor từ JSON
  factory Contract.fromJson(Map<String, dynamic> json) {
    return Contract(
      contractId: json['contract_id'] as String,
      userId: json['user_id'] as String,
      hotelId: json['hotel_id'] as String,
      contractNumber: json['contract_number'] as String,
      contractType: json['contract_type'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      startDate: DateTime.parse(json['start_date'] as String),
      endDate: json['end_date'] != null ? DateTime.parse(json['end_date'] as String) : null,
      signedDate: json['signed_date'] != null ? DateTime.parse(json['signed_date'] as String) : null,
      contractValue: (json['contract_value'] as num?)?.toDouble(),
      currency: json['currency'] as String? ?? 'VND',
      paymentTerms: json['payment_terms'] as String?,
      status: json['status'] as String? ?? 'draft',
      contractFileUrl: json['contract_file_url'] as String?,
      termsAndConditions: json['terms_and_conditions'] as String?,
      notes: json['notes'] as String?,
      createdBy: json['created_by'] as String?,
      approvedBy: json['approved_by'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      user: json['user'] != null ? User.fromJson(json['user']) : null,
      hotel: json['hotel'] != null ? Hotel.fromJson(json['hotel']) : null,
      creator: json['creator'] != null ? User.fromJson(json['creator']) : null,
      approver: json['approver'] != null ? User.fromJson(json['approver']) : null,
    );
  }

  // Chuyển đối tượng thành JSON
  Map<String, dynamic> toJson() {
    return {
      'contract_id': contractId,
      'user_id': userId,
      'hotel_id': hotelId,
      'contract_number': contractNumber,
      'contract_type': contractType,
      'title': title,
      'description': description,
      'start_date': startDate.toIso8601String().split('T')[0], // Chỉ lấy phần date
      'end_date': endDate?.toIso8601String().split('T')[0],
      'signed_date': signedDate?.toIso8601String().split('T')[0],
      'contract_value': contractValue,
      'currency': currency,
      'payment_terms': paymentTerms,
      'status': status,
      'contract_file_url': contractFileUrl,
      'terms_and_conditions': termsAndConditions,
      'notes': notes,
      'created_by': createdBy,
      'approved_by': approvedBy,
      'created_at': createdAt.toIso8601String(),
      if (user != null) 'user': user!.toJson(),
      if (hotel != null) 'hotel': hotel!.toJson(),
      if (creator != null) 'creator': creator!.toJson(),
      if (approver != null) 'approver': approver!.toJson(),
    };
  }

  // Chuyển đối tượng thành JSON string
  String toJsonString() => json.encode(toJson());

  // Tạo đối tượng từ JSON string
  factory Contract.fromJsonString(String jsonString) {
    return Contract.fromJson(json.decode(jsonString));
  }

  // CopyWith method
  Contract copyWith({
    String? contractId,
    String? userId,
    String? hotelId,
    String? contractNumber,
    String? contractType,
    String? title,
    String? description,
    DateTime? startDate,
    DateTime? endDate,
    DateTime? signedDate,
    double? contractValue,
    String? currency,
    String? paymentTerms,
    String? status,
    String? contractFileUrl,
    String? termsAndConditions,
    String? notes,
    String? createdBy,
    String? approvedBy,
    DateTime? createdAt,
    User? user,
    Hotel? hotel,
    User? creator,
    User? approver,
  }) {
    return Contract(
      contractId: contractId ?? this.contractId,
      userId: userId ?? this.userId,
      hotelId: hotelId ?? this.hotelId,
      contractNumber: contractNumber ?? this.contractNumber,
      contractType: contractType ?? this.contractType,
      title: title ?? this.title,
      description: description ?? this.description,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      signedDate: signedDate ?? this.signedDate,
      contractValue: contractValue ?? this.contractValue,
      currency: currency ?? this.currency,
      paymentTerms: paymentTerms ?? this.paymentTerms,
      status: status ?? this.status,
      contractFileUrl: contractFileUrl ?? this.contractFileUrl,
      termsAndConditions: termsAndConditions ?? this.termsAndConditions,
      notes: notes ?? this.notes,
      createdBy: createdBy ?? this.createdBy,
      approvedBy: approvedBy ?? this.approvedBy,
      createdAt: createdAt ?? this.createdAt,
      user: user ?? this.user,
      hotel: hotel ?? this.hotel,
      creator: creator ?? this.creator,
      approver: approver ?? this.approver,
    );
  }

  // Helper methods để kiểm tra status
  bool get isDraft => status == 'draft';
  bool get isPending => status == 'pending';
  bool get isActive => status == 'active';
  bool get isExpired => status == 'expired';
  bool get isTerminated => status == 'terminated';
  bool get isCancelled => status == 'cancelled';

  // Kiểm tra hợp đồng có còn hiệu lực không
  bool get isValid {
    final now = DateTime.now();
    if (endDate == null) return isActive;
    return isActive && now.isBefore(endDate!);
  }

  // Tính số ngày còn lại của hợp đồng
  int? get daysRemaining {
    if (endDate == null || !isActive) return null;
    final now = DateTime.now();
    if (now.isAfter(endDate!)) return 0;
    return endDate!.difference(now).inDays;
  }

  // Định dạng giá trị hợp đồng
  String get formattedValue {
    if (contractValue == null) return 'N/A';
    return '${contractValue!.toStringAsFixed(0)} $currency';
  }

  @override
  String toString() {
    return 'Contract(contractId: $contractId, contractNumber: $contractNumber, title: $title, status: $status, startDate: $startDate, endDate: $endDate)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Contract && other.contractId == contractId;
  }

  @override
  int get hashCode => contractId.hashCode;
}

// ============================================
// ENUM DEFINITIONS
// ============================================
enum ContractStatus { draft, pending, active, expired, terminated, cancelled }

extension ContractStatusExtension on ContractStatus {
  String get value {
    switch (this) {
      case ContractStatus.draft:
        return 'draft';
      case ContractStatus.pending:
        return 'pending';
      case ContractStatus.active:
        return 'active';
      case ContractStatus.expired:
        return 'expired';
      case ContractStatus.terminated:
        return 'terminated';
      case ContractStatus.cancelled:
        return 'cancelled';
    }
  }

  static ContractStatus fromString(String value) {
    switch (value.toLowerCase()) {
      case 'draft':
        return ContractStatus.draft;
      case 'pending':
        return ContractStatus.pending;
      case 'active':
        return ContractStatus.active;
      case 'expired':
        return ContractStatus.expired;
      case 'terminated':
        return ContractStatus.terminated;
      case 'cancelled':
        return ContractStatus.cancelled;
      default:
        throw ArgumentError('Invalid contract status: $value');
    }
  }
}