import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Cart.css";

const CART_API = "http://localhost:5000/api/cart";
const COUPON_API = "http://localhost:5000/api/coupons";
const ORDER_API = "http://localhost:5000/api/orders";

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

  const authAxios = axios.create({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    initializeCart();
  }, []);

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
    await authAxios.put(`${CART_API}/update`, {
      productId,
      quantity: qty,
    });
    fetchCart();
  };

  const removeItem = async (productId) => {
    await authAxios.delete(`${CART_API}/remove`, {
      data: { productId },
    });
    fetchCart();
  };

  const subtotal = cart.reduce(
    (total, item) =>
      total + item.product.price * item.quantity,
    0
  );

  const deliveryCharge = subtotal > 500 ? 0 : 50;
  const total = subtotal - discount + deliveryCharge;

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
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

      /* ================= COD FLOW ================= */
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

        alert("Order Placed Successfully!");
        navigate("/profile");
        return;
      }

      /* ================= RAZORPAY FLOW ================= */

      // 1️⃣ Create Razorpay Order
      const { data } = await authAxios.post(
        "http://localhost:5000/api/orders/razorpay",
        { amount: total }
      );

      const options = {
       key: "rzp_test_SJIccaYuzkmSVb", // 🔥 Replace with your Razorpay Key ID
        amount: data.amount,
        currency: data.currency,
        order_id: data.id,
        name: "Your Store",
        description: "Order Payment",
        handler: async function (response) {

          // 2️⃣ Verify payment
          await authAxios.post(
            "http://localhost:5000/api/orders/verify",
            response
          );

          // 3️⃣ Create actual order in DB
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

          alert("Payment Successful!");
          navigate("/profile");
        },
        theme: {
          color: "#3399cc",
        },
      };

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
              onClick={() => setShowCheckoutModal(true)}
            >
              Proceed to Checkout
            </button>
          </div>

        </div>
      )}

      {showCheckoutModal && (
        <div className="checkout-overlay">
          <div className="checkout-modal">
            <h2>Checkout</h2>

            <div className="address-grid">
              <input name="houseNumber" placeholder="House No *" onChange={handleAddressChange} />
              <input name="locality" placeholder="Locality *" onChange={handleAddressChange} />
              <input name="landmark" placeholder="Landmark" onChange={handleAddressChange} />
              <input name="district" placeholder="District *" onChange={handleAddressChange} />
              <input name="state" placeholder="State *" onChange={handleAddressChange} />
              <input name="pincode" placeholder="Pincode *" onChange={handleAddressChange} />
            </div>

            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="COD">Cash on Delivery</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Credit/Debit Card</option>
            </select>

            <div className="modal-buttons">
              <button onClick={handleCheckout} disabled={loading}>
                {loading ? "Processing..." : "Place Order"}
              </button>
              <button onClick={() => setShowCheckoutModal(false)}>Cancel</button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;