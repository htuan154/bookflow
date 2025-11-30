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
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          minHeight: 'auto'
        }
      }}
    >
      {/* Compact Header */}
      <Box sx={{
        bgcolor: '#FF6B35',
        color: 'white',
        px: 3,
        py: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Reply sx={{ fontSize: 20 }} />
          <Typography variant="subtitle1" fontWeight="600">
            Trả lời bình luận
          </Typography>
        </Stack>
        
        <IconButton 
          onClick={handleClose} 
          size="small"
          sx={{ 
            color: 'white',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
          }}
        >
          <Close fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {/* Compact Parent Comment Info */}
        {parentComment && (
          <Box sx={{ 
            p: 2, 
            bgcolor: '#f8fafc', 
            borderRadius: 1,
            border: '1px solid #e2e8f0',
            mb: 2
          }}>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Avatar sx={{ width: 32, height: 32, bgcolor: '#FF6B35' }}>
                <Person sx={{ fontSize: 18 }} />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" fontWeight="600" sx={{ mb: 0.5 }}>
                  {parentComment.fullName?.trim() ||
                   parentComment.user?.full_name?.trim() || 
                   parentComment.full_name?.trim() || 
                   parentComment.username?.trim() ||
                   parentComment.user?.username?.trim() || 
                   'Người dùng'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  {parentComment.content}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2, borderRadius: 1 }} 
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        {/* Simple Text Input */}
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="Viết trả lời của bạn..."
          value={replyContent}
          onChange={handleContentChange}
          error={wordCount > maxLength}
          helperText={`${wordCount}/${maxLength}`}
          sx={{ 
            '& .MuiOutlinedInput-root': {
              borderRadius: 1,
              fontSize: '0.9rem',
              '& fieldset': {
                borderColor: '#e2e8f0'
              },
              '&:hover fieldset': {
                borderColor: '#FF6B35'
              },
              '&.Mui-focused fieldset': {
                borderColor: '#FF6B35'
              }
            }
          }}
        />

        {/* Simple Auto-approve option */}
        <FormControlLabel
          control={
            <Switch
              checked={autoApprove}
              onChange={(e) => setAutoApprove(e.target.checked)}
              color="primary"
              size="small"
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              Tự động duyệt bình luận
            </Typography>
          }
          sx={{ mt: 1 }}
        />
      </DialogContent>

      {/* Compact Actions */}
      <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
        <Button 
          onClick={handleClose}
          variant="outlined"
          size="small"
          sx={{ 
            textTransform: 'none',
            borderColor: '#e2e8f0',
            color: '#64748b',
            '&:hover': {
              borderColor: '#FF6B35',
              color: '#FF6B35'
            }
          }}
        >
          Hủy
        </Button>
        
        <Button 
          onClick={handleSubmit}
          variant="contained"
          size="small"
          disabled={!replyContent.trim() || wordCount > maxLength || submitLoading}
          startIcon={submitLoading ? <CircularProgress size={16} color="inherit" /> : <Send sx={{ fontSize: 16 }} />}
          sx={{ 
            bgcolor: '#FF6B35',
            textTransform: 'none',
            '&:hover': { 
              bgcolor: '#e55a2b'
            },
            '&:disabled': {
              bgcolor: '#cbd5e0'
            }
          }}
        >
          {submitLoading ? 'Đang gửi...' : 'Gửi'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommentReplyForm;