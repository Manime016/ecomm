import { useState, useEffect } from "react";
import axios from "axios";
import "./AddProduct.css";

const API = `${import.meta.env.VITE_API_URL}/api/products`;

function MyProducts() {
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
  const [imageLink, setImageLink] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchProducts = async () => {
    try {
      const res = await axios.get(API);
      setProducts(res.data);
    } catch (err) {
      setErrorMessage("Failed to fetch products");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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
    setImageLink(product.image || "");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();

      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });

      if (image) {
        data.append("image", image);
      }

      if (imageLink) {
        data.append("image", imageLink);
      }

      await axios.put(`${API}/${editId}`, data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setSuccessMessage("Product Updated Successfully!");
      resetForm();
      fetchProducts();
    } catch (err) {
      setErrorMessage("Update Failed");
    }

    setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 3000);
  };

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
    setImageLink("");
  };

  return (
    <div className="admin-container">
      <h2>My Products</h2>

      {successMessage && <div className="success-popup">{successMessage}</div>}
      {errorMessage && <div className="error-popup">{errorMessage}</div>}

      {editId && (
        <form onSubmit={handleUpdate}>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            required
          />

          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: e.target.value })
            }
            required
          />

          <select
            name="category"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            required
          >
            <option value="Makeup">Makeup</option>
            <option value="Electronics">Electronics</option>
            <option value="Fashion">Fashion</option>
            <option value="Home Appliances">Home Appliances</option>
          </select>

          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />

          <input
            type="number"
            value={formData.stock}
            onChange={(e) =>
              setFormData({ ...formData, stock: e.target.value })
            }
          />

          {/* FILE OPTION */}
          <input
            type="file"
            onChange={(e) => {
              setImage(e.target.files[0]);
              setImageLink("");
            }}
          />

          {/* IMAGE LINK OPTION */}
          <input
            type="text"
            placeholder="Or Paste Image URL"
            value={imageLink}
            onChange={(e) => {
              setImageLink(e.target.value);
              setImage(null);
            }}
          />

          <button type="submit">Update Product</button>
          <button type="button" onClick={resetForm}>
            Cancel
          </button>
        </form>
      )}

      <div className="product-list">
        <div className="product-grid">
          {products.map((product) => (
            <div key={product._id} className="product-card">
              <img
                src={
                  product.image
                    ? product.image
                    : "https://via.placeholder.com/150"
                }
                alt={product.name}
              />

              <h4>{product.name}</h4>
              <p className="price">₹{product.price}</p>
              <p className="category">{product.category}</p>

              <div className="card-buttons">
                <button onClick={() => handleEdit(product)}>Edit</button>
                <button onClick={() => handleDelete(product._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MyProducts;