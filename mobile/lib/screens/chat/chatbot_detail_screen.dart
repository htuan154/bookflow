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
      final messages = await _aiService.getChatMessages(
        sessionId: sessionId,
        requireAuth: true,
      );
      
      // Convert MongoDB messages to UI format
      final convertedMessages = messages.map((msg) {
        return {
          'id': msg['_id']?.toString() ?? DateTime.now().millisecondsSinceEpoch.toString(),
          'role': 'assistant', // Tin nhắn từ history đều là assistant reply
          'content': msg['reply']?['payload'] ?? msg['reply']?['text'] ?? {},
          'timestamp': DateTime.tryParse(msg['created_at']?.toString() ?? '') ?? DateTime.now(),
          'user_message': msg['message']?['text'], // Lưu câu hỏi của user
        };
      }).toList();

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

    setState(() {
      _isSending = true;
      _messages.add({
        'id': DateTime.now().millisecondsSinceEpoch.toString(),
        'role': 'user',
        'content': message,
        'timestamp': DateTime.now(),
      });
    });

    _messageController.clear();
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
      appBar: AppBar(
        title: const Text(
          'Chat AI Gợi Ý',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        elevation: 1,
        iconTheme: const IconThemeData(color: Colors.black),
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
            child: _messages.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.chat_bubble_outline,
                          size: 64,
                          color: Colors.grey.shade400,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Hãy bắt đầu cuộc trò chuyện!',
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'VD: Top 5 khách sạn Đà Nẵng',
                          style: TextStyle(
                            color: Colors.grey.shade500,
                            fontSize: 14,
                          ),
                        ),
                      ],
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
                      hintText: 'Nhập câu hỏi...',
                      hintStyle: TextStyle(color: Colors.grey.shade500),
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
                        vertical: 12,
                      ),
                    ),
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

      // Hiển thị hotels
      if (content.containsKey('hotels') &&
          content['hotels'] is List &&
          (content['hotels'] as List).isNotEmpty) {
        return _buildHotelsList(content['hotels']);
      }

      // Hiển thị promotions
      if (content.containsKey('promotions') &&
          content['promotions'] is List &&
          (content['promotions'] as List).isNotEmpty) {
        return _buildPromotionsList(content['promotions']);
      }

      // Hiển thị places/dishes
      if (content.containsKey('places') || content.containsKey('dishes')) {
        return _buildPlacesAndDishes(content);
      }

      // Hiển thị summary nếu có
      if (content.containsKey('summary')) {
        return Text(
          content['summary'].toString(),
          style: const TextStyle(
            color: Colors.black87,
            fontSize: 15,
          ),
        );
      }

      // Fallback: hiển thị JSON
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
          const Text(
            'Địa điểm:',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 15,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 4),
          ...places.map((place) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Text(
                '• ${place['name'] ?? place.toString()}',
                style: const TextStyle(fontSize: 14, color: Colors.black87),
              ),
            );
          }).toList(),
          const SizedBox(height: 12),
        ],
        if (dishes.isNotEmpty) ...[
          const Text(
            'Món ăn:',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 15,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 4),
          ...dishes.map((dish) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Text(
                '• ${dish['name'] ?? dish.toString()}',
                style: const TextStyle(fontSize: 14, color: Colors.black87),
              ),
            );
          }).toList(),
          const SizedBox(height: 12),
        ],
        if (tips.isNotEmpty) ...[
          const Text(
            'Ghi chú:',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 15,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 4),
          ...tips.map((tip) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Text(
                '• ${tip.toString()}',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade700,
                  fontStyle: FontStyle.italic,
                ),
              ),
            );
          }).toList(),
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
                final sessionId = session['_id']?.toString() ?? '';
                final lastQuestion = session['last_question'] ?? 'Chat';
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
                            lastQuestion,
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
        title: const Text('Lịch sử chat', style: TextStyle(fontWeight: FontWeight.bold)),
        content: SizedBox(
          width: double.maxFinite,
          child: _chatSessions.isEmpty
              ? const Padding(
                  padding: EdgeInsets.all(20),
                  child: Text(
                    'Chưa có lịch sử chat nào',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey),
                  ),
                )
              : ListView.builder(
                  shrinkWrap: true,
                  itemCount: _chatSessions.length,
                  itemBuilder: (context, index) {
                    final session = _chatSessions[index];
                    final sessionId = session['_id']?.toString() ?? '';
                    final lastQuestion = session['last_question'] ?? 'Chat session';
                    final turns = session['turns'] ?? 0;
                    final lastAt = session['last_at'] != null
                        ? DateTime.tryParse(session['last_at'].toString())
                        : null;

                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: Colors.orange.shade100,
                        child: Icon(Icons.chat, color: Colors.orange, size: 20),
                      ),
                      title: Text(
                        lastQuestion,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 14),
                      ),
                      subtitle: Text(
                        '$turns tin nhắn • ${_formatSessionTime(lastAt)}',
                        style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                      ),
                      selected: sessionId == _activeSessionId,
                      selectedTileColor: Colors.orange.shade50,
                      onTap: () {
                        Navigator.pop(context);
                        setState(() {
                          _activeSessionId = sessionId;
                        });
                        _loadChatMessages(sessionId);
                      },
                    );
                  },
                ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Đóng'),
          ),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(context);
              _startNewSession();
            },
            icon: const Icon(Icons.add, size: 18),
            label: const Text('Chat mới'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.orange,
              foregroundColor: Colors.white,
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
}
