import { useEffect, useState } from "react";
import api, { PRODUCT_API } from "../config/api";
import "./AddProduct.css";

const emptyForm = { name: "", price: "", category: "", description: "", stock: "" };

function MyProducts() {
  const [products, setProducts] = useState([]);
  const [editId, setEditId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [popup, setPopup] = useState({ show: false, message: "", type: "" });
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get(PRODUCT_API);
      setProducts(Array.isArray(response.data) ? response.data : response.data?.items || []);
    } catch (error) {
      setPopup({ show: true, message: error.response?.data?.detail || "Unable to load products.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEdit = (product) => {
    setEditId(product._id);
    setFormData({
      name: product.name || "",
      price: product.price ?? "",
      category: product.category || "",
      description: product.description || "",
      stock: product.stock ?? "",
    });
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => data.append(key, value));
      if (imageFile) data.append("image", imageFile);

      await api.put(`${PRODUCT_API}/${editId}`, data);
      setPopup({ show: true, message: "Product updated successfully.", type: "success" });
      setEditId(null);
      setImageFile(null);
      setFormData(emptyForm);
      await fetchProducts();
    } catch (error) {
      setPopup({ show: true, message: error.response?.data?.detail || "Unable to update the product.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product? This action cannot be undone.")) return;
    try {
      await api.delete(`${PRODUCT_API}/${id}`);
      setPopup({ show: true, message: "Product deleted successfully.", type: "success" });
      await fetchProducts();
    } catch (error) {
      setPopup({ show: true, message: error.response?.data?.detail || "Unable to delete the product.", type: "error" });
    }
  };

  return (
    <div className="admin-container">
      {editId && (
        <>
          <div className="page-heading">
            <p className="eyebrow">CATALOG</p>
            <h2>Edit Product</h2>
          </div>
          <form onSubmit={handleUpdate}>
            <label>Product name<input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></label>
            <label>Price<input type="number" min="0" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required /></label>
            <label>Category<input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required /></label>
            <label>Description<textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></label>
            <label>Stock<input type="number" min="0" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} required /></label>
            <label>Replace image<input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} /></label>
            <div className="form-actions">
              <button type="submit" disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
              <button type="button" className="button-secondary" onClick={() => { setEditId(null); setFormData(emptyForm); setImageFile(null); }}>Cancel</button>
            </div>
          </form>
        </>
      )}

      <div className="page-heading">
        <p className="eyebrow">INVENTORY</p>
        <h2>Products</h2>
        <p>Manage the products exposed by the customer storefront.</p>
      </div>

      {loading ? <p className="state-message">Loading products…</p> : products.length === 0 ? <p className="state-message">No products found.</p> : (
        <div className="product-grid">
          {products.map((product) => (
            <article key={product._id} className="product-card">
              <img src={product.image || "https://via.placeholder.com/300x200?text=Product"} alt={product.name} loading="lazy" />
              <h4>{product.name}</h4>
              <p className="price">₹{product.price}</p>
              <p className="category">{product.category}</p>
              <div className="card-buttons">
                <button type="button" onClick={() => handleEdit(product)}>Edit</button>
                <button type="button" className="button-danger" onClick={() => handleDelete(product._id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}

      {popup.show && (
        <div className="popup-overlay" role="dialog" aria-modal="true" aria-label={popup.type === "success" ? "Success" : "Error"}>
          <div className={`popup-box ${popup.type}`}>
            <h3>{popup.type === "success" ? "Success" : "Error"}</h3>
            <p>{popup.message}</p>
            <button type="button" onClick={() => setPopup({ show: false, message: "", type: "" })}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyProducts;
