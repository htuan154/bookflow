import 'dart:convert';
import 'package:flutter/material.dart';
import '../../services/ai_service.dart';
import '../../services/auth_service.dart';
import '../../services/token_service.dart';

class ChatbotDetailScreen extends StatefulWidget {
  final String? sessionId; // Session ID từ ngoài truyền vào
  
  const ChatbotDetailScreen({super.key, this.sessionId});

  @override
  _ChatbotDetailScreenState createState() => _ChatbotDetailScreenState();
}

class _ChatbotDetailScreenState extends State<ChatbotDetailScreen> {
  final AiService _aiService = AiService(AuthService());
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  
  List<Map<String, dynamic>> _messages = [];
  List<Map<String, dynamic>> _chatSessions = [];
  bool _isLoading = false;
  bool _isSending = false;
  bool _hasToken = false;
  String? _activeSessionId;
  String _inputText = ''; // Track input text for button color

  @override
  void initState() {
    super.initState();
    _messageController.addListener(() {
      setState(() {
        _inputText = _messageController.text;
      });
    });
    _initializeChat();
  }

  Future<void> _initializeChat() async {
    // Kiểm tra xem user có đăng nhập không
    _hasToken = await TokenService.hasToken();
    
    if (_hasToken) {
      // Load danh sách sessions trước
      await _loadChatSessionsList();
      
      // Nếu có sessionId được truyền vào, load session đó
      if (widget.sessionId != null && widget.sessionId!.isNotEmpty) {
        _activeSessionId = widget.sessionId;
        await _loadChatMessages(_activeSessionId!);
      } else if (_chatSessions.isNotEmpty) {
        // Load session gần nhất
        final latestSession = _chatSessions.first;
        _activeSessionId = latestSession['_id']?.toString();
        if (_activeSessionId != null) {
          await _loadChatMessages(_activeSessionId!);
        }
      } else {
        // Không có session nào, tạo mới
        _startNewSession();
      }
    } else {
      // Chỉ tạo session mới
      _startNewSession();
    }
  }

  // Load danh sách sessions (không load messages)
  Future<void> _loadChatSessionsList() async {
    try {
      final sessions = await _aiService.getChatSessions(requireAuth: true);
      setState(() {
        _chatSessions = sessions;
      });
    } catch (e) {
      print('[ChatbotDetail] Error loading sessions list: $e');
      setState(() {
        _chatSessions = [];
      });
    }
  }

  Future<void> _loadChatSessions() async {
    setState(() => _isLoading = true);
    
    try {
      final sessions = await _aiService.getChatSessions(requireAuth: true);
      
      setState(() {
        _chatSessions = sessions;
        _isLoading = false;
      });

      // Nếu có sessions, load session gần nhất
      if (sessions.isNotEmpty) {
        final latestSession = sessions.first;
        _activeSessionId = latestSession['_id']?.toString();
        if (_activeSessionId != null) {
          await _loadChatMessages(_activeSessionId!);
        }
      } else {
        // Không có session nào, tạo mới
        _startNewSession();
      }
    } catch (e) {
      print('[ChatbotDetail] Error loading sessions: $e');
      setState(() => _isLoading = false);
      // Fallback: tạo session mới
      _startNewSession();
    }
  }

