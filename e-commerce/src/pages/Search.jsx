import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Search.css";

const PRODUCT_API = "http://localhost:5000/api/products";
const CART_API = "http://localhost:5000/api/cart";

function Search() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [cartItems, setCartItems] = useState([]);

  const token = localStorage.getItem("token");

  const authHeader = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    fetchProducts();
    fetchCart();
  }, []);

  // ================= FETCH PRODUCTS =================
  const fetchProducts = async () => {
    try {
      const res = await axios.get(PRODUCT_API);
      setProducts(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= FETCH CART =================
  const fetchCart = async () => {
    try {
      const res = await axios.get(CART_API, authHeader);
      setCartItems(res.data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= SEARCH =================
  const handleSearch = async (e) => {
    const value = e.target.value;
    setQuery(value);

    const result = products.filter((product) =>
      product.name.toLowerCase().includes(value.toLowerCase()) ||
      product.category.toLowerCase().includes(value.toLowerCase())
    );

    setFiltered(result);

    // Save search to DB if user typed something
    if (value.trim().length > 1) {
      try {
        await axios.post(
          `${PRODUCT_API}/recent-search`,
          { query: value },
          authHeader
        );
      } catch (err) {
        console.error(err);
      }
    }
  };

  // ================= CHECK IF IN CART =================
  const isInCart = (productId) => {
    return cartItems.some(
      (item) => item.product._id === productId
    );
  };

  // ================= ADD TO CART =================
  const addToCart = async (productId) => {
    try {
      await axios.post(
        `${CART_API}/add`,
        { productId },
        authHeader
      );
      fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  // ================= REMOVE FROM CART =================
  const removeFromCart = async (productId) => {
    try {
      await axios.delete(
        `${CART_API}/remove`,
        {
          data: { productId },
          ...authHeader
        }
      );
      fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="search-page">
      <h2>Search Products</h2>

      <input
        type="text"
        placeholder="Search by name or category..."
        value={query}
        onChange={handleSearch}
        className="search-input"
      />

      <div className="product-grid">
        {filtered.map((product) => (
          <div
            className={`product-card ${
              expandedId === product._id ? "expanded" : ""
            }`}
            key={product._id}
            onClick={() => toggleExpand(product._id)}
          >
            <img src={product.image} alt={product.name} />
            <h3>{product.name}</h3>
            <p className="price">₹{product.price}</p>

            {expandedId === product._id && (
              <div className="extra-info">
                <p>{product.description}</p>
                <p>Category: {product.category}</p>
                <p>Stock: {product.stock}</p>
              </div>
            )}

            {isInCart(product._id) ? (
              <button
                className="remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromCart(product._id);
                }}
              >
                Remove
              </button>
            ) : (
              <button
                className="add-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(product._id);
                }}
              >
                Add to Cart
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Search;
