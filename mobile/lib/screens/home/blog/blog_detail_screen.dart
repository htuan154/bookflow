import 'package:flutter/material.dart';
import '../../../classes/blog_model.dart';
import '../../../classes/blog_comment_model.dart';
import '../../../classes/blog_image_model.dart';
import '../../../services/blog_service.dart';
import '../../../services/token_service.dart';
import 'widgets/blog_comment_tree.dart';
import 'widgets/blog_detail_loader.dart';
import '../../../services/user_service.dart';

class BlogDetailScreen extends StatefulWidget {
  final String blogSlug; // Đổi từ blogId thành blogSlug

  const BlogDetailScreen({super.key, required this.blogSlug});

  @override
  State<BlogDetailScreen> createState() => _BlogDetailScreenState();
}

class _BlogDetailScreenState extends State<BlogDetailScreen> {
  final BlogService _blogService = BlogService();
  final TextEditingController _commentController = TextEditingController();

  Blog? blog;
  List<BlogImage> blogImages = [];
  List<BlogComment> comments = [];
  bool isLoading = true;
  bool isLoadingImages = true;
  bool isLoadingComments = true;
  bool isSubmittingComment = false;
  String? error;

  // Thêm các biến cho like
  bool isLiking = false;
  bool isLiked = false;
  int likeCount = 0;

  @override
  void initState() {
    super.initState();
    _loadBlogDetail();
    _checkIsLiked(); // Thêm dòng này
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  // Thêm hàm kiểm tra đã like chưa
  Future<void> _checkIsLiked() async {
    if (blog == null) return;
    final token = await TokenService.getToken();
    if (token == null) return;
    final result = await _blogService.isBlogLiked(blog!.blogId, token);
    if (result['success']) {
      setState(() {
        isLiked = result['isLiked'] ?? false;
      });
    }
  }

  Future<void> _loadBlogDetail() async {
    try {
      print('DEBUG: Loading blog with slug: ${widget.blogSlug}');

      final result = await _blogService.getBlogBySlug(widget.blogSlug);

      print('DEBUG: API result: $result');

      if (result['success']) {
        setState(() {
          // Sửa ở đây: convert Map thành Blog object
          blog = Blog.fromJson(result['data']);
          likeCount = blog!.likeCount;
          isLoading = false;
        });
        if (blog != null) {
          _loadBlogImages();
          _loadBlogComments();
          _checkIsLiked();
        }
      } else {
        setState(() {
          error = result['message'];
          isLoading = false;
        });
      }
    } catch (e) {
      print('DEBUG: Error in _loadBlogDetail: $e');
      setState(() {
        error = 'Lỗi khi tải blog: $e';
        isLoading = false;
      });
    }
  }

  Future<void> _loadBlogImages() async {
    if (blog == null) return;

    try {
      print('DEBUG: _loadBlogImages for blogId: ${blog!.blogId}');

      // Lấy token từ TokenService
      final token = await TokenService.getToken();
      if (token == null) {
        print('DEBUG: No token found for loading images');
        setState(() {
          isLoadingImages = false;
        });
        return;
      }

      final result = await _blogService.getImages(blog!.blogId, token);
      print('DEBUG: getImages result: $result');

      if (result['success']) {
        final List<dynamic> imageData = result['data'] ?? [];
        print('DEBUG: imageData length: ${imageData.length}');

        setState(() {
          blogImages = imageData
              .map((json) => BlogImage.fromJson(json))
              .toList();
          print('DEBUG: blogImages parsed length: ${blogImages.length}');
          isLoadingImages = false;
        });
      } else {
        print('DEBUG: getImages error: ${result['message']}');
        setState(() {
          isLoadingImages = false;
        });
      }
    } catch (e) {
      print('DEBUG: getImages exception: $e');
      setState(() {
        isLoadingImages = false;
      });
    }
  }

  Future<void> _loadBlogComments() async {
    if (blog == null) return;

    try {
      print('DEBUG: _loadBlogComments for blogId: ${blog!.blogId}');

      // Lấy token từ TokenService
      final token = await TokenService.getToken();
      if (token == null) {
        print('DEBUG: No token found for loading comments');
        setState(() {
          isLoadingComments = false;
        });
        return;
      }

      final result = await _blogService.getApprovedBlogComments(
        blog!.blogId,
        token: token,
      );
      print('DEBUG: getApprovedBlogComments result: $result');
      if (result['success']) {
        final List<dynamic> commentData = result['data'] ?? [];
        print('DEBUG: commentData length: ${commentData.length}');
        for (var c in commentData) {
          print('DEBUG: comment json: $c');
        }
        setState(() {
          comments = commentData
              .map((json) => BlogComment.fromJson(json))
              .toList();
          print('DEBUG: comments parsed length: ${comments.length}');
          isLoadingComments = false;
        });
      } else {
        print('DEBUG: getApprovedBlogComments error: ${result['message']}');
        setState(() {
          isLoadingComments = false;
        });
      }
    } catch (e) {
      print('DEBUG: getApprovedBlogComments exception: $e');
      setState(() {
        isLoadingComments = false;
      });
    }
  }

  Future<void> _submitComment() async {
    if (_commentController.text.trim().isEmpty || blog == null) return;

    setState(() {
      isSubmittingComment = true;
    });

    try {
      final token = await TokenService.getToken();
      if (token == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Bạn cần đăng nhập để bình luận!')),
        );
        setState(() {
          isSubmittingComment = false;
        });
        return;
      }

      final result = await _blogService.addComment(
        blog!.blogId,
        _commentController.text.trim(),
        token,
      );

      if (result['success']) {
        _commentController.clear();
        _loadBlogComments();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Bình luận của bạn đã được gửi, hãy chờ duyệt'),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Gửi bình luận thất bại'),
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Lỗi khi gửi bình luận: $e')));
    } finally {
      setState(() {
        isSubmittingComment = false;
      });
    }
  }

