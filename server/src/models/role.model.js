class Role {
  constructor({ role_id, role_name, role_description, is_active, created_at }) {
    this.roleId = role_id;
    this.roleName = role_name;
    this.roleDescription = role_description;
    this.isActive = is_active;
    this.createdAt = created_at;
  }

  toJSON() {
    return {
      roleId: this.roleId,
      roleName: this.roleName,
      roleDescription: this.roleDescription,
      isActive: this.isActive,
      createdAt: this.createdAt,
    };
  }
}

module.exports = Role;