import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../classes/bank_account_model.dart';
import '../../services/bank_account_service.dart';
import '../../services/token_service.dart';

class BankAccountDetailScreen extends StatefulWidget {
  final BankAccount account;

  const BankAccountDetailScreen({super.key, required this.account});

  @override
  _BankAccountDetailScreenState createState() => _BankAccountDetailScreenState();
}

class _BankAccountDetailScreenState extends State<BankAccountDetailScreen> {
  final BankAccountService _bankAccountService = BankAccountService();
  bool isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.orange,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Chi Tiết Tài Khoản',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
        ),
        // actions: [
        //   PopupMenuButton<String>(
        //     icon: Icon(Icons.more_vert, color: Colors.white),
        //     onSelected: (value) {
        //       if (value == 'edit') {
        //         _editAccount();
        //       } else if (value == 'delete') {
        //         _deleteAccount();
        //       } else if (value == 'set_default') {
        //         _setAsDefault();
        //       }
        //     },
        //     itemBuilder: (BuildContext context) => [
        //       PopupMenuItem(
        //         value: 'edit',
        //         child: Row(
        //           children: [
        //             Icon(Icons.edit_outlined, size: 20, color: Colors.grey[700]),
        //             SizedBox(width: 12),
        //             Text('Chỉnh sửa'),
        //           ],
        //         ),
        //       ),
        //       if (!widget.account.isDefault)
        //         PopupMenuItem(
        //           value: 'set_default',
        //           child: Row(
        //             children: [
        //               Icon(Icons.star_outline, size: 20, color: Colors.grey[700]),
        //               SizedBox(width: 12),
        //               Text('Đặt làm mặc định'),
        //             ],
        //           ),
        //         ),
        //       PopupMenuItem(
        //         value: 'delete',
        //         child: Row(
        //           children: [
        //             Icon(Icons.delete_outline, size: 20, color: Colors.red),
        //             SizedBox(width: 12),
        //             Text('Xóa', style: TextStyle(color: Colors.red)),
        //           ],
        //         ),
        //       ),
        //     ],
        //   ),
        // ],
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(24),
        child: Column(
          children: [
            // Bank Icon
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.orange.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.account_balance,
                size: 40,
                color: Colors.orange,
              ),
            ),
            SizedBox(height: 16),
            
            // Bank Name
            Text(
              widget.account.bankName,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
            SizedBox(height: 8),
            
            // Default Badge
            if (widget.account.isDefault)
              Container(
                padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.orange,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '✓ Tài khoản mặc định',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            
            SizedBox(height: 32),
            
            // Account Details
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  _buildDetailRow(
                    icon: Icons.person_outline,
                    label: 'Chủ tài khoản',
                    value: widget.account.holderName,
                    canCopy: true,
                  ),
                  _buildDivider(),
                  _buildDetailRow(
                    icon: Icons.credit_card,
                    label: 'Số tài khoản',
                    value: widget.account.accountNumber,
                    canCopy: true,
                  ),
                  _buildDivider(),
                  _buildDetailRow(
                    icon: Icons.account_balance,
                    label: 'Ngân hàng',
                    value: widget.account.bankName,
                    canCopy: true,
                  ),
                  if (widget.account.branchName != null) ...[
                    _buildDivider(),
                    _buildDetailRow(
                      icon: Icons.location_on_outlined,
                      label: 'Chi nhánh',
                      value: widget.account.branchName!,
                    ),
                  ],
                  _buildDivider(),
                  _buildDetailRow(
                    icon: Icons.info_outline,
                    label: 'Trạng thái',
                    value: widget.account.status == 'active' ? 'Đang hoạt động' : 'Không hoạt động',
                  ),
                  if (widget.account.createdAt != null) ...[
                    _buildDivider(),
                    _buildDetailRow(
                      icon: Icons.calendar_today_outlined,
                      label: 'Ngày tạo',
                      value: _formatDate(widget.account.createdAt!),
                      isLast: true,
                    ),
                  ],
                ],
              ),
            ),
            
            SizedBox(height: 32),
            
            // Action Buttons
            if (!widget.account.isDefault)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: isLoading ? null : _setAsDefault,
                  icon: Icon(Icons.star, color: Colors.white),
                  label: Text(
                    'Đặt làm tài khoản mặc định',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.orange,
                    padding: EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            
            SizedBox(height: 12),
            
            if (!widget.account.isDefault)
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: isLoading ? null : _deleteAccount,
                  icon: Icon(Icons.delete_outline, color: Colors.red),
                  label: Text('Xóa tài khoản', style: TextStyle(color: Colors.red)),
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: Colors.red),
                    padding: EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            if (widget.account.isDefault)
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: null,
                  icon: Icon(Icons.delete_outline, color: Colors.grey),
                  label: Text('Không thể xóa tài khoản mặc định', style: TextStyle(color: Colors.grey)),
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: Colors.grey),
                    padding: EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow({
    required IconData icon,
    required String label,
    required String value,
    bool canCopy = false,
    bool isLast = false,
  }) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 20, color: Colors.grey[600]),
          ),
          SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.black87,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          if (canCopy)
            IconButton(
              icon: Icon(Icons.copy, size: 20, color: Colors.grey[600]),
              onPressed: () {
                Clipboard.setData(ClipboardData(text: value));
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Đã sao chép: $value'),
                    duration: Duration(seconds: 2),
                  ),
                );
              },
            ),
        ],
      ),
    );
  }

  Widget _buildDivider() {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 20),
      height: 1,
      color: Colors.grey[200],
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }

  void _editAccount() {
    // TODO: Navigate to edit screen
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Chức năng chỉnh sửa đang được phát triển')),
    );
  }

  Future<void> _setAsDefault() async {
    setState(() => isLoading = true);
    try {
      final token = await TokenService.getToken();
      if (token != null) {
        final result = await _bankAccountService.setAsDefault(
          widget.account.bankAccountId,
          token,
        );
        if (result['success'] == true) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Đã đặt làm tài khoản mặc định')),
            );
            Navigator.pop(context, true);
          }
        } else {
          throw Exception(result['message']);
        }
      }
    } catch (e) {
      print('Error setting as default: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Không thể đặt làm tài khoản mặc định')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => isLoading = false);
      }
    }
  }

  Future<void> _deleteAccount() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        title: Text('Xác nhận xóa'),
        content: Text('Bạn có chắc chắn muốn xóa tài khoản này?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Hủy'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('Xóa', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      setState(() => isLoading = true);
      try {
        final token = await TokenService.getToken();
        if (token != null) {
          final result = await _bankAccountService.deleteBankAccount(
            widget.account.bankAccountId,
            token,
          );
          if (result['success'] == true) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Đã xóa tài khoản thành công')),
              );
              Navigator.pop(context, true);
            }
          } else {
            throw Exception(result['message']);
          }
        }
      } catch (e) {
        print('Error deleting account: $e');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Không thể xóa tài khoản: ${e.toString()}')),
          );
        }
      } finally {
        if (mounted) {
          setState(() => isLoading = false);
        }
      }
    }
  }
}
