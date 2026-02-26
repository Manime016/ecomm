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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await axios.put(`${API}/${editId}`, formData);
    setEditId(null);
    fetchProducts();
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
            <input name="name"
              value={formData.name}
              onChange={(e)=>setFormData({...formData,name:e.target.value})} />

            <input name="price"
              value={formData.price}
              onChange={(e)=>setFormData({...formData,price:e.target.value})} />

            <input name="image"
              value={formData.image}
              onChange={(e)=>setFormData({...formData,image:e.target.value})} />

            <button type="submit">Update</button>
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