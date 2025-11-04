// src/api/v1/repositories/bank_account.repository.js
'use strict';
const pool = require('../../../config/db');
const BankAccount = require('../../../models/bank_account.model');

class BankAccountRepository {
  /**
   * Lấy tất cả tài khoản ngân hàng trong hệ thống
   */
  async getAll() {
    const sql = `
      SELECT ba.*, u.full_name as user_name, h.name as hotel_name
      FROM bank_accounts ba
      LEFT JOIN users u ON ba.user_id = u.user_id
      LEFT JOIN hotels h ON ba.hotel_id = h.hotel_id
      ORDER BY ba.is_default DESC, ba.created_at DESC
    `;
    const { rows } = await pool.query(sql);
    return rows.map(row => {
      const bankAccount = BankAccount.fromDB(row);
      bankAccount.userName = row.user_name;
      bankAccount.hotelName = row.hotel_name;
      return bankAccount;
    });
  }

  /**
   * Tạo tài khoản ngân hàng mới
   */
  async create(bankAccountData) {
    const {
      user_id,
      hotel_id,
      holder_name,
      account_number,
      bank_name,
      branch_name,
      is_default,
      status
    } = bankAccountData;

    const sql = `
      INSERT INTO bank_accounts (
        user_id, hotel_id, holder_name, account_number, 
        bank_name, branch_name, is_default, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      user_id,
      hotel_id || null,
      holder_name,
      account_number,
      bank_name,
      branch_name || null,
      is_default || false,
      status || 'active'
    ];

    const { rows } = await pool.query(sql, values);
    return BankAccount.fromDB(rows[0]);
  }

  /**
   * Lấy tài khoản ngân hàng theo ID
   */
  async getById(bankAccountId) {
    const sql = `
      SELECT ba.*, u.full_name as user_name, h.name as hotel_name
      FROM bank_accounts ba
      LEFT JOIN users u ON ba.user_id = u.user_id
      LEFT JOIN hotels h ON ba.hotel_id = h.hotel_id
      WHERE ba.bank_account_id = $1
    `;

    const { rows } = await pool.query(sql, [bankAccountId]);
    if (rows.length === 0) return null;

    const bankAccount = BankAccount.fromDB(rows[0]);
    bankAccount.userName = rows[0].user_name;
    bankAccount.hotelName = rows[0].hotel_name;
    return bankAccount;
  }

  /**
   * Lấy danh sách tài khoản ngân hàng của user
   */
  async getByUserId(userId, { hotelId = null, status = null } = {}) {
    let sql = `
      SELECT ba.*, h.name as hotel_name
      FROM bank_accounts ba
      LEFT JOIN hotels h ON ba.hotel_id = h.hotel_id
      WHERE ba.user_id = $1
    `;
    const params = [userId];

    if (hotelId) {
      sql += ` AND ba.hotel_id = $${params.length + 1}`;
      params.push(hotelId);
    }

    if (status) {
      sql += ` AND ba.status = $${params.length + 1}`;
      params.push(status);
    }

    sql += ` ORDER BY ba.is_default DESC, ba.created_at DESC`;

    const { rows } = await pool.query(sql, params);
    return rows.map(row => {
      const bankAccount = BankAccount.fromDB(row);
      bankAccount.hotelName = row.hotel_name;
      return bankAccount;
    });
  }

  /**
   * Lấy danh sách tài khoản ngân hàng của hotel
   */
  async getByHotelId(hotelId, { status = null } = {}) {
    let sql = `
      SELECT ba.*, u.full_name as user_name, h.name as hotel_name
      FROM bank_accounts ba
      LEFT JOIN users u ON ba.user_id = u.user_id
      LEFT JOIN hotels h ON ba.hotel_id = h.hotel_id
      WHERE ba.hotel_id = $1
    `;
    const params = [hotelId];

    if (status) {
      sql += ` AND ba.status = $${params.length + 1}`;
      params.push(status);
    }

    sql += ` ORDER BY ba.is_default DESC, ba.created_at DESC`;

    const { rows } = await pool.query(sql, params);
    return rows.map(row => {
      const bankAccount = BankAccount.fromDB(row);
      bankAccount.userName = row.user_name;
      bankAccount.hotelName = row.hotel_name;
      return bankAccount;
    });
  }

  /**
   * Lấy tài khoản ngân hàng mặc định của user
   */
  async getDefaultByUserId(userId) {
    const sql = `
      SELECT ba.*, h.name as hotel_name
      FROM bank_accounts ba
      LEFT JOIN hotels h ON ba.hotel_id = h.hotel_id
      WHERE ba.user_id = $1 AND ba.is_default = true AND ba.status = 'active'
    `;

    const { rows } = await pool.query(sql, [userId]);
    if (rows.length === 0) return null;

    const bankAccount = BankAccount.fromDB(rows[0]);
    bankAccount.hotelName = rows[0].hotel_name;
    return bankAccount;
  }

  /**
   * Lấy tài khoản ngân hàng mặc định của hotel
   */
  async getDefaultByHotelId(hotelId) {
    const sql = `
      SELECT ba.*, u.full_name as user_name, h.name as hotel_name
      FROM bank_accounts ba
      LEFT JOIN users u ON ba.user_id = u.user_id
      LEFT JOIN hotels h ON ba.hotel_id = h.hotel_id
      WHERE ba.hotel_id = $1 AND ba.is_default = true AND ba.status = 'active'
    `;

    const { rows } = await pool.query(sql, [hotelId]);
    if (rows.length === 0) return null;

    const bankAccount = BankAccount.fromDB(rows[0]);
    bankAccount.userName = rows[0].user_name;
    bankAccount.hotelName = rows[0].hotel_name;
    return bankAccount;
  }

  /**
   * Cập nhật thông tin tài khoản ngân hàng
   */
  async update(bankAccountId, updateData) {
    const allowedFields = [
      'holder_name', 'account_number', 'bank_name', 
      'branch_name', 'is_default', 'status'
    ];
    
    const updates = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Always update updated_at
    updates.push(`updated_at = NOW()`);

    const sql = `
      UPDATE bank_accounts 
      SET ${updates.join(', ')}
      WHERE bank_account_id = $${paramIndex}
      RETURNING *
    `;

    values.push(bankAccountId);

    const { rows } = await pool.query(sql, values);
    if (rows.length === 0) return null;

    return BankAccount.fromDB(rows[0]);
  }

  /**
   * Đặt tài khoản làm mặc định (và bỏ mặc định các tài khoản khác)
   */
  async setAsDefault(bankAccountId, userId, hotelId = null) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Reset all other default accounts for this user/hotel
      if (hotelId) {
        await client.query(
          'UPDATE bank_accounts SET is_default = false WHERE hotel_id = $1 AND is_default = true',
          [hotelId]
        );
      } else {
        await client.query(
          'UPDATE bank_accounts SET is_default = false WHERE user_id = $1 AND hotel_id IS NULL AND is_default = true',
          [userId]
        );
      }

      // Set this account as default
      const { rows } = await client.query(
        'UPDATE bank_accounts SET is_default = true, updated_at = NOW() WHERE bank_account_id = $1 RETURNING *',
        [bankAccountId]
      );

      await client.query('COMMIT');

      if (rows.length === 0) return null;
      return BankAccount.fromDB(rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Xóa tài khoản ngân hàng (soft delete)
   */
  async delete(bankAccountId) {
    const sql = `
      UPDATE bank_accounts 
      SET status = 'inactive', updated_at = NOW()
      WHERE bank_account_id = $1
      RETURNING *
    `;

    const { rows } = await pool.query(sql, [bankAccountId]);
    if (rows.length === 0) return null;

    return BankAccount.fromDB(rows[0]);
  }

  /**
   * Xóa tài khoản ngân hàng vĩnh viễn (hard delete)
   */
  async hardDelete(bankAccountId) {
    const sql = `DELETE FROM bank_accounts WHERE bank_account_id = $1 RETURNING *`;
    
    const { rows } = await pool.query(sql, [bankAccountId]);
    if (rows.length === 0) return null;

    return BankAccount.fromDB(rows[0]);
  }

  /**
   * Kiểm tra xem số tài khoản đã tồn tại chưa
   */
  async checkAccountExists(accountNumber, bankName, excludeId = null) {
    let sql = `
      SELECT bank_account_id 
      FROM bank_accounts 
      WHERE account_number = $1 AND bank_name = $2 AND status = 'active'
    `;
    const params = [accountNumber, bankName];

    if (excludeId) {
      sql += ` AND bank_account_id != $3`;
      params.push(excludeId);
    }

    const { rows } = await pool.query(sql, params);
    return rows.length > 0;
  }

  /**
   * Thống kê tài khoản ngân hàng
   */
  async getStatistics() {
    const sql = `
      SELECT 
        COUNT(*) as total_accounts,
        COUNT(*) FILTER (WHERE status = 'active') as active_accounts,
        COUNT(*) FILTER (WHERE status = 'inactive') as inactive_accounts,
        COUNT(*) FILTER (WHERE is_default = true) as default_accounts,
        COUNT(*) FILTER (WHERE hotel_id IS NOT NULL) as hotel_accounts,
        COUNT(*) FILTER (WHERE hotel_id IS NULL) as user_accounts,
        COUNT(DISTINCT bank_name) as unique_banks
      FROM bank_accounts
    `;

    const { rows } = await pool.query(sql);
    return rows[0];
  }

  /**
   * Lấy danh sách ngân hàng phổ biến
   */
  async getPopularBanks(limit = 10) {
    const sql = `
      SELECT 
        bank_name,
        COUNT(*) as account_count,
        COUNT(*) FILTER (WHERE status = 'active') as active_count
      FROM bank_accounts 
      GROUP BY bank_name 
      ORDER BY account_count DESC 
      LIMIT $1
    `;

    const { rows } = await pool.query(sql, [limit]);
    return rows;
  }
}

module.exports = new BankAccountRepository();