import 'dart:convert';
import 'package:http/http.dart' as http;
import '../classes/blog_model.dart';
import 'api_config.dart';
import 'user_service.dart';
import 'token_service.dart';
import '../classes/blog_custom_model.dart';

class BlogService {
  // Singleton pattern
  static final BlogService _instance = BlogService._internal();
  factory BlogService() => _instance;
  BlogService._internal();

  // Headers mặc định
  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Headers có token
  Map<String, String> _headersWithToken(String token) => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer $token',
  };

  // ============================================
  // BLOG IMAGE METHODS
  // ============================================
  /// Upload ảnh cho blog
  /// POST /api/v1/blogs/:blogId/images
  Future<Map<String, dynamic>> uploadBlogImages(
    String blogId,
    List<String> imagePaths,
    String token,
  ) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/blogs/$blogId/images');
      var request = http.MultipartRequest('POST', url);
      request.headers.addAll(_headersWithToken(token));
      for (var path in imagePaths) {
        request.files.add(await http.MultipartFile.fromPath('images', path));
      }
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      final responseData = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return {
          'success': true,
          'message': responseData['message'] ?? 'Upload ảnh thành công',
          'data': responseData['data'],
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi upload ảnh',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy tất cả ảnh của blog
  /// GET /api/v1/blogs/:blogId/images
  Future<Map<String, dynamic>> getImages(String blogId, String token) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/blogs/$blogId/images');
      final response = await http.get(url, headers: _headersWithToken(token));
      final responseData = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': responseData['message'] ?? 'Lấy danh sách ảnh thành công',
          'data': responseData['data'],
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi lấy danh sách ảnh',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Xóa một ảnh cụ thể
  /// DELETE /api/v1/blog-images/:imageId
  Future<Map<String, dynamic>> deleteImage(String imageId, String token) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/blog-images/$imageId');
      final response = await http.delete(
        url,
        headers: _headersWithToken(token),
      );
      final responseData = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': responseData['message'] ?? 'Xóa ảnh thành công',
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi xóa ảnh',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Xóa bình luận
  /// DELETE /api/v1/comments/:commentId
  Future<Map<String, dynamic>> deleteComment(
    String commentId,
    String token,
  ) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/comments/$commentId');
      final response = await http.delete(
        url,
        headers: _headersWithToken(token),
      );
      final responseData = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': responseData['message'] ?? 'Xóa bình luận thành công',
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi xóa bình luận',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy danh sách blog đã được xuất bản (có phân trang)
  /// GET /api/v1/blogs
  Future<Map<String, dynamic>> getPublishedBlogs({
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.baseUrl}/blogs?page=$page&limit=$limit',
      );

      print('DEBUG BlogService: Calling API: $url');
      final response = await http.get(url, headers: _headers);
      print('DEBUG BlogService: Status code: ${response.statusCode}');
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        List<BlogCustom> blogs = [];
        if (responseData['data'] != null) {
          blogs = (responseData['data'] as List)
              .map((json) => BlogCustom.fromJson(json))
              .toList();
        }

        return {
          'success': true,
          'message': responseData['message'] ?? 'Lấy danh sách blog thành công',
          'data': blogs,
          'pagination': responseData['pagination'],
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi lấy danh sách blog',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy thông tin blog theo slug
  /// GET /api/v1/blogs/:slug
  Future<Map<String, dynamic>> getBlogBySlug(String slug) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/blogs/$slug');
      print('DEBUG: Calling API: $url');

      // Lấy token và gửi kèm headers
      final token = await TokenService.getToken();
      final headers = token != null ? _headersWithToken(token) : _headers;

      final response = await http.get(url, headers: headers);

      print('DEBUG: Status code: ${response.statusCode}');
      print('DEBUG: Response body: ${response.body}');

      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        return {'success': true, 'data': responseData['data']};
      } else {
        final responseData = jsonDecode(response.body);
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi tải blog',
        };
      }
    } catch (e) {
      print('DEBUG: Error in getBlogBySlug: $e');
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Tìm kiếm blog
  /// GET /api/v1/blogs/search
  Future<Map<String, dynamic>> searchBlogs({
    String? title,
    String? content,
    String? authorName,
    String? tags,
    int page = 1,
    int limit = 10,
  }) async {
    try {
      String queryString = 'page=$page&limit=$limit';

      if (title != null && title.isNotEmpty) {
        queryString += '&title=${Uri.encodeComponent(title)}';
      }
      if (content != null && content.isNotEmpty) {
        queryString += '&content=${Uri.encodeComponent(content)}';
      }
      if (authorName != null && authorName.isNotEmpty) {
        queryString += '&authorName=${Uri.encodeComponent(authorName)}';
      }
      if (tags != null && tags.isNotEmpty) {
        queryString += '&tags=${Uri.encodeComponent(tags)}';
      }

      final url = Uri.parse('${ApiConfig.baseUrl}/blogs/search?$queryString');

      final response = await http.get(url, headers: _headers);
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        List<Blog> blogs = [];
        if (responseData['data'] != null) {
          blogs = (responseData['data'] as List)
              .map((json) => Blog.fromJson(json))
              .toList();
        }

        return {
          'success': true,
          'message': responseData['message'] ?? 'Tìm kiếm thành công',
          'data': blogs,
          'pagination': responseData['pagination'],
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi tìm kiếm blog',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy blog phổ biến (theo lượt xem)
  /// GET /api/v1/blogs/popular
  Future<Map<String, dynamic>> getPopularBlogs({int limit = 10}) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/blogs/popular?limit=$limit');

      final response = await http.get(url, headers: _headers);
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        List<Blog> blogs = [];
        if (responseData['data'] != null) {
          blogs = (responseData['data'] as List)
              .map((json) => Blog.fromJson(json))
              .toList();
        }

        return {
          'success': true,
          'message':
              responseData['message'] ??
              'Lấy danh sách blog phổ biến thành công',
          'data': blogs,
        };
      } else {
        return {
          'success': false,
          'message':
              responseData['message'] ?? 'Lỗi khi lấy danh sách blog phổ biến',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy blog theo khách sạn
  /// GET /api/v1/blogs/hotel/:hotelId
  Future<Map<String, dynamic>> getBlogsByHotel(
    String hotelId, {
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.baseUrl}/blogs/hotel/$hotelId?page=$page&limit=$limit',
      );

      final response = await http.get(url, headers: _headers);
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        List<Blog> blogs = [];
        if (responseData['data'] != null) {
          blogs = (responseData['data'] as List)
              .map((json) => Blog.fromJson(json))
              .toList();
        }

        return {
          'success': true,
          'message':
              responseData['message'] ??
              'Lấy danh sách blog theo khách sạn thành công',
          'data': blogs,
          'pagination': responseData['pagination'],
        };
      } else {
        return {
          'success': false,
          'message':
              responseData['message'] ??
              'Lỗi khi lấy danh sách blog theo khách sạn',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  // ============================================
  // AUTHENTICATED METHODS
  // ============================================

  /// Tạo mới blog
  /// POST /api/v1/blogs
  Future<Map<String, dynamic>> createBlog(
    Map<String, dynamic> blogData,
    String token,
  ) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/blogs');

      final response = await http.post(
        url,
        headers: _headersWithToken(token),
        body: jsonEncode(blogData),
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 201) {
        Blog? blog;
        if (responseData['data'] != null) {
          blog = Blog.fromJson(responseData['data']);
        }

        return {
          'success': true,
          'message': responseData['message'] ?? 'Blog đã được tạo thành công',
          'data': blog,
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi tạo blog',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Cập nhật blog
  /// PUT /api/v1/blogs/:blogId
  Future<Map<String, dynamic>> updateBlog(
    String blogId,
    Map<String, dynamic> blogData,
    String token,
  ) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/blogs/$blogId');

      final response = await http.put(
        url,
        headers: _headersWithToken(token),
        body: jsonEncode(blogData),
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        Blog? blog;
        if (responseData['data'] != null) {
          blog = Blog.fromJson(responseData['data']);
        }

        return {
          'success': true,
          'message': responseData['message'] ?? 'Cập nhật blog thành công',
          'data': blog,
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi cập nhật blog',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Xóa blog
  /// DELETE /api/v1/blogs/:blogId
  Future<Map<String, dynamic>> deleteBlog(String blogId, String token) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/blogs/$blogId');

      final response = await http.delete(
        url,
        headers: _headersWithToken(token),
      );
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': responseData['message'] ?? 'Xóa blog thành công',
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi xóa blog',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy blog của tác giả hiện tại
  /// GET /api/v1/blogs/my-blogs
  Future<Map<String, dynamic>> getMyBlogs(String token) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/blogs/my-blogs');

      final response = await http.get(url, headers: _headersWithToken(token));
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        List<Blog> blogs = [];
        if (responseData['data'] != null) {
          blogs = (responseData['data'] as List)
              .map((json) => Blog.fromJson(json))
              .toList();
        }

        return {
          'success': true,
          'message':
              responseData['message'] ??
              'Lấy danh sách blog của bạn thành công',
          'data': blogs,
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi lấy danh sách blog',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy blog theo tác giả
  /// GET /api/v1/blogs/author/:authorId
  Future<Map<String, dynamic>> getBlogsByAuthor(
    String authorId,
    String token,
  ) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/blogs/author/$authorId');

      final response = await http.get(url, headers: _headersWithToken(token));
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        List<Blog> blogs = [];
        if (responseData['data'] != null) {
          blogs = (responseData['data'] as List)
              .map((json) => Blog.fromJson(json))
              .toList();
        }

        return {
          'success': true,
          'message':
              responseData['message'] ??
              'Lấy danh sách blog theo tác giả thành công',
          'data': blogs,
        };
      } else {
        return {
          'success': false,
          'message':
              responseData['message'] ??
              'Lỗi khi lấy danh sách blog theo tác giả',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  // ============================================
  // ADMIN METHODS
  // ============================================

  /// Lấy thống kê blog (Admin)
  /// GET /api/v1/blogs/admin/statistics
  Future<Map<String, dynamic>> getBlogStatistics(String token) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/blogs/admin/statistics');

      final response = await http.get(url, headers: _headersWithToken(token));
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': responseData['message'] ?? 'Lấy thống kê blog thành công',
          'data': responseData['data'],
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi lấy thống kê blog',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy blog theo trạng thái (Admin)
  /// GET /api/v1/blogs/admin/status/:status
  Future<Map<String, dynamic>> getBlogsByStatus(
    String status,
    String token,
  ) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/blogs/admin/status/$status');

      final response = await http.get(url, headers: _headersWithToken(token));
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        List<Blog> blogs = [];
        if (responseData['data'] != null) {
          blogs = (responseData['data'] as List)
              .map((json) => Blog.fromJson(json))
              .toList();
        }

        return {
          'success': true,
          'message':
              responseData['message'] ??
              'Lấy danh sách blog theo trạng thái thành công',
          'data': blogs,
        };
      } else {
        return {
          'success': false,
          'message':
              responseData['message'] ??
              'Lỗi khi lấy danh sách blog theo trạng thái',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Cập nhật trạng thái blog (Admin)
  /// PATCH /api/v1/blogs/admin/:id/status
  Future<Map<String, dynamic>> updateBlogStatus(
    String blogId,
    String status,
    String token,
  ) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/blogs/admin/$blogId/status');

      final response = await http.patch(
        url,
        headers: _headersWithToken(token),
        body: jsonEncode({'status': status}),
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        Blog? blog;
        if (responseData['data'] != null) {
          blog = Blog.fromJson(responseData['data']);
        }

        return {
          'success': true,
          'message':
              responseData['message'] ?? 'Cập nhật trạng thái blog thành công',
          'data': blog,
        };
      } else {
        return {
          'success': false,
          'message':
              responseData['message'] ?? 'Lỗi khi cập nhật trạng thái blog',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy tất cả blog (Admin)
  /// GET /api/v1/blogs/admin/all
  Future<Map<String, dynamic>> getAllBlogsAdmin(
    String token, {
    int page = 1,
    int limit = 10,
    String? status,
  }) async {
    try {
      String queryString = 'page=$page&limit=$limit';
      if (status != null && status.isNotEmpty) {
        queryString += '&status=$status';
      }

      final url = Uri.parse(
        '${ApiConfig.baseUrl}/blogs/admin/all?$queryString',
      );

      final response = await http.get(url, headers: _headersWithToken(token));
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        List<Blog> blogs = [];
        if (responseData['data'] != null) {
          blogs = (responseData['data'] as List)
              .map((json) => Blog.fromJson(json))
              .toList();
        }

        return {
          'success': true,
          'message': responseData['message'] ?? 'Lấy danh sách blog thành công',
          'data': blogs,
          'pagination': responseData['pagination'],
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi lấy danh sách blog',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy blog chờ duyệt (Admin)
  /// GET /api/v1/blogs/admin/pending
  Future<Map<String, dynamic>> getPendingBlogs(String token) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/blogs/admin/pending');

      final response = await http.get(url, headers: _headersWithToken(token));
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        List<Blog> blogs = [];
        if (responseData['data'] != null) {
          blogs = (responseData['data'] as List)
              .map((json) => Blog.fromJson(json))
              .toList();
        }

        return {
          'success': true,
          'message':
              responseData['message'] ??
              'Lấy danh sách blog chờ duyệt thành công',
          'data': blogs,
        };
      } else {
        return {
          'success': false,
          'message':
              responseData['message'] ?? 'Lỗi khi lấy danh sách blog chờ duyệt',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  // ============================================
  // BLOG INTERACTION METHODS
  // ============================================

  /// Thích blog
  /// POST /api/v1/blogs/:blogId/like
  Future<Map<String, dynamic>> likeBlog(String blogId, String token) async {
    try {
      // Lấy user ID để gửi trong body
      final currentUser = await UserService.getUser();
      if (currentUser == null) {
        return {'success': false, 'message': 'Không tìm thấy thông tin user'};
      }

      final url = Uri.parse('${ApiConfig.baseUrl}/blogs/$blogId/like');

      final body = {'blog_id': blogId, 'user_id': currentUser.userId};

      final response = await http.post(
        url,
        headers: _headersWithToken(token),
        body: jsonEncode(body),
      );
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return {
          'success': true,
          'message': responseData['message'] ?? 'Đã thích blog',
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi thích blog',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Bỏ thích blog
  /// DELETE /api/v1/blogs/like
  // Future<Map<String, dynamic>> unlikeBlog(String blogId, String token) async {
  //   try {
  //     final currentUser = await UserService.getUser();
  //     if (currentUser == null) {
  //       return {'success': false, 'message': 'Không tìm thấy thông tin user'};
  //     }

  //     final url = Uri.parse('${ApiConfig.baseUrl}/blogs/like');
  //     final body = jsonEncode({
  //       'blog_id': blogId,
  //       'user_id': currentUser.userId,
  //     });

  //     final response = await http.delete(
  //       url,
  //       headers: _headersWithToken(token),
  //       body: body, // PHẢI GỬI BODY
  //     );
  //     final responseData = jsonDecode(response.body);

  //     if (response.statusCode == 200) {
  //       return {
  //         'success': true,
  //         'message': responseData['message'] ?? 'Đã bỏ thích blog',
  //       };
  //     } else {
  //       return {
  //         'success': false,
  //         'message': responseData['message'] ?? 'Lỗi khi bỏ thích blog',
  //       };
  //     }
  //   } catch (e) {
  //     return {'success': false, 'message': 'Lỗi kết nối: $e'};
  //   }
  // }

  Future<Map<String, dynamic>> unlikeBlog(String blogId, String token) async {
    try {
      final currentUser = await UserService.getUser();
      if (currentUser == null) {
        return {'success': false, 'message': 'Không tìm thấy thông tin user'};
      }

      // Sửa lại URL cho đúng RESTful endpoint
      final url = Uri.parse('${ApiConfig.baseUrl}/blogs/$blogId/unlike');
      final body = jsonEncode({'user_id': currentUser.userId});

      final response = await http.delete(
        url,
        headers: _headersWithToken(token),
        body: body,
      );
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': responseData['message'] ?? 'Đã bỏ thích blog',
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi bỏ thích blog',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Thêm comment vào blog
  /// POST /api/v1/blogs/:blogId/comments
  Future<Map<String, dynamic>> addComment(
    String blogId,
    String content,
    String token, {
    String? parentCommentId,
  }) async {
    final body = {
      'blog_id': blogId,
      'content': content,
      if (parentCommentId != null) 'parent_comment_id': parentCommentId,
    };
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/blogs/$blogId/comments');

      final response = await http.post(
        url,
        headers: _headersWithToken(token),
        body: jsonEncode(body),
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 201) {
        return {
          'success': true,
          'message': responseData['message'] ?? 'Đã thêm bình luận',
          'data': responseData['data'],
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Lỗi khi thêm bình luận',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  /// Lấy danh sách comment của blog
  /// GET /api/v1/blogs/:blogId/comments
  Future<Map<String, dynamic>> getBlogComments(
    String blogId, {
    String? token,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.baseUrl}/blogs/$blogId/comments?page=$page&limit=$limit',
      );

      final headers = token != null ? _headersWithToken(token) : _headers;
      final response = await http.get(url, headers: headers);
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message':
              responseData['message'] ?? 'Lấy danh sách bình luận thành công',
          'data': responseData['data'],
          'pagination': responseData['pagination'],
        };
      } else {
        return {
          'success': false,
          'message':
              responseData['message'] ?? 'Lỗi khi lấy danh sách bình luận',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /// Phê duyệt blog (Admin)
  Future<Map<String, dynamic>> approveBlog(String blogId, String token) {
    return updateBlogStatus(blogId, 'published', token);
  }

  /// Từ chối blog (Admin)
  Future<Map<String, dynamic>> rejectBlog(String blogId, String token) {
    return updateBlogStatus(blogId, 'rejected', token);
  }

  /// Lưu trữ blog (Admin)
  Future<Map<String, dynamic>> archiveBlog(String blogId, String token) {
    return updateBlogStatus(blogId, 'archived', token);
  }

  /// Đưa blog về draft (Admin)
  Future<Map<String, dynamic>> draftBlog(String blogId, String token) {
    return updateBlogStatus(blogId, 'draft', token);
  }

  /// Đưa blog về trạng thái chờ duyệt (Admin)
  Future<Map<String, dynamic>> pendingBlog(String blogId, String token) {
    return updateBlogStatus(blogId, 'pending', token);
  }

  /// Kiểm tra user đã like blog chưa
  /// GET /api/v1/blogs/:blogId/is-liked
  Future<Map<String, dynamic>> isBlogLiked(String blogId, String token) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/blogs/$blogId/is-liked');
      final response = await http.get(url, headers: _headersWithToken(token));
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'isLiked': responseData['data']['liked'] ?? false, // Sửa ở đây
        };
      } else {
        return {
          'success': false,
          'message':
              responseData['message'] ?? 'Không kiểm tra được trạng thái like',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }
}
