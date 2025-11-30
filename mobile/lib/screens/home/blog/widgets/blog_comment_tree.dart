import 'package:flutter/material.dart';
import '../../../../classes/blog_comment_model.dart';

class BlogCommentTree extends StatefulWidget {
  final BlogComment comment;
  final Function(BlogComment)? onReply;
  final Function(BlogComment)? onDelete;
  final int depth;
  final String? currentUserId;
  final double screenWidth;

  const BlogCommentTree({
    super.key,
    required this.comment,
    this.onReply,
    this.onDelete,
    this.depth = 0,
    this.currentUserId,
    this.screenWidth = 400,
  });

  @override
  State<BlogCommentTree> createState() => _BlogCommentTreeState();
}

class _BlogCommentTreeState extends State<BlogCommentTree> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    final hasReplies = widget.comment.hasReplies;
    final replyCount = widget.comment.replies?.length ?? 0;
    
    // Use smaller margins for deeper nesting to prevent overflow
    // Gradually decrease margin as depth increases
    final double leftMargin = widget.depth > 0 
        ? (widget.depth >= 5 ? 12.0 : widget.depth >= 3 ? 16.0 : 20.0) 
        : 0;
    
    return Container(
      margin: EdgeInsets.only(
        left: leftMargin,
        bottom: 8,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Vertical line for nested comments
          if (widget.depth > 0)
            Container(
              width: 2,
              margin: const EdgeInsets.only(right: 8),
              decoration: BoxDecoration(
                color: Colors.blue.withOpacity(0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          
          // Comment content - wrapped in Flexible to prevent overflow
          Flexible(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Comment item
                _buildCommentItem(context),
                
                // Replies with collapse/expand
                if (hasReplies && _isExpanded) ...[
                  const SizedBox(height: 8),
                  ...widget.comment.replies!.map(
                    (reply) => BlogCommentTree(
                      comment: reply,
                      onReply: widget.onReply,
                      onDelete: widget.onDelete,
                      depth: widget.depth + 1,
                      currentUserId: widget.currentUserId,
                      screenWidth: widget.screenWidth,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCommentItem(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: widget.depth == 0 ? Colors.grey[50] : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.grey[200]!,
          width: 1,
        ),
        boxShadow: widget.depth == 0
            ? [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ]
            : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // User info and time
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Avatar
              CircleAvatar(
                radius: 18,
                backgroundColor: _getAvatarColor(widget.comment.authorName),
                child: Text(
                  widget.comment.authorName.isNotEmpty
                      ? widget.comment.authorName[0].toUpperCase()
                      : 'A',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              
              // Name, time and status
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            widget.comment.authorName,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                            overflow: TextOverflow.ellipsis,
                            maxLines: 1,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Flexible(
                          child: Text(
                            widget.comment.timeAgo,
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                            overflow: TextOverflow.ellipsis,
                            maxLines: 1,
                          ),
                        ),
                        // Status badge inline - không wrap trong Flexible để hiển thị đầy đủ
                        if (!widget.comment.isApproved) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: _getStatusColor(widget.comment.status),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              _getStatusText(widget.comment.status),
                              style: const TextStyle(
                                fontSize: 9,
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 8),
          
          // Comment content
          Text(
            widget.comment.content,
            style: const TextStyle(
              fontSize: 14,
              height: 1.4,
            ),
          ),
          
          const SizedBox(height: 8),
          
          // Actions
          Row(
            children: [
              // Reply button
              if (widget.onReply != null)
                InkWell(
                  onTap: () => widget.onReply!(widget.comment),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.reply,
                        size: 16,
                        color: Colors.blue[600],
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Trả lời',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.blue[600],
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              
              const SizedBox(width: 16),
              
              // Show/Hide replies button
              if (widget.comment.hasReplies)
                InkWell(
                  onTap: () {
                    setState(() {
                      _isExpanded = !_isExpanded;
                    });
                  },
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        _isExpanded ? Icons.expand_less : Icons.expand_more,
                        size: 16,
                        color: Colors.grey[600],
                      ),
                      const SizedBox(width: 4),
                      Text(
                        _isExpanded 
                            ? 'Ẩn' 
                            : '${widget.comment.replies!.length} phản hồi',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              
              const Spacer(),
              
              // Delete button (only for comment owner)
              if (widget.onDelete != null && widget.currentUserId != null && widget.comment.userId == widget.currentUserId)
                InkWell(
                  onTap: () => widget.onDelete!(widget.comment),
                  child: Icon(
                    Icons.delete_outline,
                    size: 16,
                    color: Colors.red[400],
                  ),
                ),
            ],
          ),
          
          // Show edited indicator
          if (widget.comment.isEdited) ...[
            const SizedBox(height: 4),
            Text(
              'Đã chỉnh sửa',
              style: TextStyle(
                fontSize: 10,
                color: Colors.grey[500],
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'approved':
        return Colors.green;
      case 'pending':
        return Colors.orange;
      case 'rejected':
        return Colors.red;
      case 'hidden':
        return Colors.grey;
      default:
        return Colors.orange;
    }
  }

  String _getStatusText(String status) {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'Đã duyệt';
      case 'pending':
        return 'Chờ duyệt';
      case 'rejected':
        return 'Bị từ chối';
      case 'hidden':
        return 'Đã ẩn';
      default:
        return 'Chờ duyệt';
    }
  }

  Color _getAvatarColor(String authorName) {
    // Generate color based on author name for consistency
    final hash = authorName.hashCode;
    final colors = [
      Colors.blue,
      Colors.green,
      Colors.orange,
      Colors.purple,
      Colors.red,
      Colors.teal,
      Colors.pink,
      Colors.indigo,
    ];
    return colors[hash.abs() % colors.length];
  }
}
