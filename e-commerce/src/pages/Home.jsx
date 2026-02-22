import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

const PRODUCT_API = "http://localhost:5000/api/products";
const CART_API = "http://localhost:5000/api/cart";

function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [products, setProducts] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [cartItems, setCartItems] = useState([]);

  const authAxios = axios.create({
    headers: { Authorization: `Bearer ${token}` },
  });

  useEffect(() => {
    fetchProducts();
    if (token) fetchCart();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(PRODUCT_API);
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCart = async () => {
    try {
      const res = await authAxios.get(CART_API);
      setCartItems(res.data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getQuantity = (id) => {
    const item = cartItems.find(
      (i) => i.product._id === id
    );
    return item ? item.quantity : 0;
  };

  const addToCart = async (productId) => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      await authAxios.post(`${CART_API}/add`, {
        productId,
      });
      fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  const updateQty = async (productId, qty) => {
    if (qty < 1) return;

    try {
      await authAxios.put(`${CART_API}/update`, {
        productId,
        quantity: qty,
      });
      fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  // 🔥 BUY NOW LOGIC (Auto Checkout Trigger)
  const handleBuyNow = async (productId) => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      await authAxios.post(`${CART_API}/add`, {
        productId,
      });

      navigate("/cart?checkout=true");

    } catch (err) {
      console.error(err);
    }
  };

  const categories = [...new Set(products.map(p => p.category))];

  const ProductCard = ({ item }) => {
    const quantity = getQuantity(item._id);
    const isExpanded = expanded[item._id];

    return (
      <div
        className={`product-card ${isExpanded ? "expanded" : ""}`}
        onClick={() =>
          setExpanded(prev => ({
            ...prev,
            [item._id]: !prev[item._id]
          }))
        }
      >
        {item.stock === 0 && (
          <div className="out-of-stock-overlay">
            Out of Stock
          </div>
        )}

        <img src={item.image} alt={item.name} />

        <h4>{item.name}</h4>
        <p className="price">₹{item.price}</p>

        {isExpanded && (
          <div className="extra-info">
            <p>{item.description}</p>
            <p>Stock: {item.stock}</p>
          </div>
        )}

        {item.stock > 0 && (
          quantity === 0 ? (
            <button
              className="cart-btn"
              onClick={(e) => {
                e.stopPropagation();
                addToCart(item._id);
              }}
            >
              Add to Cart
            </button>
          ) : (
            <div
              className="qty-controls"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() =>
                  updateQty(item._id, quantity - 1)
                }
              >
                -
              </button>
              <span>{quantity}</span>
              <button
                onClick={() =>
                  updateQty(item._id, quantity + 1)
                }
              >
                +
              </button>
            </div>
          )
        )}

        {/* BUY NOW BUTTON */}
        <button
          className="buy-now-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleBuyNow(item._id);
          }}
        >
          Buy Now
        </button>
      </div>
    );
  };

  return (
    <>
      {/* HERO SLIDER */}
      <div className="hero-banner">
        <div className="hero-slides">
          {[1,2,3,4,5,1,2,3,4,5].map((n, i) => (
            <div key={i} className={`hero-slide slide${n}`}></div>
          ))}
        </div>
        <div className="hero-text">SHOPP111</div>
      </div>

      {/* CATEGORY SECTIONS */}
      {categories.map((cat) => {
        const filtered = products.filter(p => p.category === cat);
        const isExpandedCat = expanded[cat];

        return (
          <div className="section" key={cat}>
            <h2>{cat}</h2>

            <div className="product-grid">
              {(isExpandedCat ? filtered : filtered.slice(0, 4)).map(item => (
                <ProductCard key={item._id} item={item} />
              ))}
            </div>

            {filtered.length > 5 && (
              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <button
                  className="show-more-btn"
                  onClick={() =>
                    setExpanded(prev => ({
                      ...prev,
                      [cat]: !prev[cat]
                    }))
                  }
                >
                  {isExpandedCat ? "Show Less" : "Show More"}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

export default Dashboard;
