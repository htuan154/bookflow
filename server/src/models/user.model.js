// src/models/user.model.js
class User {
  constructor({ 
    user_id, 
    username, 
    email, 
    password_hash, 
    full_name, 
    role_id, 
    created_at,
    phone_number,
    address,
    is_active
  }) {
    this.userId = user_id;
    this.username = username;
    this.email = email;
    this.passwordHash = password_hash;
    this.fullName = full_name;
    this.roleId = role_id;
    this.createdAt = created_at;
    
    // Optional fields - có thể null/undefined
    this.phoneNumber = phone_number || null;
    this.address = address || null;
    this.isActive = is_active !== undefined ? is_active : true; // Default true
  }

  isAdmin() {
    return this.roleId === 1;
  }

  toJSON() {
    return {
      userId: this.userId,
      username: this.username,
      email: this.email,
      fullName: this.fullName,
      roleId: this.roleId,
      createdAt: this.createdAt,
      phoneNumber: this.phoneNumber,
      address: this.address,
      isActive: this.isActive
    };
  }

  // Thêm một số method tiện ích
  static fromDB(dbRow) {
    return new User(dbRow);
  }

  // Method để chuẩn bị data cho database insert/update
  toDBObject() {
    return {
      user_id: this.userId,
      username: this.username,
      email: this.email,
      password_hash: this.passwordHash,
      full_name: this.fullName,
      role_id: this.roleId,
      phone_number: this.phoneNumber,
      address: this.address,
      is_active: this.isActive,
      created_at: this.createdAt
    };
  }
}

module.exports = User;