  List<BlogComment> _buildCommentTree(List<BlogComment> comments) {
    // Tạo map để dễ dàng tìm kiếm comments
    Map<String, BlogComment> commentMap = {};
    Map<String, List<BlogComment>> childrenMap = {};
    List<BlogComment> rootComments = [];

    // Khởi tạo maps
    for (var comment in comments) {
      commentMap[comment.commentId] = comment;
      childrenMap[comment.commentId] = [];
    }

    // Phân loại root comments và child comments
    for (var comment in comments) {
      if (comment.parentCommentId == null) {
        // Root comment
        rootComments.add(comment);
      } else {
        // Child comment
        if (childrenMap.containsKey(comment.parentCommentId!)) {
          childrenMap[comment.parentCommentId!]!.add(comment);
        }
      }
    }

    // Hàm đệ quy để build cây comment đầy đủ
    BlogComment buildCommentWithChildren(BlogComment comment) {
      final children = childrenMap[comment.commentId] ?? [];
      if (children.isEmpty) {
        return comment;
      }
      
      // Đệ quy build children của children
      final nestedChildren = children.map((child) => buildCommentWithChildren(child)).toList();
      
      // Sắp xếp children theo thời gian (cũ nhất trước cho replies)
      nestedChildren.sort((a, b) => a.createdAt.compareTo(b.createdAt));
      
      return comment.copyWith(replies: nestedChildren);
    }

    // Build cây đệ quy cho tất cả root comments
    final builtRootComments = rootComments.map((comment) => buildCommentWithChildren(comment)).toList();

    // Sắp xếp root comments theo thời gian tạo (mới nhất trước)
    builtRootComments.sort((a, b) => b.createdAt.compareTo(a.createdAt));

    return builtRootComments;
  }

