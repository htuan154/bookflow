import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Typography, Avatar, Stack,
  Chip, IconButton, Alert, CircularProgress, Divider,
  FormControl, InputLabel, Select, MenuItem, Switch,
  FormControlLabel
} from '@mui/material';
import {
  Send, Close, EmojiEmotions, AttachFile, Preview,
  Person, AdminPanelSettings, Business, Reply
} from '@mui/icons-material';
import {useComment} from '../../context/BlogCommentContext';
import { USER_ROLES } from '../../config/roles';

const CommentReplyForm = ({ 
  open, 
  onClose, 
  onSubmit, 
  content, 
  onContentChange,
  parentComment = null,
  blogInfo = null,
  loading = false,
  currentUser = null
}) => {
  const [replyContent, setReplyContent] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [autoApprove, setAutoApprove] = useState(true);
  
  const maxLength = 2000;
  const { replyComment } = useComment();
  
  // ✅ FIX: Use ref to track if we should sync with external content
  const isExternalUpdate = useRef(false);

  // ✅ FIX: Only sync when dialog opens or external content changes significantly
  useEffect(() => {
    if (open && content !== undefined) {
      const newContent = content || '';
      if (newContent !== replyContent) {
        isExternalUpdate.current = true; // Flag as external update
        setReplyContent(newContent);
        setWordCount(newContent.length);
      }
    }
  }, [content, open]); // Only depend on content and open

  // ✅ FIX: Separate effect for word count and parent notification
  useEffect(() => {
    const newWordCount = replyContent.length;
    setWordCount(newWordCount);
    
    // Only notify parent if this wasn't triggered by external update
    if (onContentChange && typeof onContentChange === 'function' && !isExternalUpdate.current) {
      // Use setTimeout to break the synchronous update cycle
      const timeoutId = setTimeout(() => {
        onContentChange(replyContent);
      }, 0);
      
      return () => clearTimeout(timeoutId);
    }
    
    // Reset flag after processing
    isExternalUpdate.current = false;
  }, [replyContent, onContentChange]);

  const handleSubmit = async () => {
    if (!replyContent.trim()) {
      setError('Vui lòng nhập nội dung trả lời');
      return;
    }

    if (replyContent.length > maxLength) {
      setError(`Nội dung không được vượt quá ${maxLength} ký tự`);
      return;
    }

    setSubmitLoading(true);
    setError('');

    try {
      // FIX: Đúng key cho blogId và commentId
      const blogId = blogInfo?.blogId || blogInfo?.blog_id;
      const commentId = parentComment?.commentId || parentComment?.comment_id || parentComment?.id || parentComment?._id;

      if (!blogId || !commentId) {
        setError('Không xác định được blogId hoặc commentId để trả lời bình luận.');
        return;
      }

      await replyComment(
        blogId,
        commentId,
        {
          content: replyContent.trim(),
          autoApprove
        }
      );
      
      // Reset form sau khi submit thành công
      setReplyContent('');
      setWordCount(0);
      setShowPreview(false);
      onClose();
    } catch (err) {
      setError('Lỗi khi gửi trả lời: ' + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleClose = useCallback(() => {
    setReplyContent('');
    setWordCount(0);
    setError('');
    setShowPreview(false);
    onClose();
  }, [onClose]);

  // ✅ FIX: Stable content change handler
  const handleContentChange = useCallback((e) => {
    const newContent = e.target.value;
    isExternalUpdate.current = false; // Mark as internal update
    setReplyContent(newContent);
  }, []);

  const getWordCountColor = () => {
    if (wordCount > maxLength) return 'error';
    if (wordCount > maxLength * 0.8) return 'warning';
    return 'text.secondary';
  };

  const formatPreviewContent = (text) => {
    return text.split('\n').map((line, index) => (
      <Typography key={index} variant="body2" sx={{ mb: line ? 1 : 0 }}>
        {line || '\u00A0'}
      </Typography>
    ));
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 3,
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          maxHeight: '92vh',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)'
        }
      }}
    >
      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(135deg, #FF6B35 0%, #f7931e 100%)',
        color: 'white',
        p: 4,
        position: 'relative',
        borderRadius: '12px 12px 0 0'
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={3}>
            <Box sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              p: 1.5, 
              borderRadius: 2,
              backdropFilter: 'blur(10px)'
            }}>
              <Reply sx={{ fontSize: 32 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight="700" sx={{ mb: 0.5 }}>
                Trả lời bình luận
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.95 }}>
                {parentComment ? `Trả lời ${parentComment.user?.full_name || 'người dùng'}` : 'Thêm bình luận mới'}
              </Typography>
            </Box>
          </Stack>
          
          <IconButton 
            onClick={handleClose} 
            sx={{ 
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.15)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
            }}
          >
            <Close />
          </IconButton>
        </Stack>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {/* Parent Comment Info */}
        {parentComment && (
          <Box sx={{ p: 4, bgcolor: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', borderBottom: '2px solid #e2e8f0' }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 3, fontWeight: 600 }}>
              Bình luận gốc:
            </Typography>
            <Box sx={{ 
              bgcolor: 'white', 
              p: 3, 
              borderRadius: 3,
              border: '2px solid #e2e8f0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 4,
                bgcolor: '#FF6B35',
                borderRadius: '0 4px 4px 0'
              }
            }}>
              <Stack direction="row" spacing={3} alignItems="flex-start">
                <Avatar sx={{ 
                  width: 48, 
                  height: 48,
                  bgcolor: 'rgba(255,107,53,0.1)',
                  border: '3px solid white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  <Person />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <Typography variant="h6" fontWeight="700" color="#1a202c">
                      {/* SỬA: Ưu tiên full_name, rồi username, rồi full_name ngoài, cuối cùng là Ẩn danh */}
                      {parentComment.user?.full_name?.trim()
                        ? parentComment.user.full_name
                        : (parentComment.user?.username?.trim()
                          ? parentComment.user.username
                          : (parentComment.full_name?.trim()
                            ? parentComment.full_name
                            : 'Ẩn danh'))}
                    </Typography>
                    {/* XÓA: Không render Chip role nữa */}
                    {/* <Chip ... /> */}
                  </Stack>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {parentComment.content}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Box>
        )}

        {/* Reply Form */}
        <Box sx={{ p: 4 }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 3,
                border: '1px solid #fecaca',
                '& .MuiAlert-icon': { color: '#dc2626' }
              }} 
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          {/* Form Controls */}
          <Stack spacing={4}>
            {/* Content Input */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight="700" color="#1a202c">
                  Nội dung trả lời *
                </Typography>
                <Stack direction="row" alignItems="center" spacing={3}>
                  <Typography 
                    variant="body2" 
                    color={getWordCountColor()}
                    fontWeight="700"
                    sx={{
                      bgcolor: wordCount > maxLength ? '#fee2e2' : '#f0f9ff',
                      px: 2,
                      py: 0.5,
                      borderRadius: 2,
                      border: wordCount > maxLength ? '1px solid #fca5a5' : '1px solid #bfdbfe'
                    }}
                  >
                    {wordCount}/{maxLength}
                  </Typography>
                  <Button
                    size="medium"
                    variant={showPreview ? "contained" : "outlined"}
                    startIcon={<Preview />}
                    onClick={() => setShowPreview(!showPreview)}
                    sx={{ 
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: 3,
                      px: 3
                    }}
                  >
                    {showPreview ? 'Chỉnh sửa' : 'Xem trước'}
                  </Button>
                </Stack>
              </Stack>

              {!showPreview ? (
                <TextField
                  fullWidth
                  multiline
                  rows={7}
                  placeholder="Nhập nội dung trả lời của bạn..."
                  value={replyContent}
                  onChange={handleContentChange}
                  error={wordCount > maxLength}
                  helperText={wordCount > maxLength ? `Vượt quá ${wordCount - maxLength} ký tự` : ''}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      fontSize: '1rem',
                      bgcolor: 'white',
                      '& fieldset': {
                        borderWidth: 2,
                        borderColor: '#e2e8f0'
                      },
                      '&:hover fieldset': {
                        borderColor: '#FF6B35'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#FF6B35',
                        borderWidth: 2
                      }
                    }
                  }}
                />
              ) : (
                <Box sx={{ 
                  minHeight: 200,
                  p: 3,
                  border: '2px solid #e2e8f0',
                  borderRadius: 3,
                  bgcolor: '#f8fafc',
                  position: 'relative'
                }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
                    Xem trước nội dung:
                  </Typography>
                  <Box sx={{ 
                    minHeight: 140,
                    p: 3,
                    bgcolor: 'white',
                    borderRadius: 2,
                    border: '1px solid #e2e8f0'
                  }}>
                    {replyContent ? (
                      formatPreviewContent(replyContent)
                    ) : (
                      <Typography variant="body2" color="text.secondary" fontStyle="italic" sx={{ textAlign: 'center', py: 4 }}>
                        Chưa có nội dung để xem trước
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </Box>

            {/* Additional Options */}
            <Box sx={{
              bgcolor: '#f8fafc',
              p: 3,
              borderRadius: 3,
              border: '1px solid #e2e8f0'
            }}>
              <Typography variant="h6" fontWeight="700" color="#1a202c" sx={{ mb: 3 }}>
                Tùy chọn bổ sung
              </Typography>
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoApprove}
                      onChange={(e) => setAutoApprove(e.target.checked)}
                      color="primary"
                      size="medium"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight="600" color="#1a202c">
                        Tự động duyệt bình luận
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                        Bình luận sẽ được hiển thị ngay lập tức mà không cần duyệt thủ công
                      </Typography>
                    </Box>
                  }
                />
              </Stack>
            </Box>
          </Stack>
        </Box>
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{ 
        p: 4, 
        pt: 2, 
        bgcolor: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        borderRadius: '0 0 12px 12px'
      }}>
        <Button 
          onClick={handleClose}
          variant="outlined"
          disabled={submitLoading}
          size="large"
          sx={{ 
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 600,
            px: 4,
            py: 1.5,
            borderColor: '#e2e8f0',
            color: '#475569',
            borderWidth: 2,
            '&:hover': {
              borderColor: '#FF6B35',
              color: '#FF6B35',
              bgcolor: 'rgba(255, 107, 53, 0.04)',
              borderWidth: 2
            }
          }}
        >
          Hủy bỏ
        </Button>
        
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={!replyContent.trim() || wordCount > maxLength || submitLoading}
          startIcon={submitLoading ? <CircularProgress size={18} color="inherit" /> : <Send />}
          size="large"
          sx={{ 
            bgcolor: '#FF6B35',
            '&:hover': { 
              bgcolor: '#e55a2b',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(255, 107, 53, 0.4)'
            },
            '&:disabled': {
              bgcolor: '#cbd5e0',
              color: '#9ca3af'
            },
            borderRadius: 3,
            fontWeight: '700',
            textTransform: 'none',
            px: 5,
            py: 1.5,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 14px rgba(255, 107, 53, 0.25)'
          }}
        >
          {submitLoading ? 'Đang gửi...' : 'Gửi trả lời'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommentReplyForm;