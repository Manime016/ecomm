import { useState } from "react";
import api, { PRODUCT_API } from "../config/api";
import "./AddProduct.css";

const emptyForm = {
  name: "",
  price: "",
  category: "",
  description: "",
  stock: "",
};

function AddProduct() {
  const [formData, setFormData] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [popup, setPopup] = useState({ show: false, message: "", type: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => data.append(key, value));
      if (imageFile) data.append("image", imageFile);

      await api.post(PRODUCT_API, data);

      setPopup({ show: true, message: "Product added successfully.", type: "success" });
      setFormData(emptyForm);
      setImageFile(null);
      event.target.reset();
    } catch (error) {
      const message = error.response?.data?.detail || "Unable to add the product.";
      setPopup({ show: true, message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="page-heading">
        <p className="eyebrow">CATALOG</p>
        <h2>Add Product</h2>
        <p>Create a product that will be available through the customer storefront.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <label>Product name<input type="text" name="name" placeholder="Product Name" value={formData.name} onChange={handleChange} required /></label>
        <label>Price<input type="number" name="price" min="0" step="0.01" placeholder="Price" value={formData.price} onChange={handleChange} required /></label>
        <label>Category<select name="category" value={formData.category} onChange={handleChange} required><option value="">Select Category</option><option value="Makeup">Makeup</option><option value="Electronics">Electronics</option><option value="Fashion">Fashion</option><option value="Home Appliances">Home Appliances</option></select></label>
        <label>Description<textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} /></label>
        <label>Stock<input type="number" name="stock" min="0" placeholder="Available quantity" value={formData.stock} onChange={handleChange} required /></label>
        <label>Product image<input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} /></label>
        <button type="submit" disabled={submitting}>{submitting ? "Adding…" : "Add Product"}</button>
      </form>

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

export default AddProduct;
