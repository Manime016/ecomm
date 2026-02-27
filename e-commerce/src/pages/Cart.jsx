import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../styles/Cart.css";

const BASE_URL = import.meta.env.VITE_API_URL;
const CART_API = `${BASE_URL}/api/cart`;
const ORDER_API = `${BASE_URL}/api/orders`;

function Cart() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [cart, setCart] = useState([]);
  const [discount] = useState(0);
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
      headers: { Authorization: `Bearer ${token}` },
    });
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchCart();
  }, [token]);

  const fetchCart = async () => {
    try {
      const res = await authAxios.get(CART_API);
      setCart(res.data.items || []);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate("/");
      }
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
      alert(t("cart.fillAddress"));
      return;
    }

    if (!/^[0-9]{6}$/.test(address.pincode)) {
      alert(t("cart.invalidPincode"));
      return;
    }

    try {
      setLoading(true);

      if (paymentMethod === "COD") {
        await authAxios.post(ORDER_API, {
          items: cart,
          subtotal,
          discount,
          deliveryCharge,
          totalAmount: total,
          paymentMethod,
          address,
        });

        await authAxios.delete(`${CART_API}/clear`);

        alert(t("cart.orderPlaced"));
        navigate("/profile");
        return;
      }

      alert(t("cart.paymentFailed"));
    } catch (err) {
      console.error(err);
      alert(t("cart.paymentFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cart-container">
      <h2>{t("cart.title")}</h2>

      {cart.length === 0 ? (
        <div className="empty-cart">
          <h3>{t("cart.empty")}</h3>
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
                  <button onClick={() => removeItem(item.product._id)}>
                    {t("cart.remove")}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3>{t("cart.orderSummary")}</h3>
            <p>{t("cart.subtotal")}: ₹{subtotal}</p>
            <p>{t("cart.delivery")}: ₹{deliveryCharge}</p>
            <hr />
            <h2>{t("cart.total")}: ₹{total}</h2>

            <button
              className="checkout-btn"
              disabled={loading}
              onClick={() => setShowCheckoutModal(true)}
            >
              {loading
                ? t("cart.processing")
                : t("cart.checkout")}
            </button>
          </div>
        </div>
      )}

      {showCheckoutModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{t("cart.checkout")}</h2>

            <h3>{t("cart.deliveryAddress")}</h3>

            <input name="houseNumber" placeholder={t("cart.houseNumber")} onChange={handleAddressChange} />
            <input name="locality" placeholder={t("cart.locality")} onChange={handleAddressChange} />
            <input name="landmark" placeholder={t("cart.landmark")} onChange={handleAddressChange} />
            <input name="district" placeholder={t("cart.district")} onChange={handleAddressChange} />
            <input name="state" placeholder={t("cart.state")} onChange={handleAddressChange} />
            <input name="pincode" placeholder={t("cart.pincode")} onChange={handleAddressChange} />

            <h3>{t("cart.paymentMethod")}</h3>

            <label>
              <input type="radio" value="COD"
                checked={paymentMethod === "COD"}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              {t("cart.cod")}
            </label>

            <div className="modal-actions">
              <button onClick={handleCheckout} disabled={loading}>
                {loading
                  ? t("cart.processing")
                  : t("cart.placeOrder")}
              </button>

              <button onClick={() => setShowCheckoutModal(false)}>
                {t("cart.cancel")}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;