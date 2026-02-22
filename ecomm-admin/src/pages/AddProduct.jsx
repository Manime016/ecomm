import { useState, useEffect } from "react";
import axios from "axios";
import "./AddProduct.css";

const API = "http://localhost:5000/api/products";

function AddProduct() {
  const [products, setProducts] = useState([]);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    stock: ""
  });

  const [image, setImage] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ================= FETCH PRODUCTS =================
  const fetchProducts = async () => {
    try {
      const res = await axios.get(API);
      console.log("Fetched products:", res.data);
      setProducts(res.data);
    } catch (err) {
      console.log("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ================= HANDLE INPUT =================
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ================= ADD OR UPDATE =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();

      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });

      if (image) {
        data.append("image", image);
      }

      if (editId) {
        await axios.put(`${API}/${editId}`, data, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setSuccessMessage("Product Updated Successfully!");
      } else {
        await axios.post(API, data, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setSuccessMessage("Product Added Successfully!");
      }

      resetForm();
      fetchProducts();
    } catch (err) {
      console.log(err);
      setErrorMessage("Operation Failed");
    }

    setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 3000);
  };

  // ================= EDIT =================
  const handleEdit = (product) => {
    setEditId(product._id);

    setFormData({
      name: product.name,
      price: product.price,
      category: product.category,
      description: product.description,
      stock: product.stock
    });

    setImage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/${id}`);
      setSuccessMessage("Product Deleted Successfully!");
      fetchProducts();
    } catch (err) {
      setErrorMessage("Delete Failed");
    }

    setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 3000);
  };

  // ================= RESET =================
  const resetForm = () => {
    setEditId(null);
    setFormData({
      name: "",
      price: "",
      category: "",
      description: "",
      stock: ""
    });
    setImage(null);
  };

  return (
    <div className="admin-container">
      <h2>{editId ? "Edit Product" : "Add Product"}</h2>

      {successMessage && <div className="success-popup">{successMessage}</div>}
      {errorMessage && <div className="error-popup">{errorMessage}</div>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Product Name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="price"
          placeholder="Price"
          value={formData.price}
          onChange={handleChange}
          required
        />

        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
        >
          <option value="">Select Category</option>
          <option value="Makeup">Makeup</option>
          <option value="Electronics">Electronics</option>
          <option value="Fashion">Fashion</option>
          <option value="Home Appliances">Home Appliances</option>
        </select>

        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
        />

        <input
          type="number"
          name="stock"
          placeholder="Stock"
          value={formData.stock}
          onChange={handleChange}
        />

        <input
          type="file"
          onChange={(e) => setImage(e.target.files[0])}
        />

        <button type="submit">
          {editId ? "Update Product" : "Add Product"}
        </button>

        {editId && (
          <button type="button" onClick={resetForm}>
            Cancel Edit
          </button>
        )}
      </form>

      {/* ================= PRODUCT GRID ================= */}

      <div className="product-list">
        <h3>All Products</h3>

        {products.length === 0 && (
          <p>No products added yet.</p>
        )}

        <div className="product-grid">
          {products.map((product) => (
            <div key={product._id} className="product-card">

              <img
                src={product.image ? product.image : "https://via.placeholder.com/150"}
                alt={product.name}
              />

              <h4>{product.name}</h4>
              <p className="price">₹{product.price}</p>
              <p className="category">{product.category}</p>

              <div className="card-buttons">
                <button onClick={() => handleEdit(product)}>Edit</button>
                <button onClick={() => handleDelete(product._id)}>Delete</button>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AddProduct;
