import { useState, useEffect } from "react";
import api from "../api";
import "../styles/AddProductModal.css";

function AddProductModal({ onClose, onSuccess, editingProduct }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    stock: "",
    image: null,
    is_active: true
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        title: editingProduct.title,
        description: editingProduct.description,
        price: editingProduct.price,
        stock: editingProduct.stock,
        is_active: editingProduct.is_active,
        image: null
      });
      if (editingProduct.image) {
        // Eğer URL absolute değilse, backend URL'sini ekle
        const imageUrl = editingProduct.image.startsWith('http')
          ? editingProduct.image
          : `${import.meta.env.VITE_API_URL}${editingProduct.image}`;
        setPreview(imageUrl);
      }
    }
  }, [editingProduct]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.price) {
      alert("Lütfen tüm alanları doldurunuz");
      return;
    }

    setLoading(true);
    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("price", formData.price);
    data.append("stock", formData.stock);
    data.append("is_active", formData.is_active);
    if (formData.image) {
      data.append("image", formData.image);
    }

    const request = editingProduct
      ? api.put(`/api/products/${editingProduct.id}/update/`, data)
      : api.post("/api/products/create/", data);

    request
      .then(() => {
        alert(editingProduct ? "Ürün güncellendi" : "Ürün eklendi");
        onSuccess();
        onClose();
      })
      .catch((err) => {
        alert("Hata: " + (err.response?.data?.detail || err.message));
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingProduct ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-group">
            <label>Ürün Adı</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ürün adı girin"
            />
          </div>

          <div className="form-group">
            <label>Açıklama</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Ürün açıklaması girin"
              rows="4"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Fiyat (₺)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Stok</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Resim</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {preview && (
              <div className="image-preview">
                <img src={preview} alt="preview" />
              </div>
            )}
          </div>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              Aktif Ürün
            </label>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn-cancel"
              onClick={onClose}
            >
              İptal
            </button>
            <button 
              type="submit" 
              className="btn-submit"
              disabled={loading}
            >
              {loading ? "Kaydediliyor..." : editingProduct ? "Güncelle" : "Ekle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProductModal;
