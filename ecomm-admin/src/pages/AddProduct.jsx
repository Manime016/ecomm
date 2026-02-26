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

  // ================= CLOUDINARY UPLOAD FUNCTION =================
  const uploadToCloudinary = async () => {
    try {
      if (!imageFile) {
        console.log("No file selected");
        return null;
      }

      console.log("Uploading to Cloudinary...");

      const data = new FormData();
      data.append("file", imageFile);
      data.append("upload_preset", "ecommimages"); // your unsigned preset

      const res = await axios.post(
        "https://api.cloudinary.com/v1_1/de9zaqoas/image/upload",
        data
      );

      console.log("Upload success:", res.data.secure_url);

      return res.data.secure_url;

    } catch (error) {
      console.error("Cloudinary upload error:",
        error.response?.data || error.message
      );
      return null;
    }
  };
  // ===============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let finalImage = "";

      if (imageFile) {
        finalImage = await uploadToCloudinary();
      } else if (imageLink) {
        finalImage = imageLink;
      }

      const productData = {
        ...formData,
        image: finalImage
      };

      console.log("Sending to backend:", productData);

      await axios.post(API, productData);

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
      console.error("Submit error:", err);
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

        {/* OPTION 1: FILE UPLOAD */}
        <input
          type="file"
          onChange={(e) => {
            setImageFile(e.target.files[0]);
            setImageLink("");
          }}
        />

        {/* OPTION 2: IMAGE LINK */}
        <input
          type="text"
          placeholder="Or Paste Image URL"
          value={imageLink}
          onChange={(e) => {
            setImageLink(e.target.value);
            setImageFile(null);
          }}
        />

        <button type="submit">Add Product</button>

      </form>
    </div>
  );
}

export default AddProduct;