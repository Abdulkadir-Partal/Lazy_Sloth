import { useState } from "react";
import api from "../api";
import "../styles/ProductCard.css";

function ProductCard({ product, onEdit, onDelete, isAdmin }) {
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  const getImageUrl = (image) => {
    if (!image) return null;
    // Eğer URL absolute değilse, backend URL'sini ekle
    if (image.startsWith('http')) {
      return image;
    }
    return `${import.meta.env.VITE_API_URL}${image}`;
  };

  const handleAddToCart = () => {
    if (quantity < 1) {
      alert("Geçersiz miktar");
      return;
    }

    setAddingToCart(true);
    api
      .post("/api/cart/add/", {
        product_id: product.id,
        quantity: quantity
      })
      .then(() => {
        alert(`${product.title} sepete eklendi!`);
        setQuantity(1);
      })
      .catch((err) => {
        const errorMsg = err.response?.data?.error || "Hata oluştu";
        alert("Sepete ekleme hatası: " + errorMsg);
      })
      .finally(() => setAddingToCart(false));
  };

  return (
    <div className="product-card">
      <div className="product-image">
        {product.image && getImageUrl(product.image) ? (
          <img src={getImageUrl(product.image)} alt={product.title} />
        ) : (
          <div className="no-image">📦</div>
        )}
      </div>

      <div className="product-info">
        <h3 className="product-title">{product.title}</h3>
        
        <p className="product-description">
          {product.description.substring(0, 100)}
          {product.description.length > 100 ? "..." : ""}
        </p>

        <div className="product-footer">
          <div className="product-price">₺{product.price}</div>
          
          <div className="product-stock">
            <span className={product.stock > 0 ? "in-stock" : "out-of-stock"}>
              {product.stock > 0 ? `${product.stock} Stok` : "Tükendi"}
            </span>
          </div>
        </div>

        {isAdmin && (
          <div className="admin-controls">
            <button 
              className="btn-edit"
              onClick={() => onEdit(product)}
            >
              ✏️ Düzenle
            </button>
            <button 
              className="btn-delete"
              onClick={() => onDelete(product.id)}
            >
              🗑️ Sil
            </button>
          </div>
        )}

        {!isAdmin && (
          <div className="user-controls">
            <div className="quantity-input">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                −
              </button>
              <input 
                type="number" 
                min="1" 
                max={product.stock}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <button 
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
              >
                +
              </button>
            </div>
            <button 
              className="btn-add-cart"
              onClick={handleAddToCart}
              disabled={product.stock === 0 || addingToCart}
            >
              {addingToCart ? "Ekleniyor..." : "🛒 Sepete Ekle"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductCard;
