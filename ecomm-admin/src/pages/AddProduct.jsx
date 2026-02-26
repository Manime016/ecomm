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

  const [imageFile, setImageFile] = useState(null);

  const [popup, setPopup] = useState({
    show: false,
    message: "",
    type: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();

      data.append("name", formData.name);
      data.append("price", formData.price);
      data.append("category", formData.category);
      data.append("description", formData.description);
      data.append("stock", formData.stock);

      if (imageFile) {
        data.append("image", imageFile);
      }

      await axios.post(API, data);

      setPopup({
        show: true,
        message: "Product uploaded successfully!",
        type: "success"
      });

      setFormData({
        name: "",
        price: "",
        category: "",
        description: "",
        stock: ""
      });

      setImageFile(null);

    } catch (error) {
      console.error(error);

      setPopup({
        show: true,
        message: "Upload failed. Please try again.",
        type: "error"
      });
    }
  };

  return (
    <div className="admin-container">
      <h2>Add Product</h2>

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
          onChange={(e) => setImageFile(e.target.files[0])}
        />

        <button type="submit">Add Product</button>
      </form>

      {popup.show && (
        <div className="popup-overlay">
          <div className={`popup-box ${popup.type}`}>
            <h3>{popup.type === "success" ? "Success" : "Error"}</h3>
            <p>{popup.message}</p>
            <button onClick={() => setPopup({ show: false })}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddProduct;