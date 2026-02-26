import { useState, useEffect } from "react";
import axios from "axios";
import "./AddProduct.css";

const API = `${import.meta.env.VITE_API_URL}/api/products`;

function MyProducts() {

  const [products, setProducts] = useState([]);
  const [editId, setEditId] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    stock: "",
    image: ""
  });

  const fetchProducts = async () => {
    const res = await axios.get(API);
    setProducts(res.data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEdit = (product) => {
    setEditId(product._id);
    setFormData(product);
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ✅ Cloudinary Upload
  const uploadToCloudinary = async () => {
    if (!imageFile) return formData.image;

    const data = new FormData();
    data.append("file", imageFile);
    data.append("upload_preset", "ecommimages");

    const res = await axios.post(
      "https://api.cloudinary.com/v1_1/de9zaqoas/image/upload",
      data
    );

    return res.data.secure_url;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const uploadedImage = await uploadToCloudinary();

      const updatedData = {
        ...formData,
        image: uploadedImage
      };

      await axios.put(`${API}/${editId}`, updatedData);

      setEditId(null);
      fetchProducts();

    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = async (id) => {
    await axios.delete(`${API}/${id}`);
    fetchProducts();
  };

  return (
    <div className="admin-container">

      {editId && (
        <>
          <h2>Edit Product</h2>
          <form onSubmit={handleUpdate}>

            <input
              value={formData.name}
              onChange={(e)=>setFormData({...formData,name:e.target.value})}
              placeholder="Product Name"
            />

            <input
              value={formData.price}
              onChange={(e)=>setFormData({...formData,price:e.target.value})}
              placeholder="Price"
            />

            <input
              value={formData.category}
              onChange={(e)=>setFormData({...formData,category:e.target.value})}
              placeholder="Category"
            />

            <textarea
              value={formData.description}
              onChange={(e)=>setFormData({...formData,description:e.target.value})}
              placeholder="Description"
            />

            <input
              value={formData.stock}
              onChange={(e)=>setFormData({...formData,stock:e.target.value})}
              placeholder="Stock"
            />

            {/* ✅ File Upload */}
            <input
              type="file"
              onChange={(e) => setImageFile(e.target.files[0])}
            />

            <button type="submit">Update Product</button>
          </form>
        </>
      )}

      <h3>All Products</h3>

      <div className="product-grid">
        {products.map((product) => (
          <div key={product._id} className="product-card">

            <img
              src={product.image || "https://via.placeholder.com/150"}
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
  );
}

export default MyProducts;