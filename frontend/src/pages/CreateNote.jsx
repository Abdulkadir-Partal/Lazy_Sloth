import { useState } from "react";
import api from "../api";
import Toast from "../components/Toast";
import "../styles/Home.css";
import { getUserFromToken } from "../utils/auth";

const MAX_IMAGE_MB = 2;

function CreateNote() {
  const user = getUserFromToken();
  const isRestricted = user?.status === "restricted";

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileSizeMB = file.size / (1024 * 1024);

    if (fileSizeMB > MAX_IMAGE_MB) {
      setToast({ message: `Görsel ${MAX_IMAGE_MB} MB'tan küçük olmalıdır`, type: "error" });
      return;
    }

    setImage(file); // base64 değil, gerçek File objesi
  };

  const createNote = async (e) => {
    e.preventDefault();

    if (isRestricted) {
      setToast({ message: "Restricted kullanıcılar post paylaşamaz.", type: "error" });
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);

    if (image) {
      formData.append("image", image);
    }

    try {
      const res = await api.post("/api/notes/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.status === 201) {
        setToast({ message: "Post başarıyla oluşturuldu!", type: "success" });
        setTitle("");
        setContent("");
        setImage(null);
      }
    } catch (err) {
      console.error(err);
      setToast({ message: "Post oluşturma başarısız. Lütfen tekrar deneyin.", type: "error" });
    }
  };

  return (
    <div>
      <h2>Create a Note</h2>

      {isRestricted && (
        <div style={{ color: "red", marginBottom: "15px" }}>
          Your account is restricted. You can view this page but cannot create posts.
        </div>
      )}

      <form onSubmit={createNote} encType="multipart/form-data">
        <label>Title</label><br />
        <input
          type="text"
          value={title}
          disabled={isRestricted}
          required
          onChange={(e) => setTitle(e.target.value)}
        />

        <br />

        <label>Content</label><br />
        <textarea
          value={content}
          disabled={isRestricted}
          required
          onChange={(e) => setContent(e.target.value)}
        />

        <br />

        <label>Image (max {MAX_IMAGE_MB} MB)</label><br />
        <input
          type="file"
          accept="image/*"
          disabled={isRestricted}
          onChange={handleImageChange}
        />

        <br /><br />

        <input
          type="submit"
          value="Create Note"
          disabled={isRestricted}
        />
      </form>

      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: "", type: "success" })}
      />
    </div>
  );
}

export default CreateNote;
