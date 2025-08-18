// Định nghĩa các kiểu dữ liệu cho blog
export const BLOG_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending', 
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  REJECTED: 'rejected'
};

export const BLOG_STATUS_TEXT = {
  [BLOG_STATUS.DRAFT]: 'Bản nháp',
  [BLOG_STATUS.PENDING]: 'Chờ duyệt',
  [BLOG_STATUS.PUBLISHED]: 'Đã xuất bản', 
  [BLOG_STATUS.ARCHIVED]: 'Lưu trữ',
  [BLOG_STATUS.REJECTED]: 'Từ chối'
};

export const createEmptyBlog = () => ({
  title: '',
  content: '',
  excerpt: '',
  featuredImageUrl: '',
  metaDescription: '',
  tags: '',
  hotelId: '',
  status: BLOG_STATUS.DRAFT
});
