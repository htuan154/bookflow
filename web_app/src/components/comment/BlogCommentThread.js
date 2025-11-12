import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Avatar, Stack, Chip,
  IconButton, Button, Collapse, Alert, Divider, Tooltip,
  Menu, MenuItem, ListItemIcon, ListItemText
} from '@mui/material';
import {
  Reply, Check, Close, ThumbUp, ExpandMore, ExpandLess,
  Person, AdminPanelSettings, Business, MoreVert,
  Flag, Delete, Edit, Visibility, VisibilityOff
} from '@mui/icons-material';
import { useComment } from '../../context/BlogCommentContext';
import { USER_ROLES } from '../../config/roles';

// Helper functions
const getUserRoleColor = (role) => {
  switch (role) {
    case 'admin': return '#FF6B35';
    case 'hotel_owner': return '#2196F3';
    default: return '#9E9E9E';
  }
};

const getUserIcon = (role) => {
  switch (role) {
    case 'admin': return <AdminPanelSettings sx={{ fontSize: 20 }} />;
    case 'hotel_owner': return <Business sx={{ fontSize: 20 }} />;
    default: return <Person sx={{ fontSize: 20 }} />;
  }
};

const BlogCommentThread = ({ 
  comment, 
  level = 0, 
  maxLevel = 3,
  onReply, 
  onUpdateStatus, 
  onDelete,
  onReport,
  currentUserId 
}) => {
  const [expanded, setExpanded] = useState(level < 2); // Auto expand first 2 levels
  const [anchorEl, setAnchorEl] = useState(null);
  const [showReplies, setShowReplies] = useState(true);
  const [likeCount, setLikeCount] = useState(comment.like_count || 0);
  const [isLiked, setIsLiked] = useState(false);
  const { likeComment, getCommentLikeStatus, updateCommentStatus, deleteComment, reportComment } = useComment();

  useEffect(() => {
    checkUserLike();
  }, [comment.comment_id, currentUserId]);

  const checkUserLike = async () => {
    if (!currentUserId || !comment.comment_id) return;
    try {
      const data = await getCommentLikeStatus(comment.comment_id);
      setIsLiked(data.isLiked || false);
    } catch (err) {
      console.error('Check like status error:', err);
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInMinutes = Math.floor((now - past) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} tuần trước`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} tháng trước`;
    
    return `${Math.floor(diffInDays / 365)} năm trước`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      case 'hidden': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return 'Đã duyệt';
      case 'pending': return 'Chờ duyệt';
      case 'rejected': return 'Bị từ chối';
      case 'hidden': return 'Đã ẩn';
      default: return status;
    }
  };

  const handleLikeComment = async () => {
    try {
      await likeComment(comment.comment_id, !isLiked);
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (err) {
      console.error('Like comment error:', err);
    }
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleReplyClick = () => {
    if (onReply) {
      onReply(comment.comment_id, comment.fullName || comment.user?.full_name || comment.username || 'Người dùng');
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (updateCommentStatus) {
      await updateCommentStatus(comment.comment_id, newStatus);
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (deleteComment) {
      await deleteComment(comment.comment_id);
    }
    handleMenuClose();
  };

  const handleReport = async () => {
    if (reportComment) {
      await reportComment(comment.comment_id, { reason: 'report', description: '' });
    }
    handleMenuClose();
  };

  const toggleReplies = () => {
    setShowReplies(!showReplies);
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const hasReplies = comment.replies && comment.replies.length > 0;
  const isNested = level > 0;
  const canNestMore = level < maxLevel;

  // Don't render if comment is rejected and user is not admin
  if (comment.status === 'rejected' && comment.user?.role !== 'admin') {
    return null;
  }

  const normalizeRole = (role) => {
    if (typeof role === 'string') {
      if (role === 'admin') return USER_ROLES.ADMIN;
      if (role === 'hotel_owner') return USER_ROLES.HOTEL_OWNER;
      return USER_ROLES.USER;
    }
    return role;
  };

  return (
    <Box sx={{ mb: 2 }}>
      {/* Main Comment */}
      <Card 
        variant="outlined" 
        sx={{ 
          bgcolor: isNested ? 'grey.50' : 'white',
          borderLeft: isNested ? `4px solid ${getUserRoleColor(comment.user?.role)}` : 'none',
          ml: level * 3,
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: 2,
            transform: 'translateY(-1px)'
          }
        }}
      >
        <CardContent sx={{ p: 2 }}>
          {/* Comment Header */}
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Avatar 
              sx={{ 
                width: 40, 
                height: 40,
                bgcolor: getUserRoleColor(comment.user?.role)
              }}
            >
              {getUserIcon(comment.user?.role)}
            </Avatar>

            <Box sx={{ flexGrow: 1 }}>
              {/* User Info */}
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight="600">
                  {comment.fullName || comment.user?.full_name || comment.username || 'Người dùng'}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  {formatTimeAgo(comment.created_at)}
                </Typography>

                <Chip 
                  label={getStatusText(comment.status)} 
                  size="small" 
                  color={getStatusColor(comment.status)}
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />

                {comment.updated_at && comment.updated_at !== comment.created_at && (
                  <Tooltip title={`Đã chỉnh sửa: ${formatTimeAgo(comment.updated_at)}`}>
                    <Chip 
                      label="Đã sửa"
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.6rem', height: 18 }}
                    />
                  </Tooltip>
                )}
              </Stack>

              {/* Comment Content */}
              <Collapse in={expanded}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 2, 
                    lineHeight: 1.6,
                    opacity: comment.status === 'hidden' ? 0.6 : 1
                  }}
                >
                  {comment.status === 'rejected' ? (
                    <em>Bình luận này đã bị từ chối</em>
                  ) : comment.status === 'hidden' ? (
                    <em>Bình luận này đã bị ẩn</em>
                  ) : (
                    comment.content
                  )}
                </Typography>
              </Collapse>

              {/* Action Buttons */}
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={1} alignItems="center">
                  {/* Like Button */}
                  <Button
                    size="small"
                    startIcon={
                      <ThumbUp 
                        sx={{ 
                          color: isLiked ? '#1976d2' : 'text.secondary',
                          fontSize: 16 
                        }} 
                      />
                    }
                    onClick={handleLikeComment}
                    sx={{ 
                      textTransform: 'none',
                      color: isLiked ? '#1976d2' : 'text.secondary',
                      '&:hover': {
                        bgcolor: 'rgba(25, 118, 210, 0.08)'
                      }
                    }}
                  >
                    {likeCount}
                  </Button>

                  {/* Reply Button */}
                  {canNestMore && (
                    <Button
                      size="small"
                      startIcon={<Reply />}
                      onClick={handleReplyClick}
                      sx={{ textTransform: 'none' }}
                    >
                      Trả lời
                    </Button>
                  )}

                  {/* Show/Hide Replies Button */}
                  {hasReplies && (
                    <Button
                      size="small"
                      endIcon={showReplies ? <ExpandLess /> : <ExpandMore />}
                      onClick={toggleReplies}
                      sx={{ textTransform: 'none' }}
                    >
                      {comment.replies.length} phản hồi
                    </Button>
                  )}

                  {/* Expand/Collapse Button */}
                  {!expanded && (
                    <Button
                      size="small"
                      endIcon={<ExpandMore />}
                      onClick={toggleExpanded}
                      sx={{ textTransform: 'none' }}
                    >
                      Xem thêm
                    </Button>
                  )}
                </Stack>

                {/* Admin Actions */}
                <Stack direction="row" alignItems="center" spacing={1}>
                  {/* Đã tắt nút duyệt/trừ chối cho bình luận pending */}
                  {/* More Actions Menu */}
                  <IconButton
                    size="small"
                    onClick={handleMenuClick}
                  >
                    <MoreVert fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {comment.status === 'approved' && (
          <MenuItem onClick={() => handleStatusUpdate('hidden')}>
            <ListItemIcon>
              <VisibilityOff fontSize="small" />
            </ListItemIcon>
            <ListItemText>Ẩn bình luận</ListItemText>
          </MenuItem>
        )}
        
        {comment.status === 'hidden' && (
          <MenuItem onClick={() => handleStatusUpdate('approved')}>
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            <ListItemText>Hiện bình luận</ListItemText>
          </MenuItem>
        )}

        <MenuItem onClick={handleReport}>
          <ListItemIcon>
            <Flag fontSize="small" />
          </ListItemIcon>
          <ListItemText>Báo cáo</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Xóa bình luận</ListItemText>
        </MenuItem>
      </Menu>

      {/* Replies */}
      {hasReplies && showReplies && (
        <Collapse in={showReplies}>
          <Box sx={{ mt: 2 }}>
            {comment.replies.map((reply) => (
              <BlogCommentThread
                key={reply.comment_id}
                comment={reply}
                level={level + 1}
                maxLevel={maxLevel}
                onReply={onReply}
                onUpdateStatus={onUpdateStatus}
                onDelete={onDelete}
                onReport={onReport}
                currentUserId={currentUserId}
              />
            ))}
          </Box>
        </Collapse>
      )}

      {/* Load More Replies (if there are many) */}
      {hasReplies && comment.replies.length >= 5 && level < 2 && (
        <Box sx={{ mt: 1, ml: level * 3 + 6 }}>
          <Button
            size="small"
            variant="text"
            sx={{ textTransform: 'none', color: 'primary.main' }}
          >
            Xem thêm {comment.total_replies - comment.replies.length} phản hồi
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default BlogCommentThread;
