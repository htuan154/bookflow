import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../services/bank_account_service.dart';
import '../../services/token_service.dart';

class AddBankAccountScreen extends StatefulWidget {
  final bool autoSetDefault;
  
  const AddBankAccountScreen({
    super.key,
    this.autoSetDefault = false,
  });

  @override
  _AddBankAccountScreenState createState() => _AddBankAccountScreenState();
}


class _AddBankAccountScreenState extends State<AddBankAccountScreen> {
  final _formKey = GlobalKey<FormState>();
  final _holderNameController = TextEditingController();
  final _accountNumberController = TextEditingController();
  final _bankNameController = TextEditingController();
  final _branchNameController = TextEditingController();

  bool _isDefault = false;
  bool _isLoading = false;

  final BankAccountService _bankAccountService = BankAccountService();

  @override
  void initState() {
    super.initState();
    // Nếu autoSetDefault = true, tự động set _isDefault = true
    if (widget.autoSetDefault) {
      _isDefault = true;
    }
  }

  // Danh sách 18 ngân hàng mặc định
  final List<Map<String, String>> _defaultBanks = [
    {'name': 'ACB', 'asset': 'assets/banking/ACBank_logo.svg.png'},
    {'name': 'Agribank', 'asset': 'assets/banking/Agribank_logo.png'},
    {'name': 'BIDV', 'asset': 'assets/banking/BIDV_logo.png'},
    {'name': 'HDBank', 'asset': 'assets/banking/HDBank_logo.jpg'},
    {'name': 'HSBC', 'asset': 'assets/banking/HSBC_logo.jpg'},
    {'name': 'LPBank', 'asset': 'assets/banking/LPBank_logo.png'},
    {'name': 'MB', 'asset': 'assets/banking/MB_logo.png'},
    {'name': 'Sacombank', 'asset': 'assets/banking/Sacombank_logo.png'},
    {'name': 'SHB', 'asset': 'assets/banking/SHB_logo.png'},
    {'name': 'Shinhan Bank', 'asset': 'assets/banking/ShinhanBank_logo.png'},
    {'name': 'Standard Chartered', 'asset': 'assets/banking/StandardCharteredVietnam_logo.jpg'},
    {'name': 'Techcombank', 'asset': 'assets/banking/Techcombank_logo.png'},
    {'name': 'TPBank', 'asset': 'assets/banking/TPBank_logo.png'},
    {'name': 'VIB', 'asset': 'assets/banking/VIB_logo.png'},
    {'name': 'Vietcombank', 'asset': 'assets/banking/Vietcombank_logo.png'},
    {'name': 'VietinBank', 'asset': 'assets/banking/ViettinBank_logo.png'},
    {'name': 'VPBank', 'asset': 'assets/banking/VPB_logo.jpg'},
    {'name': 'Woori Bank', 'asset': 'assets/banking/WooriBankVietnam_logo.jpg'},
  ];

  @override
  void dispose() {
    _holderNameController.dispose();
    _accountNumberController.dispose();
    _bankNameController.dispose();
    _branchNameController.dispose();
    super.dispose();
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isLoading = true);

