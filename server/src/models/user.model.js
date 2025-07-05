// src/models/user.model.js

class User {

  constructor({ user_id, username, email, password_hash, full_name, role_id, created_at }) {
    this.userId = user_id;
    this.username = username;
    this.email = email;
    this.passwordHash = password_hash; 
    this.fullName = full_name;
    this.roleId = role_id;
    this.createdAt = created_at;
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
    };
  }
}

module.exports = User;