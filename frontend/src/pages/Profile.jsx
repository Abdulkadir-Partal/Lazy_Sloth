import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";
import { getUserFromToken } from "../utils/auth";
import Note from "../components/Note";  // ← Home.jsx gibi import et
import PomodoroCard from "../components/PomodoroCard";  // ← Pomodoro kartı import et
import "../styles/Profile.css";

function Profile() {
  const [profile, setProfile] = useState(null);
  const [userData, setUserData] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Bio state'leri
  const [bio, setBio] = useState("");
  const [bioEditing, setBioEditing] = useState(false);
  const [bioSaving, setBioSaving] = useState(false);
  
  // ← Home.jsx gibi: Kullanıcının postları
  const [userPosts, setUserPosts] = useState([]);
  
  const { username } = useParams();

  const token = localStorage.getItem(ACCESS_TOKEN);
  const currentUser = getUserFromToken();

  // URL'deki username ile giriş yapmış user'ın username'i aynı mı?
  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }

    // ← Profil bilgisi
    api
      .get(`/api/user/${username}/`)
      .then((res) => {
        setUserData(res.data);
        setProfile(res.data.profile);
        setBio(res.data.profile?.bio || "");
        if (res.data.profile?.avatar) setPreview(res.data.profile.avatar);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Profil çekme hatası:", err);
        setLoading(false);
      });

    // ← Home.jsx gibi: Kullanıcının postlarını çek
    api
      .get(`/api/user/${username}/posts/`)
      .then((res) => {
        setUserPosts(res.data);
      })
      .catch((err) => {
        console.error("Postlar çekme hatası:", err);
      });
  }, [username]);

  const handleImageChange = async (e) => {
    if (!isOwnProfile) {
      alert("Başka bir kullanıcının avatarını değiştiremezsiniz.");
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      await api.patch(`/api/profile/update/${currentUser.user_id}/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Avatar başarıyla güncellendi");
    } catch (err) {
      console.error("Avatar upload hatası:", err);
    }
  };

  const handleBioChange = (e) => {
    const newBio = e.target.value;
    if (newBio.length <= 500) {
      setBio(newBio);
    }
  };

  const handleBioSave = async () => {
    if (!isOwnProfile) return;

    setBioSaving(true);
    try {
      await api.patch(`/api/profile/update/${currentUser.user_id}/`, 
        { bio: bio },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setBioEditing(false);
      console.log("Bio başarıyla güncellendi");
    } catch (err) {
      console.error("Bio kaydetme hatası:", err);
      alert("Bio kaydedilemedi. Tekrar deneyin.");
    } finally {
      setBioSaving(false);
    }
  };

  const handleBioCancel = () => {
    setBio(profile?.bio || "");
    setBioEditing(false);
  };

  // ← Home.jsx gibi: Post silme
  const deleteUserPost = (id) => {
    api
      .delete(`/api/notes/delete/${id}/`)
      .then(() => {
        // ← Silindikten sonra listeden çıkar
        setUserPosts(userPosts.filter(post => post.id !== id));
      })
      .catch((error) => alert(error));
  };

  if (loading) return <p>Yükleniyor...</p>;
  if (!profile) return <p>Profil bulunamadı.</p>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar-container">
          <img
            src={preview || "/default-avatar.png"}
            className="profile-avatar-large"
            alt="avatar"
          />
          {isOwnProfile && (
            <>
              <input type="file" onChange={handleImageChange} className="avatar-upload" id="avatar-input" />
              <Link to="/logout" className="logout-btn">
                Logout
              </Link>
            </>
          )}
        </div>

        <div className="profile-info">
          <h2>{userData?.username}</h2>
          
          {/* Bio Section */}
          <div className="bio-section">
            {bioEditing ? (
              <div className="bio-edit-container">
                <textarea
                  className="bio-textarea"
                  value={bio}
                  onChange={handleBioChange}
                  placeholder="Biyografi yazınız... (0/500)"
                  maxLength={500}
                />
                <div className="bio-footer">
                  <span className="bio-char-counter">
                    {bio.length}/500
                  </span>
                  <div className="bio-buttons">
                    <button
                      className="bio-save-btn"
                      onClick={handleBioSave}
                      disabled={bioSaving}
                    >
                      {bioSaving ? "Kaydediliyor..." : "Kaydet"}
                    </button>
                    <button
                      className="bio-cancel-btn"
                      onClick={handleBioCancel}
                      disabled={bioSaving}
                    >
                      İptal
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bio-display-container">
                <p className="bio-display">
                  {bio || "Bio yazısı bulunmamaktadır."}
                </p>
                {isOwnProfile && (
                  <button
                    className="bio-edit-btn"
                    onClick={() => setBioEditing(true)}
                  >
                    Düzenle
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ← Pomodoro kartını ekle: postların üstünde göster */}
      <PomodoroCard username={username} isOwnProfile={isOwnProfile} />

      {/* ← Home.jsx gibi: Postları göster */}
      <div className="profile-posts-section">
        <h3>{isOwnProfile ? "Benim Postlarım" : `${userData?.username} Tarafından Paylaşılan Postlar`}</h3>
        
        {userPosts.length === 0 ? (
          <p className="no-posts-message">
            {isOwnProfile ? "Henüz hiçbir post yazmadınız." : "Bu kullanıcının henüz bir post yazısı bulunmamaktadır."}
          </p>
        ) : (
          // ← Home.jsx gibi: Note component ile göster
          userPosts.map((note) => (
            <Note note={note} onDelete={deleteUserPost} key={note.id} />
          ))
        )}
      </div>
    </div>
  );
}

export default Profile;
