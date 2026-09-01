import { useState, useEffect } from "react";
import api from "../api";
import CartItem from "../components/CartItem";
import "../styles/Cart.css";

function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCart();
  }, []);

  const getCart = () => {
    setLoading(true);
    api
      .get("/api/cart/")
      .then((res) => setCart(res.data))
      .catch((err) => {
        alert("Sepeti yükleme hatası: " + err);
        setCart({ items: [], user: null });
      })
      .finally(() => setLoading(false));
  };

  const handleRemoveItem = (itemId) => {
    api
      .post("/api/cart/remove/", { item_id: itemId })
      .then(() => {
        getCart();
        alert("Ürün sepetten çıkarıldı");
      })
      .catch((err) => alert("Çıkarma hatası: " + err));
  };

  const calculateTotal = () => {
    if (!cart?.items) return 0;
    return cart.items
      .reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0)
      .toFixed(2);
  };

  if (loading) {
    return <div className="cart-container">Yükleniyor...</div>;
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h2>🛒 Sepet</h2>
      </div>

      {!cart?.items || cart.items.length === 0 ? (
        <div className="empty-cart">
          <p>Sepetiniz boş</p>
          <a href="/products">Alışverişe devam et</a>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items">
            {cart.items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onRemove={handleRemoveItem}
                onQuantityChange={getCart}
              />
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-row">
              <span className="label">Ürün Sayısı:</span>
              <span className="value">
                {cart.items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>

            <div className="summary-row total">
              <span className="label">Toplam:</span>
              <span className="value">₺{calculateTotal()}</span>
            </div>

            <button className="btn-checkout">Ödemeye Geç</button>
            <a href="/products" className="btn-continue">
              Alışverişe Devam Et
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