    try {
      final token = await TokenService.getToken();
      if (token == null) {
        throw Exception('Không tìm thấy token xác thực');
      }

      final data = {
        'holder_name': _holderNameController.text.trim(),
        'account_number': _accountNumberController.text.trim(),
        'bank_name': _bankNameController.text.trim(),
        'branch_name': _branchNameController.text.trim().isNotEmpty 
            ? _branchNameController.text.trim() 
            : null,
        'is_default': _isDefault,
        'status': 'active',
      };

      final result = await _bankAccountService.createBankAccount(data, token);

      if (mounted) {
        if (result['success'] == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Thêm tài khoản thành công'),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.pop(context, true);
        } else {
          throw Exception(result['message'] ?? 'Không thể thêm tài khoản');
        }
      }
    } catch (e) {
      print('Error creating bank account: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _showBankPicker() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Container(
          color: Colors.white,
          padding: EdgeInsets.symmetric(vertical: 20, horizontal: 12),
          height: 440,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 8, vertical: 10),
                child: Text(
                  'Chọn ngân hàng',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Divider(),
              Expanded(
                child: GridView.builder(
                  itemCount: _defaultBanks.length,
                  padding: EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 8,
                    childAspectRatio: 0.8,
                  ),
                  itemBuilder: (context, index) {
                    final bank = _defaultBanks[index];
                    final isSelected = _bankNameController.text == bank['name'];
                    return Material(
                      color: Colors.transparent,
                      child: InkWell(
                        borderRadius: BorderRadius.circular(16),
                        onTap: () {
                          setState(() {
                            _bankNameController.text = bank['name']!;
                          });
                          Navigator.pop(context);
                        },
                        child: Container(
                          margin: EdgeInsets.symmetric(horizontal: 2),
                          padding: EdgeInsets.symmetric(vertical: 10, horizontal: 4),
                          decoration: BoxDecoration(
                            color: isSelected ? Color(0xFFe8f5e9) : Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isSelected ? Color(0xFF4CAF50) : Colors.grey[200]!,
                              width: isSelected ? 2 : 1,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.04),
                                blurRadius: 4,
                                offset: Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: isSelected ? Color(0xFF4CAF50) : Colors.grey[200]!,
                                    width: isSelected ? 2 : 1,
                                  ),
                                ),
                                child: Padding(
                                  padding: EdgeInsets.all(4),
                                  child: Image.asset(bank['asset']!, fit: BoxFit.contain),
                                ),
                              ),
                              SizedBox(height: 8),
                              Text(
                                bank['name']!,
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: isSelected ? Color(0xFF388E3C) : Colors.black87,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.orange,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.close, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Thêm Tài Khoản Ngân Hàng',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
        ),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: EdgeInsets.all(24),
          children: [
            // Holder Name
            Text(
              'Chủ tài khoản',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
            SizedBox(height: 8),
            TextFormField(
              controller: _holderNameController,
              textCapitalization: TextCapitalization.characters,
              decoration: InputDecoration(
                hintText: 'VD: NGUYEN VAN A',
                prefixIcon: Icon(Icons.person_outline),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey[300]!),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey[300]!),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Color(0xFF4CAF50), width: 2),
                ),
                filled: true,
                fillColor: Colors.white,
              ),
              validator: (value) {
                final text = value?.trim() ?? '';
                if (text.isEmpty) {
                  return 'Vui lòng nhập tên chủ tài khoản';
                }
                if (text.length <= 5) {
                  return 'Tên chủ tài khoản phải hơn 5 ký tự';
                }
                if (RegExp(r'[0-9]').hasMatch(text)) {
                  return 'Tên chủ tài khoản không được chứa số';
                }
                return null;
              },
            ),
            
            SizedBox(height: 20),
            
            // Account Number
            Text(
              'Số tài khoản',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
            SizedBox(height: 8),
            TextFormField(
              controller: _accountNumberController,
              keyboardType: TextInputType.number,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(20),
              ],
              decoration: InputDecoration(
                hintText: 'Nhập số tài khoản',
                prefixIcon: Icon(Icons.credit_card),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey[300]!),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey[300]!),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Color(0xFF4CAF50), width: 2),
                ),
                filled: true,
                fillColor: Colors.white,
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Vui lòng nhập số tài khoản';
                }
                if (value.trim().length < 6 || value.trim().length > 20) {
                  return 'Số tài khoản phải từ 6-20 chữ số';
                }
                return null;
              },
            ),
            
            SizedBox(height: 20),
            
            // Bank Name
            Text(
              'Ngân hàng',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
            SizedBox(height: 8),
            TextFormField(
              controller: _bankNameController,
              readOnly: true,
              onTap: _showBankPicker,
              decoration: InputDecoration(
                hintText: 'Chọn ngân hàng',
                prefixIcon: Icon(Icons.account_balance),
                suffixIcon: Icon(Icons.arrow_drop_down),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey[300]!),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey[300]!),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Color(0xFF4CAF50), width: 2),
                ),
                filled: true,
                fillColor: Colors.white,
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Vui lòng chọn ngân hàng';
                }
                return null;
              },
            ),
            
            SizedBox(height: 20),
            
            // Branch Name (Optional)
            Text(
              'Chi nhánh',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
            SizedBox(height: 8),
            TextFormField(
              controller: _branchNameController,
              textCapitalization: TextCapitalization.words,
              decoration: InputDecoration(
                hintText: 'VD: Chi nhánh Hà Nội',
                prefixIcon: Icon(Icons.location_on_outlined),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey[300]!),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey[300]!),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.orange, width: 2),
                ),
                filled: true,
                fillColor: Colors.white,
              ),
            ),
            
            SizedBox(height: 20),
            
            // Set as Default
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[300]!),
              ),
              child: SwitchListTile(
                title: Text(
                  'Đặt làm tài khoản mặc định',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                subtitle: Text(
                  widget.autoSetDefault 
                    ? 'Tài khoản này sẽ được đặt làm mặc định tự động'
                    : 'Tài khoản này sẽ được sử dụng cho các giao dịch',
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
                value: _isDefault,
                onChanged: widget.autoSetDefault 
                  ? null // Không cho thay đổi nếu autoSetDefault = true
                  : (value) {
                      setState(() => _isDefault = value);
                    },
                activeColor: Colors.orange,
                inactiveThumbColor: Colors.grey[400],
                inactiveTrackColor: Colors.grey[300],
              ),
            ),
            
            SizedBox(height: 32),
            
            // Submit Button
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _submitForm,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
                child: _isLoading
                    ? SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Text(
                        'Thêm tài khoản',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
