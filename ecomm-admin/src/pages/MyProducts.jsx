import { useState, useEffect } from "react";
import axios from "axios";
import "./AddProduct.css";

const API = `${import.meta.env.VITE_API_URL}/api/products`;

function MyProducts() {
  const [products, setProducts] = useState([]);
  const [editId, setEditId] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const [popup, setPopup] = useState({
    show: false,
    message: "",
    type: ""
  });

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    stock: "",
    image: ""
  });

  const fetchProducts = async () => {
    try {
      const res = await axios.get(API);
      setProducts(res.data);
    } catch (error) {
      console.error(error);
    }
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

  const handleUpdate = async (e) => {
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

      await axios.put(`${API}/${editId}`, data);

      setPopup({
        show: true,
        message: "Product updated successfully!",
        type: "success"
      });

      setEditId(null);
      setImageFile(null);
      fetchProducts();

    } catch (error) {
      console.error(error);

      setPopup({
        show: true,
        message: "Update failed. Please try again.",
        type: "error"
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/${id}`);
      fetchProducts();

      setPopup({
        show: true,
        message: "Product deleted successfully!",
        type: "success"
      });

    } catch (error) {
      console.error(error);

      setPopup({
        show: true,
        message: "Delete failed. Please try again.",
        type: "error"
      });
    }
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

export default MyProducts;