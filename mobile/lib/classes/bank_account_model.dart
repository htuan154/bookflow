// ============================================
// Bank Account MODEL
// ============================================

class BankAccount {
  final String bankAccountId;
  final String userId;
  final String? hotelId;
  final String holderName;
  final String accountNumber;
  final String bankName;
  final String? branchName;
  final bool isDefault;
  final String status;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  BankAccount({
    required this.bankAccountId,
    required this.userId,
    this.hotelId,
    required this.holderName,
    required this.accountNumber,
    required this.bankName,
    this.branchName,
    required this.isDefault,
    required this.status,
    this.createdAt,
    this.updatedAt,
  });

  factory BankAccount.fromJson(Map<String, dynamic> json) {
    return BankAccount(
      bankAccountId: json['bankAccountId'] ?? json['bank_account_id'] ?? '',
      userId: json['userId'] ?? json['user_id'] ?? '',
      hotelId: json['hotelId'] ?? json['hotel_id'],
      holderName: json['holderName'] ?? json['holder_name'] ?? '',
      accountNumber: json['accountNumber'] ?? json['account_number'] ?? '',
      bankName: json['bankName'] ?? json['bank_name'] ?? '',
      branchName: json['branchName'] ?? json['branch_name'],
      isDefault: json['isDefault'] ?? json['is_default'] ?? false,
      status: json['status'] ?? 'active',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : (json['created_at'] != null ? DateTime.tryParse(json['created_at']) : null),
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'])
          : (json['updated_at'] != null ? DateTime.tryParse(json['updated_at']) : null),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'bankAccountId': bankAccountId,
      'userId': userId,
      'hotelId': hotelId,
      'holderName': holderName,
      'accountNumber': accountNumber,
      'bankName': bankName,
      'branchName': branchName,
      'isDefault': isDefault,
      'status': status,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }
}
