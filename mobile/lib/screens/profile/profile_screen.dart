import 'package:flutter/material.dart';
import 'edit_profile_screen.dart';
import 'bank_accounts_screen.dart';
import '../../classes/user_model.dart';
import '../../services/user_service.dart';
import '../login_form/login_form.dart';
import '../../services/token_service.dart';

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