  Future<void> _loadChatMessages(String sessionId) async {
    setState(() => _isLoading = true);
    
    try {
      print('[ChatbotDetail] Loading messages for session: $sessionId');
      final messages = await _aiService.getChatMessages(
        sessionId: sessionId,
        page: 1,
        pageSize: 500,
        requireAuth: true,
      );
      
      print('[ChatbotDetail] Received ${messages.length} messages from backend');
      
      // Convert MongoDB messages to UI format
      final convertedMessages = messages.map((msg) {
        print('[ChatbotDetail] Processing message: ${msg.keys}');
        print('[ChatbotDetail] Raw message data: $msg');
        
        // Extract payload từ reply (giống AdminSuggestionsPage - pickPayload function)
        // Backend trả về: { id, message, reply, replyPayload, timestamp, source, intent }
        dynamic payload;
        try {
          // Backend đã flatten thành replyPayload rồi
          payload = msg['replyPayload'] ?? msg['reply']?['payload'] ?? msg['payload'] ?? {};
          
          // Nếu payload là string JSON, parse nó
          if (payload is String) {
            try {
              payload = jsonDecode(payload);
            } catch (e) {
              print('[ChatbotDetail] Cannot parse payload JSON: $e');
              // Giữ nguyên string nếu không parse được
              payload = {'summary': payload};
            }
          }
        } catch (e) {
          print('[ChatbotDetail] Error extracting payload: $e');
          payload = {};
        }
        
        // Extract user message text (backend trả về message là string trực tiếp)
        final userMessage = msg['message'] is String 
            ? msg['message'] 
            : (msg['message']?['text'] ?? 
               msg['messageText'] ?? 
               msg['message_text'] ?? 
               msg['question']);
        
        // Extract timestamp
        final timestamp = msg['timestamp'] ?? msg['created_at'];
        
        print('[ChatbotDetail] User message: $userMessage');
        print('[ChatbotDetail] Payload type: ${payload.runtimeType}');
        
        return {
          'id': msg['id']?.toString() ?? DateTime.now().millisecondsSinceEpoch.toString(),
          'role': 'assistant',
          'content': payload ?? {},
          'timestamp': DateTime.tryParse(timestamp?.toString() ?? '') ?? DateTime.now(),
          'user_message': userMessage, // Lưu câu hỏi của user
        };
      }).toList();

      print('[ChatbotDetail] Converted ${convertedMessages.length} messages');

      // Expand messages để hiển thị cả user message và assistant reply
      List<Map<String, dynamic>> expandedMessages = [];
      for (var msg in convertedMessages) {
        // Add user message
        if (msg['user_message'] != null) {
          expandedMessages.add({
            'id': '${msg['id']}_user',
            'role': 'user',
            'content': msg['user_message'],
            'timestamp': msg['timestamp'],
          });
        }
        // Add assistant reply
        expandedMessages.add({
          'id': msg['id'],
          'role': 'assistant',
          'content': msg['content'],
          'timestamp': msg['timestamp'],
        });
      }

      print('[ChatbotDetail] Expanded to ${expandedMessages.length} messages (with user bubbles)');

      setState(() {
        _messages = expandedMessages;
        _isLoading = false;
      });

      _scrollToBottom();
    } catch (e) {
      print('[ChatbotDetail] Error loading messages: $e');
      setState(() => _isLoading = false);
    }
  }

  void _startNewSession() {
    setState(() {
      _activeSessionId = DateTime.now().millisecondsSinceEpoch.toString();
      _messages = [];
    });
  }

