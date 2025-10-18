// src/models/bank_account.model.js
class BankAccount {
  constructor({
    bank_account_id,
    user_id,
    hotel_id,
    holder_name,
    account_number,
    bank_name,
    branch_name,
    is_default,
    status,
    created_at,
    updated_at,
  }) {
    this.bankAccountId = bank_account_id;
    this.userId = user_id;
    this.hotelId = hotel_id || null;
    this.holderName = holder_name;
    this.accountNumber = account_number;
    this.bankName = bank_name;
    this.branchName = branch_name || null;
    this.isDefault = is_default || false;
    this.status = status || 'active';
    this.createdAt = created_at;
    this.updatedAt = updated_at;
  }

  static fromDB(row) { 
    return new BankAccount(row); 
  }

  toJSON() {
    return {
      bankAccountId: this.bankAccountId,
      userId: this.userId,
      hotelId: this.hotelId,
      holderName: this.holderName,
      accountNumber: this.accountNumber,
      bankName: this.bankName,
      branchName: this.branchName,
      isDefault: this.isDefault,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  toDBObject() {
    return {
      bank_account_id: this.bankAccountId,
      user_id: this.userId,
      hotel_id: this.hotelId,
      holder_name: this.holderName,
      account_number: this.accountNumber,
      bank_name: this.bankName,
      branch_name: this.branchName,
      is_default: this.isDefault,
      status: this.status,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }

  // Validation methods
  static validateStatus(status) {
    const validStatuses = ['active', 'inactive'];
    return validStatuses.includes(status);
  }

  static validateAccountNumber(accountNumber) {
    // Basic validation - account number should be numeric and 6-20 digits
    return /^\d{6,20}$/.test(accountNumber);
  }

  static validateBankName(bankName) {
    // Bank name should not be empty and reasonable length
    return bankName && bankName.trim().length >= 2 && bankName.trim().length <= 100;
  }

  static validateHolderName(holderName) {
    // Holder name should not be empty and reasonable length
    return holderName && holderName.trim().length >= 2 && holderName.trim().length <= 100;
  }
}

module.exports = BankAccount;