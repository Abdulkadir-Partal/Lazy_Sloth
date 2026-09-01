import { useState, useEffect } from "react";
import api from "../api";
import ProductCard from "../components/ProductCard";
import AddProductModal from "../components/AddProductModal";
import { getUserFromToken } from "../utils/auth";
import "../styles/Products.css";

function Products() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const user = getUserFromToken();

  useEffect(() => {
    getProducts();
  }, []);

  const getProducts = () => {
    api
      .get("/api/products/")
      .then((res) => setProducts(res.data))
      .catch((err) => alert("Ürünleri yükleme hatası: " + err));
  };

  const handleAddProduct = (newProduct) => {
    getProducts();
    setShowModal(false);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setEditingProduct(null);
    setShowModal(false);
  };

  const handleDeleteProduct = (productId) => {
    if (window.confirm("Ürünü silmek istediğinize emin misiniz?")) {
      api
        .delete(`/api/products/${productId}/delete/`)
        .then(() => {
          alert("Ürün silindi");
          getProducts();
        })
        .catch((err) => alert("Silme hatası: " + err));
    }
  };

  const isAdmin = user?.role === "admin" || user?.role === "moderator";

  return (
    <div className="products-container">
      <div className="products-header">
        <h2>🛍️ Ürünler</h2>
        {isAdmin && (
          <button 
            className="btn-add-product"
            onClick={() => setShowModal(true)}
          >
            + Ürün Ekle
          </button>
        )}
      </div>

      {products.length === 0 ? (
        <div className="no-products">
          <p>Henüz ürün bulunmamaktadır.</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {showModal && (
        <AddProductModal
          onClose={handleCloseModal}
          onSuccess={handleAddProduct}
          editingProduct={editingProduct}
        />
      )}
    </div>
  );
}

export default Products;
