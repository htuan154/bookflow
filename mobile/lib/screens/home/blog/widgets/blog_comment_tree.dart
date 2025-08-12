import 'package:flutter/material.dart';
import '../../../../classes/blog_comment_model.dart';

class BlogCommentTree extends StatelessWidget {
  final BlogComment comment;
  final Function(BlogComment)? onReply;
  final Function(BlogComment)? onDelete;
  final int depth;

  const BlogCommentTree({
    Key? key,
    required this.comment,
    this.onReply,
    this.onDelete,
    this.depth = 0,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.only(
        left: depth * 20.0,
        bottom: 12,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Comment item
          _buildCommentItem(context),
          
          // Replies
          if (comment.hasReplies) ...[
            const SizedBox(height: 8),
            ...comment.replies!.map(
              (reply) => BlogCommentTree(
                comment: reply,
                onReply: onReply,
                onDelete: onDelete,
                depth: depth + 1,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildCommentItem(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: depth == 0 ? Colors.white : Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: depth == 0 ? Colors.grey[200]! : Colors.grey[100]!,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // User info and time
          Row(
            children: [
              // Avatar
              CircleAvatar(
                radius: 16,
                backgroundColor: Colors.blue[100],
                backgroundImage: comment.authorAvatar != null
                    ? NetworkImage(comment.authorAvatar!)
                    : null,
                child: comment.authorAvatar == null
                    ? Text(
                        comment.authorName.isNotEmpty
                            ? comment.authorName[0].toUpperCase()
                            : 'A',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.blue[700],
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: 8),
              
              // Name and time
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      comment.authorName,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      comment.timeAgo,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              
              // Status badge
              if (!comment.isApproved)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: _getStatusColor(),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    _getStatusText(),
                    style: const TextStyle(
                      fontSize: 10,
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
            ],
          ),
          
          const SizedBox(height: 8),
          
          // Comment content
          Text(
            comment.content,
            style: const TextStyle(
              fontSize: 14,
              height: 1.4,
            ),
          ),
          
          const SizedBox(height: 8),
          
          // Actions
          Row(
            children: [
              // Like button
              InkWell(
                onTap: () {
                  // Handle like
                },
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.thumb_up_outlined,
                      size: 16,
                      color: Colors.grey[600],
                    ),
                    if (comment.likeCount > 0) ...[
                      const SizedBox(width: 4),
                      Text(
                        comment.likeCount.toString(),
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              
              const SizedBox(width: 16),
              
              // Reply button
              if (onReply != null && depth < 3) // Giới hạn độ sâu reply
                InkWell(
                  onTap: () => onReply!(comment),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.reply,
                        size: 16,
                        color: Colors.grey[600],
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Trả lời',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
              
              const Spacer(),
              
              // Delete button (for comment owner or admin)
              if (onDelete != null)
                InkWell(
                  onTap: () => onDelete!(comment),
                  child: Icon(
                    Icons.delete_outline,
                    size: 16,
                    color: Colors.red[400],
                  ),
                ),
            ],
          ),
          
          // Show edited indicator
          if (comment.isEdited) ...[
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

  Color _getStatusColor() {
    switch (comment.status.toLowerCase()) {
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

  String _getStatusText() {
    switch (comment.status.toLowerCase()) {
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
}