  // Thêm hàm xử lý like
  Future<void> _handleLike() async {
    if (isLiking || blog == null) return;

    setState(() {
      isLiking = true;
    });

    try {
      final token = await TokenService.getToken();
      if (token == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Bạn cần đăng nhập để thích bài viết')),
        );
        setState(() {
          isLiking = false;
        });
        return;
      }

      Map<String, dynamic> result;
      if (isLiked) {
        // Nếu đã like thì gọi unlike (gửi đúng blogId)
        result = await _blogService.unlikeBlog(blog!.blogId, token);
      } else {
        // Nếu chưa like thì gọi like
        result = await _blogService.likeBlog(blog!.blogId, token);
      }

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
            content: Text(result['message'] ?? 'Lỗi khi thao tác'),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text('Chi tiết bài viết', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.orange,
        foregroundColor: Colors.white,
        elevation: 1,
      ),
      body: isLoading
          ? const BlogDetailLoader()
          : error != null
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(error!),
                  ElevatedButton(
                    onPressed: () {
                      setState(() {
                        isLoading = true;
                        error = null;
                      });
                      _loadBlogDetail();
                    },
                    child: const Text('Thử lại'),
                  ),
                ],
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Blog Title
                  _buildTitle(),
                  const SizedBox(height: 24),

                  // Blog Content
                  _buildContent(),
                  const SizedBox(height: 24),

                  // Blog Images
                  _buildImages(),
                  const SizedBox(height: 24),

