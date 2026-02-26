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
  const [imageLink, setImageLink] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🔥 Cloudinary Upload
  const uploadToCloudinary = async () => {
    if (!imageFile) return null;

    const data = new FormData();
    data.append("file", imageFile);
    data.append("upload_preset", "ecommimages");

    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload`,
      data
    );

    return res.data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let finalImage = "";

      if (imageFile) {
        finalImage = await uploadToCloudinary();
      } else if (imageLink) {
        finalImage = imageLink;
      }

      const data = {
        ...formData,
        image: finalImage
      };

      await axios.post(API, data);

      setSuccessMessage("Product Added Successfully!");
      setFormData({
        name: "",
        price: "",
        category: "",
        description: "",
        stock: ""
      });
      setImageFile(null);
      setImageLink("");

    } catch (err) {
      setErrorMessage("Operation Failed");
    }

    setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 3000);
  };

  return (
    <div className="admin-container">
      <h2>Add Product</h2>

      {successMessage && <div className="success-popup">{successMessage}</div>}
      {errorMessage && <div className="error-popup">{errorMessage}</div>}

      <form onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Product Name"
          value={formData.name} onChange={handleChange} required />

        <input type="number" name="price" placeholder="Price"
          value={formData.price} onChange={handleChange} required />

        <select name="category"
          value={formData.category} onChange={handleChange} required>
          <option value="">Select Category</option>
          <option value="Makeup">Makeup</option>
          <option value="Electronics">Electronics</option>
          <option value="Fashion">Fashion</option>
          <option value="Home Appliances">Home Appliances</option>
        </select>

        <textarea name="description" placeholder="Description"
          value={formData.description} onChange={handleChange} />

        <input type="number" name="stock" placeholder="Stock"
          value={formData.stock} onChange={handleChange} />

        {/* OPTION 1 */}
        <input type="file"
          onChange={(e) => setImageFile(e.target.files[0])} />

        {/* OPTION 2 */}
        <input type="text"
          placeholder="Or Paste Image URL"
          value={imageLink}
          onChange={(e) => setImageLink(e.target.value)} />

        <button type="submit">Add Product</button>
      </form>
    </div>
  );
}

export default AddProduct;