import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Search.css";

const BASE_URL = import.meta.env.VITE_API_URL;
const PRODUCT_API = `${BASE_URL}/api/products`;
const CART_API = `${BASE_URL}/api/cart`;

function Search() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [cartItems, setCartItems] = useState([]);

  const token = localStorage.getItem("token");

  const authAxios = useMemo(() => {
    return axios.create({
      headers: { Authorization: `Bearer ${token}` },
    });
  }, [token]);

  useEffect(() => {
    fetchProducts();
    if (token) fetchCart();
  }, [token]);

  const handleAuthError = (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      navigate("/login");
    }
  };

  // ================= FETCH PRODUCTS =================
  const fetchProducts = async () => {
    try {
      const res = await axios.get(PRODUCT_API);
      setProducts(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error("Product fetch error:", err);
    }
  };

  // ================= FETCH CART =================
  const fetchCart = async () => {
    try {
      const res = await authAxios.get(CART_API);
      setCartItems(res.data.items || []);
    } catch (err) {
      handleAuthError(err);
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

    if (value.trim().length > 1 && token) {
      try {
        await authAxios.post(`${PRODUCT_API}/recent-search`, {
          query: value,
        });
      } catch (err) {
        console.error("Recent search error:", err);
      }
    }
  };

  const isInCart = (productId) => {
    return cartItems.some(
      (item) => item.product._id === productId
    );
  };

  const addToCart = async (productId) => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      await authAxios.post(`${CART_API}/add`, { productId });
      fetchCart();
    } catch (err) {
      handleAuthError(err);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await authAxios.delete(`${CART_API}/remove`, {
        data: { productId },
      });
      fetchCart();
    } catch (err) {
      handleAuthError(err);
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