                  // Comments Section
                  _buildCommentsSection(),
                ],
              ),
            ),
    );
  }

  Widget _buildTitle() {
    return Text(
      blog?.title ?? '',
      style: const TextStyle(
        fontSize: 24,
        fontWeight: FontWeight.bold,
        color: Colors.black87,
      ),
    );
  }

  Widget _buildContent() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Text(
        blog?.content ?? '',
        style: const TextStyle(
          fontSize: 16,
          height: 1.6,
          color: Colors.black87,
        ),
      ),
    );
  }

  Widget _buildImages() {
    if (isLoadingImages) {
      return const Center(child: CircularProgressIndicator());
    }

    if (blogImages.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Hình ảnh',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: blogImages.length,
          itemBuilder: (context, index) {
            final image = blogImages[index];
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child:
                        image.imageUrl.isNotEmpty &&
                            !image.imageUrl.contains('example.com') &&
                            !image.imageUrl.contains('google.com/url')
                        ? Image.network(
                            image.imageUrl,
                            width: double.infinity,
                            height: 200,
                            fit: BoxFit.cover,
                            loadingBuilder: (context, child, loadingProgress) {
                              if (loadingProgress == null) return child;
                              return Container(
                                width: double.infinity,
                                height: 200,
                                color: Colors.grey[200],
                                child: Center(
                                  child: CircularProgressIndicator(),
                                ),
                              );
                            },
                            errorBuilder: (context, error, stackTrace) {
                              return Image.asset(
                                'assets/welcome/welcome-image-1.png',
                                width: double.infinity,
                                height: 200,
                                fit: BoxFit.cover,
                              );
                            },
                          )
                        : Image.asset(
                            'assets/welcome/welcome-image-1.png',
                            width: double.infinity,
                            height: 200,
                            fit: BoxFit.cover,
                          ),
                  ),
                  if (image.hasCaption) ...[
                    const SizedBox(height: 8),
                    Text(
                      image.caption!,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Colors.grey,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                ],
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildCommentsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text(
              'Bình luận',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(width: 8),
            Text(
              '(${comments.length})',
              style: const TextStyle(fontSize: 16, color: Colors.grey),
            ),

            Spacer(), // Đẩy nút like sang bên phải
            // NÚT LIKE Ở ĐÂY
            GestureDetector(
              onTap: _handleLike,
              child: Container(
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isLiked ? Colors.red : Colors.grey[300]!,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '$likeCount',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: isLiked ? Colors.red : Colors.grey[700],
                      ),
                    ),
                    SizedBox(width: 6),
                    if (isLiking)
                      SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation(Colors.red),
                        ),
                      )
                    else
                      Icon(
                        isLiked ? Icons.thumb_up : Icons.thumb_up_outlined,
                        size: 18,
                        color: isLiked ? Colors.blue : Colors.grey[600],
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Comment Input
        _buildCommentInput(),
        const SizedBox(height: 20),

        // Comments Tree
        _buildCommentsList(),
      ],
    );
  }

  Widget _buildCommentInput() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          TextField(
            controller: _commentController,
            maxLines: 3,
            decoration: const InputDecoration(
              hintText: 'Viết bình luận...',
              border: InputBorder.none,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange,
                ),
                onPressed: isSubmittingComment ? null : _submitComment,
                child: isSubmittingComment
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Gửi', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCommentsList() {
    if (isLoadingComments) {
      return const Center(child: CircularProgressIndicator());
    }

    if (comments.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Text(
            'Chưa có bình luận nào',
            style: TextStyle(color: Colors.grey),
          ),
        ),
      );
    }

    final rootComments = _buildCommentTree(comments);
    final screenWidth = MediaQuery.of(context).size.width;

    return FutureBuilder(
      future: UserService.getUser(),
      builder: (context, snapshot) {
        final currentUser = snapshot.data;
        final currentUserId = currentUser?.userId;
        return ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: rootComments.length,
          itemBuilder: (context, index) {
            return BlogCommentTree(
              comment: rootComments[index],
              onReply: (parentComment) {
                _showReplyDialog(parentComment);
              },
              onDelete: (comment) {
                _showDeleteDialog(comment);
              },
              currentUserId: currentUserId,
              screenWidth: screenWidth,
            );
          },
        );
      },
    );
  }

  void _showReplyDialog(BlogComment parentComment) {
    final replyController = TextEditingController();
    bool isReplying = false;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          title: Text('Trả lời ${parentComment.authorName}'),
          content: TextField(
            controller: replyController,
            maxLines: 3,
            decoration: const InputDecoration(
              hintText: 'Viết phản hồi...',
              border: OutlineInputBorder(),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Hủy'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                textStyle: const TextStyle(fontWeight: FontWeight.bold),
                elevation: 0,
              ),
              onPressed: isReplying
                  ? null
                  : () async {
                      if (replyController.text.trim().isEmpty) return;
                      setState(() => isReplying = true);

                      final token = await TokenService.getToken();
                      if (token == null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Bạn cần đăng nhập để phản hồi!'),
                          ),
                        );
                        setState(() => isReplying = false);
                        return;
                      }

                      // Gửi phản hồi (thêm parent_comment_id)
                      final result = await _blogService.addComment(
                        blog!.blogId,
                        replyController.text.trim(),
                        token,
                        parentCommentId: parentComment.commentId,
                      );

                      if (result['success']) {
                        Navigator.pop(context);
                        _loadBlogComments();
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              'Bình luận của bạn đã được gửi, hãy chờ duyệt',
                            ),
                          ),
                        );
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              result['message'] ?? 'Gửi phản hồi thất bại',
                            ),
                          ),
                        );
                        setState(() => isReplying = false);
                      }
                    },
              child: isReplying
                  ? SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Gửi'),
            ),
          ],
        ),
      ),
    );
  }

  void _showDeleteDialog(BlogComment comment) async {
    // Dùng UserService.getUser() giống như profile screen
    final currentUser = await UserService.getUser();
    final currentUserId = currentUser?.userId;

    // Debug: In ra 2 id
    print('DEBUG: currentUserId from UserService = $currentUserId');
    print('DEBUG: comment.userId = ${comment.userId}');

    if (currentUserId == null || currentUserId != comment.userId) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Bạn không được quyền xóa bình luận này')),
      );
      return;
    }

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
        ),
        title: const Text('Xóa bình luận'),
        content: const Text('Bạn có chắc chắn muốn xóa bình luận này?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              final token = await TokenService.getToken();
              if (token == null) return;
              final result = await _blogService.deleteComment(
                comment.commentId,
                token,
              );
              if (result['success']) {
                _loadBlogComments();
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Đã xóa bình luận thành công')),
                );
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      result['message'] ?? 'Xóa bình luận thất bại',
                    ),
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Xóa', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
