import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/Note.css";
import { getUserFromToken } from "../utils/auth";
import api from "../api";
import ReportModal from "./ReportModal";
import Toast from "./Toast";

function Note({ note, onDelete, onUpdate }) {
  const formattedDate = new Date(note.created_at).toLocaleDateString("en-US");
  const user = getUserFromToken();
  const [likeCount, setLikeCount] = useState(note.like_count || 0);
  const [userLiked, setUserLiked] = useState(note.user_liked || false);
  const [liking, setLiking] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(note.comment_count || 0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  // Fetch comments when component mounts or showComments changes
  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);

  const fetchComments = async () => {
    try {
      const response = await api.get(`api/notes/${note.id}/comments/`);
      setComments(response.data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user || commenting) return;

    // Check if user is restricted
    if (user.status === "restricted") {
      alert("Kısıtlı kullanıcılar yorum yapamaz.");
      return;
    }

    setCommenting(true);
    try {
      const response = await api.post(`api/notes/${note.id}/comments/`, {
        content: newComment.trim()
      });
      setComments([...comments, response.data]);
      setCommentCount(commentCount + 1);
      setNewComment("");
      // Trigger parent update to refresh all notes
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setCommenting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`api/comments/${commentId}/`);
      setComments(comments.filter(comment => comment.id !== commentId));
      setCommentCount(commentCount - 1);
      // Trigger parent update to refresh all notes
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const canDelete =
    user &&
    (user.user_id == note.author ||
      user.role === "admin" ||
      user.role === "moderator");

  // Image URL düzeltmesi
  const imageUrl = note.image
    ? note.image.startsWith("http")
      ? note.image
      : `http://127.0.0.1:8000${note.image}`
    : null;

  // Avatar URL düzeltmesi
  const avatarUrl = note.author_avatar
    ? note.author_avatar.startsWith("http")
      ? note.author_avatar
      : `http://127.0.0.1:8000${note.author_avatar}`
    : null;

  const handleLike = async () => {
    if (!user || liking) return;

    setLiking(true);
    try {
      const response = await api.post(`api/notes/${note.id}/like/`);
      setUserLiked(response.data.liked);
      setLikeCount(response.data.like_count);
      // Trigger parent update to refresh all notes
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Like error:", error);
    } finally {
      setLiking(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
  };

  const handleReportClick = () => {
    if (!user) {
      showToast("Rapor etmek için giriş yapınız", "error");
      return;
    }
    if (user.user_id === note.author) {
      showToast("Kendi postunuzu raporlayamazsınız", "error");
      return;
    }
    setShowReportModal(true);
    setShowMenu(false);
  };

  return (
    <div className="note-container">
      <p className="note-title">{note.title}</p>

      {imageUrl && (
        <div className="note-image-wrapper">
          <img
            src={imageUrl}
            alt="Note"
            className="note-image"
          />
        </div>
      )}

      <div className="note-content">
        {note.content && note.content.split("\n\n").map((block, idx) => (
          <p key={idx} className="note-content-paragraph" style={{ margin: '8px 0', whiteSpace: 'pre-wrap' }}>
            {block}
          </p>
        ))}
      </div>

      <div className="note-footer">
        <div className="note-author-info">
          <Link to={`/profile/${note.author_username}`} className="author-avatar-link">
            {avatarUrl && (
              <img
                src={avatarUrl}
                alt={note.author_username}
                className="note-author-avatar"
              />
            )}
          </Link>
          <p className="note-author">
            Posted by: <Link to={`/profile/${note.author_username}`} className="author-link">{note.author_username}</Link>
          </p>
        </div>
        
        <div className="note-footer-right">
          <div className="note-actions">
            {user && (
              <button
                className={`like-button ${userLiked ? 'liked' : ''}`}
                onClick={handleLike}
                disabled={liking}
                title={userLiked ? "Beğeniyi kaldır" : "Beğen"}
              >
                {userLiked ? '❤️' : '🤍'} {likeCount}
              </button>
            )}
            {!user && (
              <span className="like-count">❤️ {likeCount}</span>
            )}
            
            <div className="note-menu-container">
              <button
                className="menu-button"
                onClick={() => setShowMenu(!showMenu)}
                title="Daha fazla seçenek"
              >
                ⋮
              </button>
              
              {showMenu && (
                <div className="note-menu-dropdown">
                  {user && user.user_id !== note.author && (
                    <button
                      className="menu-item report"
                      onClick={handleReportClick}
                    >
                      🚩 Rapor Et
                    </button>
                  )}
                  {canDelete && (
                    <button
                      className="menu-item delete"
                      onClick={() => {
                        onDelete(note.id);
                        setShowMenu(false);
                      }}
                    >
                      ✕ Sil
                    </button>
                  )}
                  {!user && (
                    <div className="menu-item disabled">
                      Giriş yapınız
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <p className="note-date">{formattedDate}</p>
        </div>
      </div>

      {/* Comments Section */}
      <div className="comments-section">
        <button 
          className="toggle-comments-btn"
          onClick={() => setShowComments(!showComments)}
        >
          💬 {commentCount} yorum {showComments ? 'gizle' : 'göster'}
        </button>

        {showComments && (
          <div className="comments-container">
            {comments.map(comment => (
              <div key={comment.id} className="comment">
                <div className="comment-header">
                  <Link to={`/profile/${comment.user_username}`} className="comment-author">
                    {comment.user_avatar && (
                      <img
                        src={comment.user_avatar.startsWith("http") ? comment.user_avatar : `http://127.0.0.1:8000${comment.user_avatar}`}
                        alt={comment.user_username}
                        className="comment-avatar"
                      />
                    )}
                    {comment.user_username}
                  </Link>
                  <span className="comment-date">
                    {new Date(comment.created_at).toLocaleDateString("tr-TR")}
                  </span>
                  {(user && (user.user_id == comment.user || user.role === "admin" || user.role === "moderator")) && (
                    <button
                      className="delete-comment-btn"
                      onClick={() => handleDeleteComment(comment.id)}
                      title="Yorumu sil"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p className="comment-content">{comment.content}</p>
              </div>
            ))}

            {user && user.status !== "restricted" && (
              <form onSubmit={handleAddComment} className="comment-form">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Yorumunuzu yazın..."
                  className="comment-input"
                  rows="2"
                  maxLength="500"
                />
                <button
                  type="submit"
                  className="comment-submit-btn"
                  disabled={commenting || !newComment.trim()}
                >
                  {commenting ? "Gönderiliyor..." : "Yorum Yap"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {showReportModal && (
        <ReportModal
          noteId={note.id}
          authorId={note.author}
          currentUserId={user?.user_id}
          onClose={() => setShowReportModal(false)}
          onSuccess={(message) => {
            showToast(message, "success");
            setShowReportModal(false);
          }}
        />
      )}

      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage("")}
          duration={3000}
        />
      )}
    </div>
  );
}

export default Note;
