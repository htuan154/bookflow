import 'package:flutter/material.dart';
import '../../services/chat_service.dart';
import '../../classes/user_model.dart';
import '../../services/user_service.dart';

class ChatDetailScreen extends StatefulWidget {
  final String bookingId;
  final dynamic booking;

  const ChatDetailScreen({
    super.key,
    required this.bookingId,
    required this.booking,
  });

  @override
  _ChatDetailScreenState createState() => _ChatDetailScreenState();
}

class _ChatDetailScreenState extends State<ChatDetailScreen> {
  final ChatService _chatService = ChatService();
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  List<dynamic> _messages = [];
  bool _isLoading = true;
  bool _isSending = false;
  String? _errorMessage;
  User? _currentUser;

  @override
  void initState() {
    super.initState();
    _loadUserAndMessages();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadUserAndMessages() async {
    try {
      // Load current user
      _currentUser = await UserService.getUser();

      // Load chat history
      await _loadChatHistory();
    } catch (e) {
      setState(() {
        _errorMessage = 'Lỗi khi tải dữ liệu: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _loadChatHistory() async {
    try {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });

      final result = await _chatService.getChatHistory(widget.bookingId);

      print('🔍 Chat Detail Debug - getChatHistory result: $result');
      print('🔍 Success: ${result['success']}');
      print('🔍 Data: ${result['data']}');
      print('🔍 Data type: ${result['data'].runtimeType}');

      if (result['success'] == true) {
        final chatData = result['data'];
        List<dynamic> messages = [];

        // Xử lý cấu trúc data khác nhau
        if (chatData is Map<String, dynamic>) {
          // Nếu data là object có property messages
          if (chatData.containsKey('messages')) {
            messages = List<dynamic>.from(chatData['messages'] ?? []);
          } else if (chatData.containsKey('chats')) {
            messages = List<dynamic>.from(chatData['chats'] ?? []);
          } else {
            // Nếu data chính là messages array
            messages = [chatData];
          }
        } else if (chatData is List) {
          // Nếu data trực tiếp là array
          messages = List<dynamic>.from(chatData);
        }

        print('🔍 Final messages: $messages');
        print('🔍 Messages count: ${messages.length}');

        setState(() {
          _messages = messages;
          _isLoading = false;
        });

        // Scroll to bottom
        _scrollToBottom();
      } else {
        setState(() {
          _errorMessage = result['message'] ?? 'Lỗi khi tải lịch sử chat';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Lỗi kết nối: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _sendMessage() async {
    final message = _messageController.text.trim();
    if (message.isEmpty || _isSending) return;

    // Clear message input ngay lập tức
    final messageToSend = message;
    _messageController.clear();

    setState(() {
      _isSending = true;

      // Thêm tin nhắn local ngay lập tức để UX tốt hơn
      _messages.add({
        'message_content': messageToSend,
        'message': messageToSend, // Fallback
        'sender_id': _currentUser?.userId,
        'senderId': _currentUser?.userId, // Fallback
        'sender_type': 'customer',
        'created_at': DateTime.now().toIso8601String(),
        'createdAt': DateTime.now().toIso8601String(), // Fallback
        'isLocal': true, // Đánh dấu là tin nhắn local
      });
    });

    // Scroll to bottom ngay lập tức
    _scrollToBottom();

    try {
      final result = await _chatService.sendMessage(
        bookingId: widget.bookingId,
        message: messageToSend,
      );

      print('🔍 Send Message Result: $result');

      if (result['success'] == true) {
        // Remove local message và reload để có real data
        setState(() {
          _messages.removeWhere((msg) => msg['isLocal'] == true);
        });

        // Reload messages để hiển thị tin nhắn từ server
        await _loadChatHistory();
      } else {
        // Remove local message nếu gửi thất bại
        setState(() {
          _messages.removeWhere((msg) => msg['isLocal'] == true);
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Lỗi khi gửi tin nhắn'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      // Remove local message nếu có lỗi
      setState(() {
        _messages.removeWhere((msg) => msg['isLocal'] == true);
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi kết nối: $e'), backgroundColor: Colors.red),
      );
    } finally {
      setState(() {
        _isSending = false;
      });
    }
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      Future.delayed(Duration(milliseconds: 100), () {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: true, // Cho phép resize khi hiện bàn phím
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Chat',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
            Text(
              widget.booking['hotel_name'] ?? 'Đặt phòng khách sạn',
              style: TextStyle(color: Colors.white70, fontSize: 14),
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
        backgroundColor: Colors.orange,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(Icons.refresh, color: Colors.white),
            onPressed: _loadChatHistory,
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Booking info header - Hiển thị đầy đủ thông tin enriched booking
            Container(
              width: double.infinity,
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.orange.shade50,
                border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Tiêu đề và trạng thái
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Thông tin đặt phòng',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.orange.shade800,
                        ),
                      ),
                      _buildStatusChip(
                        widget.booking['booking_status'] ??
                            widget.booking['bookingStatus'] ??
                            'pending',
                      ),
                    ],
                  ),
                  SizedBox(height: 12),

                  // Thông tin khách sạn
                  Row(
                    children: [
                      Icon(
                        Icons.hotel,
                        size: 18,
                        color: Colors.orange.shade700,
                      ),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          widget.booking['hotel_name'] ??
                              'Khách sạn không xác định',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Colors.grey.shade800,
                          ),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 8),

                  // Thông tin loại phòng
                  Row(
                    children: [
                      Icon(
                        Icons.meeting_room,
                        size: 18,
                        color: Colors.grey.shade600,
                      ),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          widget.booking['room_type_name'] ??
                              'Loại phòng không xác định',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey.shade700,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 8),

                  // Ngày check-in và check-out
                  Row(
                    children: [
                      Icon(
                        Icons.calendar_today,
                        size: 18,
                        color: Colors.grey.shade600,
                      ),
                      SizedBox(width: 8),
                      Text(
                        '${_formatDate(widget.booking['check_in_date'] ?? widget.booking['checkInDate'] ?? '')} - ${_formatDate(widget.booking['check_out_date'] ?? widget.booking['checkOutDate'] ?? '')}',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade700,
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 8),

                  // Số khách và giá tiền
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.people,
                            size: 18,
                            color: Colors.grey.shade600,
                          ),
                          SizedBox(width: 8),
                          Text(
                            '${widget.booking['total_guests'] ?? widget.booking['totalGuests'] ?? 1} khách',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey.shade700,
                            ),
                          ),
                        ],
                      ),
                      Text(
                        '${_formatPrice(widget.booking['total_price'] ?? widget.booking['totalPrice'] ?? 0)} VND',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.orange.shade700,
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 8),

                  // Trạng thái thanh toán
                  Row(
                    children: [
                      Icon(
                        Icons.payment,
                        size: 18,
                        color: Colors.grey.shade600,
                      ),
                      SizedBox(width: 8),
                      Text(
                        'Thanh toán: ',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade700,
                        ),
                      ),
                      _buildPaymentStatusChip(
                        widget.booking['payment_status'] ??
                            widget.booking['paymentStatus'] ??
                            'pending',
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Messages - Sử dụng Expanded để chiếm hết không gian còn lại
            Expanded(child: _buildMessagesList()),

            // Message input
            _buildMessageInput(),
          ],
        ),
      ),
    );
  }

  Widget _buildMessagesList() {
    if (_isLoading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Colors.orange),
            ),
            SizedBox(height: 16),
            Text(
              'Đang tải tin nhắn...',
              style: TextStyle(color: Colors.grey.shade600, fontSize: 16),
            ),
          ],
        ),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red.shade300),
            SizedBox(height: 16),
            Text(
              _errorMessage!,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.red.shade600, fontSize: 16),
            ),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadChatHistory,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
              ),
              child: Text('Thử lại'),
            ),
          ],
        ),
      );
    }

    if (_messages.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.chat_bubble_outline,
              size: 64,
              color: Colors.grey.shade400,
            ),
            SizedBox(height: 16),
            Text(
              'Chưa có tin nhắn nào',
              style: TextStyle(
                color: Colors.grey.shade600,
                fontSize: 18,
                fontWeight: FontWeight.w500,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Hãy gửi tin nhắn đầu tiên!',
              style: TextStyle(color: Colors.grey.shade500, fontSize: 14),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      padding: EdgeInsets.all(16),
      itemCount: _messages.length,
      itemBuilder: (context, index) {
        final message = _messages[index];
        return _buildMessageBubble(message);
      },
    );
  }

  Widget _buildMessageBubble(dynamic message) {
    final senderId = message['sender_id'] ?? message['senderId'] ?? '';

    // Thử nhiều cách lấy message content - API trả về messageContent (camelCase)
    String messageText = '';
    if (message['messageContent'] != null &&
        message['messageContent'].toString().isNotEmpty) {
      messageText = message['messageContent'].toString();
    } else if (message['message_content'] != null &&
        message['message_content'].toString().isNotEmpty) {
      messageText = message['message_content'].toString();
    } else if (message['message'] != null &&
        message['message'].toString().isNotEmpty) {
      messageText = message['message'].toString();
    } else if (message['content'] != null &&
        message['content'].toString().isNotEmpty) {
      messageText = message['content'].toString();
    } else if (message['text'] != null &&
        message['text'].toString().isNotEmpty) {
      messageText = message['text'].toString();
    } else {
      messageText = 'Tin nhắn không có nội dung';
    }

    final timestamp = message['created_at'] ?? message['createdAt'] ?? '';

    // Logic giống Messenger: chỉ dựa vào senderId
    final isMyMessage = _currentUser?.userId == senderId;

    print('🎨 Message Bubble Debug:');
    print('🎨 Final messageText: "$messageText"');
    print('🎨 Sender ID: $senderId');
    print('🎨 Current User ID: ${_currentUser?.userId}');
    print('🎨 Is My Message: $isMyMessage (${isMyMessage ? 'RIGHT' : 'LEFT'})');
    print('🎨 Timestamp: $timestamp');

    return Container(
      margin: EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: isMyMessage
            ? MainAxisAlignment.end
            : MainAxisAlignment.start,
        children: [
          // Tin nhắn của người khác - bên trái
          if (!isMyMessage)
            Flexible(
              child: Container(
                constraints: BoxConstraints(
                  maxWidth: MediaQuery.of(context).size.width * 0.75,
                ),
                margin: EdgeInsets.only(left: 16, right: 80),
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.grey.shade200,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(20),
                    topRight: Radius.circular(20),
                    bottomLeft: Radius.circular(4),
                    bottomRight: Radius.circular(20),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      messageText.isEmpty ? 'Tin nhắn trống' : messageText,
                      style: TextStyle(color: Colors.black87, fontSize: 16),
                    ),
                    SizedBox(height: 4),
                    Text(
                      _formatMessageTime(timestamp),
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // Tin nhắn của mình - bên phải
          if (isMyMessage)
            Flexible(
              child: Container(
                constraints: BoxConstraints(
                  maxWidth: MediaQuery.of(context).size.width * 0.75,
                ),
                margin: EdgeInsets.only(left: 80, right: 16),
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.orange,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(20),
                    topRight: Radius.circular(20),
                    bottomLeft: Radius.circular(20),
                    bottomRight: Radius.circular(4),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      messageText.isEmpty ? 'Tin nhắn trống' : messageText,
                      style: TextStyle(color: Colors.white, fontSize: 16),
                    ),
                    SizedBox(height: 4),
                    Text(
                      _formatMessageTime(timestamp),
                      style: TextStyle(color: Colors.white70, fontSize: 11),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildMessageInput() {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey.shade200)),
        boxShadow: [
          BoxShadow(
            offset: Offset(0, -1),
            blurRadius: 4,
            color: Colors.black.withOpacity(0.1),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _messageController,
                decoration: InputDecoration(
                  hintText: 'Nhập tin nhắn...',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide(color: Colors.orange),
                  ),
                  contentPadding: EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                ),
                maxLines: null,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _sendMessage(),
              ),
            ),
            SizedBox(width: 12),
            GestureDetector(
              onTap: _isSending ? null : _sendMessage,
              child: Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: _isSending ? Colors.grey.shade300 : Colors.orange,
                  shape: BoxShape.circle,
                ),
                child: _isSending
                    ? SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            Colors.white,
                          ),
                        ),
                      )
                    : Icon(Icons.send, color: Colors.white, size: 24),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(String dateString) {
    if (dateString.isEmpty) return '';
    try {
      // Nếu là YYYY-MM-DD, chỉ cần format lại
      if (dateString.contains('-') && !dateString.contains('T')) {
        final parts = dateString.split('-');
        if (parts.length == 3) {
          return '${parts[2]}/${parts[1]}/${parts[0]}'; // DD/MM/YYYY
        }
      }
      // Fallback: parse datetime nếu là ISO string
      final date = DateTime.parse(dateString);
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return dateString;
    }
  }

  String _formatPrice(dynamic price) {
    if (price == null) return '0';
    final priceDouble = double.tryParse(price.toString()) ?? 0;
    return priceDouble
        .toStringAsFixed(0)
        .replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]},',
        );
  }

  String _formatMessageTime(String timestamp) {
    if (timestamp.isEmpty) return '';
    try {
      final dateTime = DateTime.parse(timestamp);
      final now = DateTime.now();
      final difference = now.difference(dateTime);

      if (difference.inDays > 0) {
        return '${difference.inDays} ngày trước';
      } else if (difference.inHours > 0) {
        return '${difference.inHours} giờ trước';
      } else if (difference.inMinutes > 0) {
        return '${difference.inMinutes} phút trước';
      } else {
        return 'Vừa xong';
      }
    } catch (e) {
      return timestamp;
    }
  }

  Widget _buildStatusChip(String status) {
    Color backgroundColor;
    Color textColor;
    String displayText;

    switch (status.toLowerCase()) {
      case 'confirmed':
        backgroundColor = Colors.green.shade100;
        textColor = Colors.green.shade700;
        displayText = 'Đã xác nhận';
        break;
      case 'pending':
        backgroundColor = Colors.yellow.shade100;
        textColor = Colors.yellow.shade700;
        displayText = 'Chờ xác nhận';
        break;
      case 'canceled':
        backgroundColor = Colors.red.shade100;
        textColor = Colors.red.shade700;
        displayText = 'Đã hủy';
        break;
      case 'completed':
        backgroundColor = Colors.blue.shade100;
        textColor = Colors.blue.shade700;
        displayText = 'Hoàn thành';
        break;
      default:
        backgroundColor = Colors.grey.shade100;
        textColor = Colors.grey.shade700;
        displayText = status;
    }

    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        displayText,
        style: TextStyle(
          color: textColor,
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  Widget _buildPaymentStatusChip(String status) {
    Color backgroundColor;
    Color textColor;
    String displayText;

    switch (status.toLowerCase()) {
      case 'paid':
        backgroundColor = Colors.green.shade100;
        textColor = Colors.green.shade700;
        displayText = 'Đã thanh toán';
        break;
      case 'pending':
        backgroundColor = Colors.orange.shade100;
        textColor = Colors.orange.shade700;
        displayText = 'Chờ thanh toán';
        break;
      case 'failed':
        backgroundColor = Colors.red.shade100;
        textColor = Colors.red.shade700;
        displayText = 'Thất bại';
        break;
      default:
        backgroundColor = Colors.grey.shade100;
        textColor = Colors.grey.shade700;
        displayText = status;
    }

    return Container(
      padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        displayText,
        style: TextStyle(
          color: textColor,
          fontSize: 11,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
