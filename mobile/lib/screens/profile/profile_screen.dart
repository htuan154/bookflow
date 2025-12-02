import 'package:flutter/material.dart';
import 'edit_profile_screen.dart';
import 'bank_accounts_screen.dart';
import '../../classes/user_model.dart';
import '../../services/user_service.dart';
import '../login_form/login_form.dart';
import '../../services/token_service.dart';
import '../../services/auth_service.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  _ProfileScreenState createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  User? user;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    try {
      final userData = await UserService.getUser();
      if (mounted) {
        setState(() {
          user = userData;
          isLoading = false;
        });
      }
    } catch (e) {
      print('Error loading user data: $e');
      if (mounted) {
        setState(() {
          isLoading = false;
        });
      }
    }
  }

  void _showChangePasswordDialog() {
    final _formKey = GlobalKey<FormState>();
    final currentPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();
    final confirmPasswordController = TextEditingController();
    bool isSubmitting = false;
    bool showCurrentPassword = false;
    bool showNewPassword = false;
    bool showConfirmPassword = false;

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {

            return AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              title: Row(
                children: [
                  Container(
                    padding: EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.orange.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(Icons.lock_outlined, color: Colors.orange),
                  ),
                  SizedBox(width: 12),
                  Text(
                    'Đổi mật khẩu',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                  ),
                ],
              ),
              content: ConstrainedBox(
                constraints: BoxConstraints(maxWidth: 420),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      TextFormField(
                        controller: currentPasswordController,
                        obscureText: !showCurrentPassword,
                        decoration: InputDecoration(
                          labelText: 'Mật khẩu hiện tại',
                          prefixIcon: Icon(Icons.lock_outline),
                          suffixIcon: IconButton(
                            icon: Icon(showCurrentPassword ? Icons.visibility_off : Icons.visibility),
                            onPressed: () => setDialogState(() => showCurrentPassword = !showCurrentPassword),
                          ),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        validator: (v) => (v == null || v.isEmpty) ? 'Vui lòng nhập mật khẩu hiện tại' : null,
                      ),
                      SizedBox(height: 12),
                      TextFormField(
                        controller: newPasswordController,
                        obscureText: !showNewPassword,
                        decoration: InputDecoration(
                          labelText: 'Mật khẩu mới',
                          prefixIcon: Icon(Icons.lock),
                          suffixIcon: IconButton(
                            icon: Icon(showNewPassword ? Icons.visibility_off : Icons.visibility),
                            onPressed: () => setDialogState(() => showNewPassword = !showNewPassword),
                          ),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        validator: (v) {
                          if (v == null || v.isEmpty) return 'Vui lòng nhập mật khẩu mới';
                          if (v.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
                          return null;
                        },
                      ),
                      SizedBox(height: 12),
                      TextFormField(
                        controller: confirmPasswordController,
                        obscureText: !showConfirmPassword,
                        decoration: InputDecoration(
                          labelText: 'Xác nhận mật khẩu mới',
                          prefixIcon: Icon(Icons.lock),
                          suffixIcon: IconButton(
                            icon: Icon(showConfirmPassword ? Icons.visibility_off : Icons.visibility),
                            onPressed: () => setDialogState(() => showConfirmPassword = !showConfirmPassword),
                          ),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        validator: (v) {
                          if (v == null || v.isEmpty) return 'Vui lòng xác nhận mật khẩu';
                          if (v != newPasswordController.text) return 'Mật khẩu xác nhận không khớp';
                          return null;
                        },
                      ),
                      SizedBox(height: 12),
                      Container(
                        width: double.infinity,
                        padding: EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.orange.withOpacity(0.06),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.orange.withOpacity(0.15)),
                        ),
                        child: Text(
                          'Yêu cầu: Mật khẩu mới tối thiểu 6 ký tự và khớp với xác nhận.',
                          style: TextStyle(fontSize: 13, color: Colors.orange[800]),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              actions: [
                TextButton(
                  onPressed: isSubmitting ? null : () => Navigator.pop(context),
                  child: Text('Hủy', style: TextStyle(color: Colors.grey[700])),
                ),
                ElevatedButton(
                  onPressed: isSubmitting
                      ? null
                      : () async {
                          if (!(_formKey.currentState?.validate() ?? false)) return;
                          setDialogState(() => isSubmitting = true);
                          try {
                            final token = await TokenService.getToken();
                            if (token == null) throw Exception('Token không tồn tại');

                            final result = await AuthService().changePassword(
                              userId: user!.userId,
                              newPassword: newPasswordController.text,
                              token: token,
                            );

                            Navigator.pop(context);

                            if (result['success'] == true) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('✅ Đổi mật khẩu thành công!'), backgroundColor: Colors.green),
                              );
                            } else {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text(result['message'] ?? 'Đổi mật khẩu thất bại'), backgroundColor: Colors.red),
                              );
                            }
                          } catch (e) {
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Lỗi: $e'), backgroundColor: Colors.red),
                            );
                          } finally {
                            // ensure state reset
                            setDialogState(() => isSubmitting = false);
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.orange,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                  ),
                  child: isSubmitting
                      ? SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : Text('Đổi mật khẩu', style: TextStyle(fontWeight: FontWeight.w700)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        backgroundColor: Colors.grey[50],
        appBar: AppBar(
          title: Text(
          'Hồ sơ cá nhân',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
        ),
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: Icon(Icons.arrow_back, color: Colors.black87),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
          'Hồ sơ cá nhân',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.orange,
        elevation: 0,
        automaticallyImplyLeading: false,
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(24.0),
        child: Column(
          children: [
            // Profile Picture Section
            Container(
              margin: EdgeInsets.only(bottom: 32),
              child: Column(
                children: [
                  Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      color: Color(0xFFFFD700), // Màu vàng như trong hình
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      ((user?.fullName?.trim() ?? '').isNotEmpty)
                          ? user!.fullName!.trim()[0].toUpperCase()
                          : ((user?.username?.trim() ?? '').isNotEmpty)
                              ? user!.username!.trim()[0].toUpperCase()
                              : '?',
                      style: TextStyle(
                        fontSize: 56,
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  SizedBox(height: 16),
                  Text(
                    user?.fullName ?? 'Chưa có',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    user?.username ?? 'Chưa có',
                    style: TextStyle(fontSize: 16, color: Colors.grey[600]),
                  ),
                ],
              ),
            ),

            // User Information Section
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
                  _buildInfoRow(
                    icon: Icons.email_outlined,
                    label: 'Email',
                    value: user?.email ?? 'Chưa có',
                  ),
                  _buildDivider(),
                  _buildInfoRow(
                    icon: Icons.phone_outlined,
                    label: 'Số điện thoại',
                    value: user?.phoneNumber ?? 'Chưa có',
                  ),
                  _buildDivider(),
                  _buildInfoRow(
                    icon: Icons.person_outline,
                    label: 'Họ và tên',
                    value: user?.createdAt != null
                        ? 'Tham gia vào ${user!.createdAt.toString().substring(0, 10)}'
                        : 'Chưa có',
                  ),
                  _buildDivider(),
                  _buildInfoRow(
                    icon: Icons.location_on_outlined,
                    label: 'Địa chỉ',
                    value: user?.address ?? 'Chưa có',
                    isLast: true,
                  ),
                ],
              ),
            ),

            SizedBox(height: 32),

            // Action Buttons
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
                  _buildActionRow(
                    icon: Icons.edit_outlined,
                    title: 'Chỉnh sửa thông tin',
                    onTap: () async {
                      final result = await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => EditProfileScreen(user: user),
                        ),
                      );
                      if (result == true) {
                        // Reload user data if profile was updated
                        _loadUserData();
                      }
                    },
                  ),
                  _buildDivider(),
                  _buildActionRow(
                    icon: Icons.account_balance_wallet_outlined,
                    title: 'Thông Tin Thanh Toán',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => BankAccountsScreen(),
                        ),
                      );
                    },
                  ),
                  _buildDivider(),
                  _buildActionRow(
                    icon: Icons.lock_outlined,
                    title: 'Đổi mật khẩu',
                    onTap: () {
                      _showChangePasswordDialog();
                    },
                  ),
                  _buildDivider(),
                  _buildActionRow(
                    icon: Icons.logout_outlined,
                    title: 'Đăng xuất',
                    onTap: () async {
                      // Xóa toàn bộ token và user, chuyển về LoginScreen
                      await TokenService.clearAll();
                      await Future.delayed(Duration(milliseconds: 100));
                      Navigator.of(context).pushAndRemoveUntil(
                        MaterialPageRoute(builder: (context) => LoginScreen()),
                        (route) => false,
                      );
                    },
                    isLast: true,
                    textColor: Colors.red[600],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
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
                    fontSize: 14,
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
        ],
      ),
    );
  }

  Widget _buildActionRow({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    bool isLast = false,
    Color? textColor,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(isLast ? 16 : 0),
      child: Container(
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
              child: Icon(icon, size: 20, color: textColor ?? Colors.grey[600]),
            ),
            SizedBox(width: 16),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 16,
                  color: textColor ?? Colors.black87,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            Icon(Icons.chevron_right, color: Colors.grey[400]),
          ],
        ),
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
}
