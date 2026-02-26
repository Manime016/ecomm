import { useState } from "react";
import axios from "axios";
import "./AddProduct.css";

const API = `${import.meta.env.VITE_API_URL}/api/products`;

function AddProduct() {
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();

      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });

      // ✅ If file selected
      if (image) {
        data.append("image", image);
      }

      // ✅ If image link provided
      if (imageLink) {
        data.append("image", imageLink);
      }

      await axios.post(API, data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setSuccessMessage("Product Added Successfully!");
      resetForm();
    } catch (err) {
      console.log(err);
      setErrorMessage("Operation Failed");
    }

    setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 3000);
  };

  const resetForm = () => {
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
      <h2>Add Product</h2>

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

        {/* ✅ FILE OPTION */}
        <input
          type="file"
          onChange={(e) => {
            setImage(e.target.files[0]);
            setImageLink("");
          }}
        />

        {/* ✅ IMAGE LINK OPTION */}
        <input
          type="text"
          placeholder="Or Paste Image URL"
          value={imageLink}
          onChange={(e) => {
            setImageLink(e.target.value);
            setImage(null);
          }}
        />

        <button type="submit">Add Product</button>
      </form>
    </div>
  );
}

export default AddProduct;