import 'package:flutter/material.dart';
import '../../../classes/blog_model.dart';
import '../../../services/blog_service.dart';
import '../../../services/user_service.dart';
import '../../../services/token_service.dart';

class BlogCard extends StatefulWidget {
  final Blog blog;
  final VoidCallback? onTap;

  const BlogCard({Key? key, required this.blog, this.onTap}) : super(key: key);

  @override
  _BlogCardState createState() => _BlogCardState();
}

class _BlogCardState extends State<BlogCard> {
  final BlogService _blogService = BlogService();
  bool isLiking = false;
  bool isLiked = false;
  int likeCount = 0;

  @override
  void initState() {
    super.initState();
    // Sửa từ likesCount thành likeCount
    likeCount = widget.blog.likeCount; // Không cần ?? 0 vì model đã có default
  }

  Future<void> _handleLike() async {
    if (isLiking) return;

    setState(() {
      isLiking = true;
    });

    try {
      // Lấy token và user info
      final token = await TokenService.getToken();
      if (token == null) {
        _showLoginRequired();
        setState(() {
          isLiking = false;
        });
        return;
      }

      final currentUser = await UserService.getUser();
      if (currentUser == null) {
        _showLoginRequired();
        setState(() {
          isLiking = false;
        });
        return;
      }

      // Gửi request like
      final result = await _blogService.likeBlog(widget.blog.blogId, token);

      if (result['success']) {
        setState(() {
          isLiked = !isLiked;
          likeCount = isLiked ? likeCount + 1 : likeCount - 1;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              isLiked ? 'Đã thích bài viết' : 'Đã bỏ thích bài viết',
            ),
            backgroundColor: Colors.orange,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Lỗi khi thích bài viết'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi kết nối: $e'), backgroundColor: Colors.red),
      );
    } finally {
      setState(() {
        isLiking = false;
      });
    }
  }

  void _showLoginRequired() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Bạn cần đăng nhập để thích bài viết'),
        backgroundColor: Colors.orange,
        action: SnackBarAction(
          label: 'Đăng nhập',
          onPressed: () {
            // Navigate to login screen
            Navigator.pushNamed(context, '/login');
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      child: Container(
        margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.1),
              spreadRadius: 1,
              blurRadius: 8,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image section - sử dụng featuredImageUrl thay vì images
            ClipRRect(
              borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
              child: Container(
                height: 200,
                width: double.infinity,
                child: widget.blog.featuredImageUrl != null
                    ? Image.network(
                        widget.blog.featuredImageUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            color: Colors.grey[200],
                            child: Icon(
                              Icons.image,
                              size: 50,
                              color: Colors.grey,
                            ),
                          );
                        },
                      )
                    : Container(
                        color: Colors.grey[200],
                        child: Icon(Icons.image, size: 50, color: Colors.grey),
                      ),
              ),
            ),

            // Content section
            Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title
                  Text(
                    widget.blog.title,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),

                  SizedBox(height: 8),

                  // Content preview - sử dụng displayExcerpt
                  Text(
                    widget.blog.displayExcerpt,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                      height: 1.4,
                    ),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),

                  SizedBox(height: 12),

                  // Bottom section
                  Row(
                    children: [
                      // Author info
                      Icon(Icons.person, size: 16, color: Colors.grey[500]),
                      SizedBox(width: 4),
                      Text(
                        widget.blog.authorName, // Sử dụng getter authorName
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),

                      SizedBox(width: 16),

                      // Views - sử dụng viewCount thay vì views
                      Icon(Icons.visibility, size: 16, color: Colors.grey[500]),
                      SizedBox(width: 4),
                      Text(
                        '${widget.blog.viewCount}',
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),

                      SizedBox(width: 16),

                      // Comments count - sử dụng commentCount thay vì commentsCount
                      Icon(
                        Icons.chat_bubble_outline,
                        size: 16,
                        color: Colors.grey[500],
                      ),
                      SizedBox(width: 4),
                      Text(
                        '${widget.blog.commentCount}',
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),

                      Spacer(),

                      // Like button
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            '$likeCount',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          SizedBox(width: 4),
                          GestureDetector(
                            onTap: _handleLike,
                            child: Container(
                              padding: EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: isLiked
                                    ? Colors.red.withOpacity(0.1)
                                    : Colors.grey[100],
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: isLiking
                                  ? SizedBox(
                                      width: 16,
                                      height: 16,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        valueColor: AlwaysStoppedAnimation(
                                          Colors.orange,
                                        ),
                                      ),
                                    )
                                  : Icon(
                                      isLiked
                                          ? Icons.favorite
                                          : Icons.favorite_outline,
                                      size: 18,
                                      color: isLiked
                                          ? Colors.red
                                          : Colors.grey[600],
                                    ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
