import { useState } from "react";
import api from "../api";
import "../styles/CartItem.css";

function CartItem({ item, onRemove, onQuantityChange }) {
  const [updatingQuantity, setUpdatingQuantity] = useState(false);
  const itemTotal = (item.product.price * item.quantity).toFixed(2);

  const getImageUrl = (image) => {
    if (!image) return null;
    if (image.startsWith('http')) {
      return image;
    }
    return `${import.meta.env.VITE_API_URL}${image}`;
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) {
      onRemove(item.id);
      return;
    }

    if (newQuantity > item.product.stock) {
      alert("Stok yetmiyor");
      return;
    }

    setUpdatingQuantity(true);
    api
      .post("/api/cart/add/", {
        product_id: item.product.id,
        quantity: newQuantity - item.quantity
      })
      .then(() => {
        if (onQuantityChange) {
          onQuantityChange();
        }
      })
      .catch((err) => {
        alert("Miktar güncelleme hatası: " + (err.response?.data?.error || err.message));
      })
      .finally(() => setUpdatingQuantity(false));
  };

  return (
    <div className="cart-item">
      <div className="item-image">
        {item.product.image && getImageUrl(item.product.image) ? (
          <img src={getImageUrl(item.product.image)} alt={item.product.title} />
        ) : (
          <div className="no-image">📦</div>
        )}
      </div>

      <div className="item-details">
        <h3>{item.product.title}</h3>
        <p className="item-description">
          {item.product.description.substring(0, 60)}...
        </p>
      </div>

      <div className="item-pricing">
        <div className="price">₺{item.product.price}</div>
        <div className="quantity-control">
          <button 
            className="qty-btn"
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={updatingQuantity || item.quantity <= 1}
            title="Azalt"
          >
            −
          </button>
          <span className="qty-value">{item.quantity}</span>
          <button 
            className="qty-btn"
            onClick={() => handleQuantityChange(item.quantity + 1)}
            disabled={updatingQuantity || item.quantity >= item.product.stock}
            title="Arttır"
          >
            +
          </button>
        </div>
      </div>

      <div className="item-total">
        ₺{itemTotal}
      </div>

      <button 
        className="btn-remove"
        onClick={() => {
          if (window.confirm("Ürünü sepetten çıkarmak istediğinize emin misiniz?")) {
            onRemove(item.id);
          }
        }}
      >
        🗑️
      </button>
    </div>
  );
}

export default CartItem;
