import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Cart.css";

const BASE_URL = import.meta.env.VITE_API_URL;
const CART_API = `${BASE_URL}/api/cart`;
const COUPON_API = `${BASE_URL}/api/coupons`;
const ORDER_API = `${BASE_URL}/api/orders`;

function Cart() {
  const navigate = useNavigate();
  const location = useLocation();

  const [cart, setCart] = useState([]);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const [address, setAddress] = useState({
    houseNumber: "",
    locality: "",
    landmark: "",
    district: "",
    state: "",
    pincode: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("COD");

  const token = localStorage.getItem("token");

  const authAxios = useMemo(() => {
    return axios.create({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    initializeCart();
  }, [token]);

  const initializeCart = async () => {
    await fetchCart();
    await fetchCoupons();

    const params = new URLSearchParams(location.search);
    if (params.get("checkout") === "true") {
      setShowCheckoutModal(true);
    }
  };

  const fetchCart = async () => {
    try {
      const res = await authAxios.get(CART_API);
      setCart(res.data.items || []);
    } catch (err) {
      handleAuthError(err);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await authAxios.get(COUPON_API);
      setAvailableCoupons(res.data || []);
    } catch (err) {
      handleAuthError(err);
    }
  };

  const handleAuthError = (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      navigate("/");
    }
  };

  const updateQuantity = async (productId, qty) => {
    if (qty < 1) return;
    try {
      await authAxios.put(`${CART_API}/update`, {
        productId,
        quantity: qty,
      });
      fetchCart();
    } catch (err) {
      handleAuthError(err);
    }
  };

  const removeItem = async (productId) => {
    try {
      await authAxios.delete(`${CART_API}/remove`, {
        data: { productId },
      });
      fetchCart();
    } catch (err) {
      handleAuthError(err);
    }
  };

  const subtotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const deliveryCharge = subtotal > 500 ? 0 : 50;
  const total = subtotal - discount + deliveryCharge;

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckout = async () => {
    if (
      !address.houseNumber ||
      !address.locality ||
      !address.district ||
      !address.state ||
      !address.pincode
    ) {
      alert("Please fill all required address fields");
      return;
    }

    if (!/^[0-9]{6}$/.test(address.pincode)) {
      alert("Enter valid 6-digit pincode");
      return;
    }

    try {
      setLoading(true);

      /* ================= COD ================= */
      if (paymentMethod === "COD") {
        await authAxios.post(ORDER_API, {
          items: cart,
          subtotal,
          discount,
          deliveryCharge,
          totalAmount: total,
          couponUsed: selectedCoupon,
          paymentMethod,
          address,
        });

        // Clear Cart After Order
        await authAxios.delete(`${CART_API}/clear`);

        alert("Order Placed Successfully!");
        navigate("/profile");
        return;
      }

      /* ================= RAZORPAY ================= */

      const { data } = await authAxios.post(
        `${ORDER_API}/razorpay`,
        { amount: total }
      );

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount: data.amount,
        currency: data.currency,
        order_id: data.id,
        name: "Your Store",
        description: "Order Payment",
        handler: async function (response) {
          await authAxios.post(`${ORDER_API}/verify`, {
            ...response,
          });

          await authAxios.post(ORDER_API, {
            items: cart,
            subtotal,
            discount,
            deliveryCharge,
            totalAmount: total,
            couponUsed: selectedCoupon,
            paymentMethod,
            address,
          });

          // Clear Cart After Order
          await authAxios.delete(`${CART_API}/clear`);

          alert("Payment Successful!");
          navigate("/profile");
        },
        theme: { color: "#3399cc" },
      };

      // Razorpay Safety Check
      if (!window.Razorpay) {
        alert("Payment SDK not loaded. Please refresh.");
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error(err);
      alert("Payment Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cart-container">
      <h2>My Cart</h2>

      {cart.length === 0 ? (
        <div className="empty-cart">
          <h3>Your cart is empty</h3>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cart.map((item) => (
              <div className="cart-item" key={item.product._id}>
                <img src={item.product.image} alt="" />
                <div className="item-info">
                  <h4>{item.product.name}</h4>
                  <p>₹{item.product.price}</p>
                  <div className="qty-control">
                    <button onClick={() => updateQuantity(item.product._id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product._id, item.quantity + 1)}>+</button>
                  </div>
                </div>
                <div className="item-total">
                  ₹{item.product.price * item.quantity}
                  <button onClick={() => removeItem(item.product._id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3>Order Summary</h3>
            <p>Subtotal: ₹{subtotal}</p>
            <p>Discount: -₹{discount}</p>
            <p>Delivery: ₹{deliveryCharge}</p>
            <hr />
            <h2>Total: ₹{total}</h2>

            <button
              className="checkout-btn"
              disabled={loading}
              onClick={() => setShowCheckoutModal(true)}
            >
              {loading ? "Processing..." : "Proceed to Checkout"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;