  Future<void> _sendMessage() async {
    final message = _messageController.text.trim();
    if (message.isEmpty || _isSending) return;

    // ✅ XÓA INPUT NGAY LẬP TỨC (giống AdminSuggestionsPage)
    _messageController.clear();

    setState(() {
      _isSending = true;
      _messages.add({
        'id': DateTime.now().millisecondsSinceEpoch.toString(),
        'role': 'user',
        'content': message,
        'timestamp': DateTime.now(),
      });
    });

    _scrollToBottom();

    try {
      // Gửi với requireAuth dựa vào việc user có đăng nhập hay không
      final response = await _aiService.suggest(
        message: message,
        sessionId: _activeSessionId,
        requireAuth: _hasToken,
      );

      setState(() {
        _messages.add({
          'id': DateTime.now().millisecondsSinceEpoch.toString(),
          'role': 'assistant',
          'content': response,
          'timestamp': DateTime.now(),
        });
        _isSending = false;
      });

      _scrollToBottom();
      
      // Reload sessions list để hiển thị chat mới
      if (_hasToken) {
        _loadChatSessionsList();
      }
    } catch (e) {
      setState(() {
        _messages.add({
          'id': DateTime.now().millisecondsSinceEpoch.toString(),
          'role': 'assistant',
          'content': {'error': 'Lỗi: ${e.toString()}'},
          'timestamp': DateTime.now(),
        });
        _isSending = false;
      });
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text(
          'Chat AI Gợi Ý',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.orange,
        elevation: 1,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          if (_hasToken)
            IconButton(
              icon: const Icon(Icons.history),
              onPressed: () => _showChatSessionsDialog(),
              tooltip: 'Lịch sử chat',
            ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _startNewSession,
            tooltip: 'Chat mới',
          ),
        ],
      ),
      body: Column(
        children: [
          // Chat sessions history (horizontal scroll)
          if (_hasToken && _chatSessions.isNotEmpty) _buildChatSessionsBar(),
          
          // Message list
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.grey.shade50, Colors.white],
                ),
              ),
              child: _isLoading && _messages.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          CircularProgressIndicator(
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.orange),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Đang tải hội thoại...',
                            style: TextStyle(
                              color: Colors.grey.shade600,
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                    )
                  : _messages.isEmpty
                      ? Center(
                          child: Padding(
                            padding: const EdgeInsets.all(32),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.chat_bubble_outline,
                                  size: 80,
                                  color: Colors.orange.shade300,
                                ),
                                const SizedBox(height: 24),
                                Text(
                                  'Hãy bắt đầu cuộc trò chuyện!',
                                  style: TextStyle(
                                    color: Colors.grey.shade800,
                                    fontSize: 18,
                                    fontWeight: FontWeight.w600,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  'Một vài gợi ý:',
                                  style: TextStyle(
                                    color: Colors.grey.shade600,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const SizedBox(height: 16),
                                _buildSuggestionChip('Top 5 khách sạn Đà Nẵng'),
                                const SizedBox(height: 8),
                                _buildSuggestionChip('Voucher khách sạn HCM tháng 12'),
                                const SizedBox(height: 8),
                                _buildSuggestionChip('Địa điểm du lịch Đà Lạt'),
                              ],
                            ),
                          ),
                        )
                      : ListView.builder(
                          controller: _scrollController,
                          padding: const EdgeInsets.all(16),
                          itemCount: _messages.length + (_isSending ? 1 : 0),
                          itemBuilder: (context, index) {
                            if (_isSending && index == _messages.length) {
                              return _buildLoadingBubble();
                            }
                            
                            final message = _messages[index];
                            final isUser = message['role'] == 'user';
                            
                            return _buildMessageBubble(
                              message['content'],
                              isUser,
                              message['timestamp'],
                            );
                          },
                        ),
            ),
          ),
          
          // Input area
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.shade300,
                  blurRadius: 4,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: 'Nhập câu hỏi… (VD: Top 5 khách sạn Đà Nẵng)',
                      hintStyle: TextStyle(color: Colors.grey.shade500, fontSize: 15),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide(color: Colors.grey.shade300),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide(color: Colors.grey.shade300),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: const BorderSide(
                          color: Colors.orange,
                          width: 2,
                        ),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 14,
                      ),
                    ),
                    style: const TextStyle(fontSize: 15),
                    maxLines: null,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _sendMessage(),
                    enabled: !_isSending,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  decoration: BoxDecoration(
                    color: _isSending 
                        ? Colors.grey.shade300
                        : _inputText.trim().isEmpty
                            ? Colors.grey.shade300
                            : Colors.orange, // Màu vàng/cam khi có text
                    shape: BoxShape.circle,
                  ),
                  child: IconButton(
                    icon: _isSending
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.white,
                              ),
                            ),
                          )
                        : const Icon(Icons.send, color: Colors.white),
                    onPressed: _isSending ? null : _sendMessage,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(dynamic content, bool isUser, DateTime timestamp) {
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        child: Column(
          crossAxisAlignment:
              isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isUser ? Colors.orange : Colors.grey.shade100,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(20),
                  topRight: const Radius.circular(20),
                  bottomLeft: Radius.circular(isUser ? 20 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 20),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.shade300,
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: isUser
                  ? Text(
                      content.toString(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                      ),
                    )
                  : _buildAssistantContent(content),
            ),
            const SizedBox(height: 4),
            Text(
              _formatTime(timestamp),
              style: TextStyle(
                color: Colors.grey.shade500,
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAssistantContent(dynamic content) {
    if (content is String) {
      return Text(
        content,
        style: const TextStyle(
          color: Colors.black87,
          fontSize: 15,
        ),
      );
    }

    if (content is Map<String, dynamic>) {
      // Lấy summary trước (giống AdminSuggestionsPage)
      final summary = content['summary']?.toString() ?? '';
      
      // Trích xuất các mảng dữ liệu
      final hotels = content['hotels'] as List? ?? content['data']?['hotels'] as List? ?? [];
      final promos = content['promotions'] as List? ?? content['data']?['promotions'] as List? ?? [];
      final places = content['places'] as List? ?? content['destinations'] as List? ?? content['diem_den'] as List? ?? [];
      final dishes = content['dishes'] as List? ?? content['foods'] as List? ?? content['mon_an'] as List? ?? content['specialties'] as List? ?? [];
      final tips = content['tips'] as List? ?? content['ghi_chu'] as List? ?? content['notes'] as List? ?? [];
      final hasAny = hotels.isNotEmpty || promos.isNotEmpty || places.isNotEmpty || dishes.isNotEmpty || tips.isNotEmpty;

      // ✅ PRIORITY 1: Nếu có summary VÀ không có data phức tạp -> Hiển thị summary (weather, map, chitchat)
      if (summary.isNotEmpty && !hasAny && content['clarify_required'] != true) {
        return Text(
          summary,
          style: const TextStyle(
            color: Colors.black87,
            fontSize: 15,
          ),
        );
      }

      // PRIORITY 2: Clarify / no data gợi ý
      if (content['clarify_required'] == true || 
          (content['suggestions'] is List && (content['suggestions'] as List).isEmpty)) {
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.orange.shade50,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.orange.shade100),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Hiện mình chưa có đủ dữ liệu để trả lời câu hỏi này.',
                style: TextStyle(fontSize: 15, color: Colors.black87),
              ),
              const SizedBox(height: 8),
              const Text(
                'Bạn có thể thử:',
                style: TextStyle(fontSize: 14, color: Colors.grey, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 4),
              _buildBulletPoint('Nhập rõ tỉnh/thành (VD: "Đà Nẵng", "Đà Lạt", "Hà Nội"...)'),
              _buildBulletPoint('Thêm ngữ cảnh: "khách sạn có hồ bơi", "voucher khách sạn tháng 9"...'),
              _buildBulletPoint('Dùng nhanh: "Top 5 khách sạn Đà Nẵng"'),
            ],
          ),
        );
      }

      // PRIORITY 3: Kiểm tra rỗng
      if (!hasAny && (content.containsKey('hotels') || content.containsKey('promotions') || 
          content.containsKey('places') || content.containsKey('dishes') || content.containsKey('foods'))) {
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.orange.shade50,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.orange.shade100),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Xin lỗi, dữ liệu không có trên hệ thống',
                style: TextStyle(
                  color: Colors.orange.shade800,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Bạn có thể thử:',
                style: TextStyle(fontSize: 14, color: Colors.grey, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 4),
              _buildBulletPoint('Thay đổi địa điểm: "Top 5 khách sạn Hà Nội"'),
              _buildBulletPoint('Thử từ khóa khác: "spa", "hồ bơi", "gần biển"'),
              _buildBulletPoint('Kiểm tra chính tả tên tỉnh/thành phố'),
            ],
          ),
        );
      }

      // PRIORITY 4: Có data phức tạp
      if (hasAny) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (summary.isNotEmpty) ...[
              Text(
                summary,
                style: const TextStyle(color: Colors.black87, fontSize: 15),
              ),
              const SizedBox(height: 12),
            ],
            if (hotels.isNotEmpty) ...[
              _buildHotelsList(hotels),
              const SizedBox(height: 12),
            ],
            if (promos.isNotEmpty) ...[
              _buildPromotionsList(promos),
              const SizedBox(height: 12),
            ],
            if (places.isNotEmpty) ...[
              _buildSimpleList('Địa danh gợi ý', places),
              const SizedBox(height: 12),
            ],
            if (dishes.isNotEmpty) ...[
              _buildSimpleList('Món ăn nên thử', dishes),
              const SizedBox(height: 12),
            ],
            if (tips.isNotEmpty) ...[
              _buildSimpleList('Mẹo nhỏ', tips),
            ],
          ],
        );
      }

      // Fallback: Nếu có summary thì in summary
      if (summary.isNotEmpty) {
        return Text(
          summary,
          style: const TextStyle(color: Colors.black87, fontSize: 15),
        );
      }

      // Hiển thị error
      if (content.containsKey('error')) {
        return Text(
          content['error'].toString(),
          style: const TextStyle(
            color: Colors.red,
            fontSize: 15,
          ),
        );
      }

      // Fallback cuối: hiển thị JSON
      return Text(
        content.toString(),
        style: const TextStyle(
          color: Colors.black87,
          fontSize: 15,
        ),
      );
    }

    return Text(
      content.toString(),
      style: const TextStyle(
        color: Colors.black87,
        fontSize: 15,
      ),
    );
  }

  Widget _buildBulletPoint(String text) {
    return Padding(
      padding: const EdgeInsets.only(left: 8, bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('• ', style: TextStyle(fontSize: 14, color: Colors.grey)),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 14, color: Colors.grey),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHotelsList(List hotels) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Khách sạn nổi bật:',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 8),
        ...hotels.map((hotel) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '• ${hotel['name'] ?? 'Khách sạn'}',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                    color: Colors.black87,
                  ),
                ),
                if (hotel['address'] != null)
                  Text(
                    '  ${hotel['address']}',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey.shade700,
                    ),
                  ),
                if (hotel['star_rating'] != null ||
                    hotel['average_rating'] != null)
                  Text(
                    '  ⭐ ${hotel['star_rating'] ?? '-'} | ĐG: ${hotel['average_rating'] ?? '-'}',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey.shade700,
                    ),
                  ),
              ],
            ),
          );
        }).toList(),
      ],
    );
  }

  Widget _buildPromotionsList(List promotions) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Khuyến mãi:',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 8),
        ...promotions.map((promo) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '• ${promo['code'] ?? 'Mã khuyến mãi'}',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                    color: Colors.black87,
                  ),
                ),
                if (promo['description'] != null)
                  Text(
                    '  ${promo['description']}',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey.shade700,
                    ),
                  ),
                if (promo['discount_value'] != null)
                  Text(
                    '  Giảm: ${promo['discount_value']}%',
                    style: const TextStyle(
                      fontSize: 14,
                      color: Colors.orange,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
              ],
            ),
          );
        }).toList(),
      ],
    );
  }

  Widget _buildSimpleList(String title, List items) {
    if (items.isEmpty) return const SizedBox.shrink();
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 8),
        ...items.map((item) {
          // Extract item data
          final name = item is String 
              ? item 
              : (item['name'] ?? item['title'] ?? '');
          final where = item is Map 
              ? (item['where'] ?? item['place'] ?? item['location'] ?? item['address'] ?? '') 
              : '';
          final hint = item is Map 
              ? (item['hint'] ?? item['description'] ?? item['note'] ?? '') 
              : '';
          
          // Nếu chỉ có name (string thuần hoặc object không có hint/where)
          if (where.isEmpty && hint.isEmpty) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Text(
                '• $name',
                style: const TextStyle(fontSize: 14, color: Colors.black87),
              ),
            );
          }
          
          // Có hint hoặc where -> hiển thị tên in đậm và mô tả in nghiêng
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '• $name',
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
                if (hint.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(left: 12, top: 2),
                    child: Text(
                      hint,
                      style: TextStyle(
                        fontSize: 14,
                        fontStyle: FontStyle.italic,
                        color: Colors.grey.shade700,
                      ),
                    ),
                  ),
                if (where.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(left: 12, top: 2),
                    child: Text(
                      where,
                      style: TextStyle(
                        fontSize: 14,
                        fontStyle: FontStyle.italic,
                        color: Colors.grey.shade700,
                      ),
                    ),
                  ),
              ],
            ),
          );
        }).toList(),
      ],
    );
  }

  Widget _buildPlacesAndDishes(Map<String, dynamic> content) {
    final places = content['places'] as List? ?? [];
    final dishes = content['dishes'] as List? ?? [];
    final tips = content['tips'] as List? ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (content['province'] != null) ...[
          Text(
            content['province'].toString(),
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
              color: Colors.orange,
            ),
          ),
          const SizedBox(height: 12),
        ],
        if (places.isNotEmpty) ...[
          _buildSimpleList('Địa điểm:', places),
          const SizedBox(height: 12),
        ],
        if (dishes.isNotEmpty) ...[
          _buildSimpleList('Món ăn:', dishes),
          const SizedBox(height: 12),
        ],
        if (tips.isNotEmpty) ...[
          _buildSimpleList('Ghi chú:', tips),
        ],
      ],
    );
  }

  Widget _buildLoadingBubble() {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
            bottomLeft: Radius.circular(4),
            bottomRight: Radius.circular(20),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.shade300,
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.orange),
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              'Đang suy nghĩ...',
              style: TextStyle(
                color: Colors.black54,
                fontSize: 15,
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime timestamp) {
    final hour = timestamp.hour.toString().padLeft(2, '0');
    final minute = timestamp.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  Widget _buildChatSessionsBar() {
    return Container(
      height: 100,
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        border: Border(
          bottom: BorderSide(color: Colors.grey.shade200),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                Icon(Icons.history, size: 18, color: Colors.grey.shade700),
                const SizedBox(width: 8),
                Text(
                  'Lịch sử chat',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey.shade700,
                  ),
                ),
                const Spacer(),
                TextButton.icon(
                  onPressed: _startNewSession,
                  icon: const Icon(Icons.add, size: 16),
                  label: const Text('Mới', style: TextStyle(fontSize: 13)),
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.orange,
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: _chatSessions.length,
              itemBuilder: (context, index) {
                final session = _chatSessions[index];
                final sessionId = session['_id']?.toString() ?? session['session_id']?.toString() ?? '';
                // Backend trả về title = firstMessage (60 ký tự đầu)
                final title = session['title'] ?? session['name'] ?? session['subject'] ?? 'Chat mới';
                final isActive = sessionId == _activeSessionId;
                
                return GestureDetector(
                  onTap: () async {
                    setState(() => _activeSessionId = sessionId);
                    await _loadChatMessages(sessionId);
                  },
                  child: Container(
                    constraints: const BoxConstraints(maxWidth: 180),
                    margin: const EdgeInsets.only(right: 8, bottom: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: isActive ? Colors.orange.shade50 : Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isActive ? Colors.orange : Colors.grey.shade300,
                        width: isActive ? 2 : 1,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.chat_bubble_outline,
                          size: 14,
                          color: isActive ? Colors.orange : Colors.grey.shade600,
                        ),
                        const SizedBox(width: 6),
                        Flexible(
                          child: Text(
                            title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
                              color: isActive ? Colors.orange.shade800 : Colors.grey.shade700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _showChatSessionsDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        // remove default paddings so children can reach dialog edges
        titlePadding: EdgeInsets.zero,
        contentPadding: EdgeInsets.zero,
        actionsPadding: EdgeInsets.zero,
        clipBehavior: Clip.antiAlias,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(28),
        ),
        title: Container(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          decoration: const BoxDecoration(
            color: Colors.orange,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(28),
              topRight: Radius.circular(28),
            ),
          ),
          child: const Text(
            'Lịch sử chat',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ),
        content: SizedBox(
          width: double.maxFinite,
          // Limit dialog height so long lists become scrollable
          height: MediaQuery.of(context).size.height * 0.62,
          child: _chatSessions.isEmpty
              ? const Padding(
                  padding: EdgeInsets.all(20),
                  child: Text(
                    'Chưa có lịch sử chat nào',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey),
                  ),
                )
              : Scrollbar(
                  thumbVisibility: true,
                  child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: _chatSessions.length,
                  separatorBuilder: (context, index) => Divider(
                    height: 1,
                    thickness: 1,
                    color: Colors.grey.shade200,
                  ),
                  itemBuilder: (context, index) {
                    final session = _chatSessions[index];
                    final sessionId = session['_id']?.toString() ?? session['session_id']?.toString() ?? '';
                    // Backend trả về title = firstMessage (60 ký tự đầu)
                    final title = session['title'] ?? session['name'] ?? session['subject'] ?? 'Chat mới';
                    final turns = session['turns'] ?? session['count'] ?? session['total'] ?? 0;
                    final lastAt = session['updated_at'] ?? session['lastUpdate'] ?? session['last_at'];
                    final timestamp = lastAt != null
                        ? DateTime.tryParse(lastAt.toString())
                        : null;
                    final isActive = sessionId == _activeSessionId;

                    return InkWell(
                      onTap: () {
                        Navigator.pop(context);
                        setState(() {
                          _activeSessionId = sessionId;
                        });
                        _loadChatMessages(sessionId);
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: isActive ? Colors.orange.shade50 : Colors.transparent,
                          border: isActive ? Border(
                            left: BorderSide(color: Colors.orange, width: 3),
                          ) : null,
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: isActive ? Colors.orange : Colors.orange.shade100,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(
                                Icons.chat_bubble_outline,
                                color: isActive ? Colors.white : Colors.orange,
                                size: 24,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    title,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                                      color: Colors.black87,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Row(
                                    children: [
                                      Icon(
                                        Icons.message_outlined,
                                        size: 13,
                                        color: Colors.grey.shade600,
                                      ),
                                      const SizedBox(width: 3),
                                      Flexible(
                                        child: Text(
                                          '$turns tin nhắn',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.grey.shade600,
                                          ),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Icon(
                                        Icons.access_time,
                                        size: 13,
                                        color: Colors.grey.shade600,
                                      ),
                                      const SizedBox(width: 3),
                                      Flexible(
                                        child: Text(
                                          _formatSessionTime(timestamp),
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.grey.shade600,
                                          ),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            if (isActive)
                              Icon(
                                Icons.check_circle,
                                color: Colors.orange,
                                size: 20,
                              ),
                          ],
                        ),
                      ),
                    );
                  },
                    ),
                  ),
                  ),
        actions: [
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.grey.shade700,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  ),
                  child: const Text('Đóng', style: TextStyle(fontSize: 15)),
                ),
                const SizedBox(width: 8),
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    _startNewSession();
                  },
                  icon: const Icon(Icons.add, size: 20),
                  label: const Text('Chat mới', style: TextStyle(fontSize: 15)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.orange,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatSessionTime(DateTime? timestamp) {
    if (timestamp == null) return '';
    
    final now = DateTime.now();
    final difference = now.difference(timestamp);

    if (difference.inMinutes < 1) {
      return 'Vừa xong';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes} phút trước';
    } else if (difference.inDays < 1) {
      return '${difference.inHours} giờ trước';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} ngày trước';
    } else {
      return '${timestamp.day}/${timestamp.month}/${timestamp.year}';
    }
  }

  Widget _buildSuggestionChip(String text) {
    return InkWell(
      onTap: () {
        _messageController.text = text;
        setState(() {
          _inputText = text;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.orange.shade50,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.orange.shade200),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.lightbulb_outline, size: 16, color: Colors.orange.shade700),
            const SizedBox(width: 8),
            Text(
              text,
              style: TextStyle(
                color: Colors.orange.shade800,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
