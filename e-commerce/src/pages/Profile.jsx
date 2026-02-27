import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../styles/Profile.css";

const BASE_URL = import.meta.env.VITE_API_URL;

function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [emailChanged, setEmailChanged] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [resendCount, setResendCount] = useState(0);

  const [formData, setFormData] = useState({
    name: localStorage.getItem("username") || "",
    email: localStorage.getItem("email") || "",
    phone: localStorage.getItem("phone") || "",
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const authAxios = useMemo(() => {
    return axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Bearer ${token}` },
    });
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchOrders();
  }, [token]);

  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const fetchOrders = async () => {
    try {
      const res = await authAxios.get("/api/orders");
      setOrders(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate("/login");
      }
    }
  };

  const cancelOrder = async (id) => {
    try {
      await authAxios.put(`/api/orders/${id}/cancel`);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || t("profile.cannotCancel"));
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const totalSpent = orders.reduce(
    (sum, order) => sum + order.totalAmount,
    0
  );

  const sendOtp = async () => {
    if (resendCount >= 3) {
      alert(t("profile.maxOtp"));
      return;
    }

    try {
      await authAxios.post("/api/users/send-otp");
      setOtpTimer(60);
      setResendCount((prev) => prev + 1);
      alert(t("profile.otpSent"));
    } catch (err) {
      alert(err.response?.data?.message || t("profile.unauthorized"));
    }
  };

  const updateProfile = async () => {
    if (
      passwordData.newPassword &&
      passwordData.newPassword !== passwordData.confirmPassword
    ) {
      alert(t("profile.passwordMismatch"));
      return;
    }

    try {
      await authAxios.put("/api/users/update-profile", {
        ...formData,
        otp: emailChanged ? otp : null,
        oldPassword: passwordData.oldPassword || null,
        newPassword: passwordData.newPassword || null,
      });

      localStorage.setItem("username", formData.name);
      localStorage.setItem("email", formData.email);
      localStorage.setItem("phone", formData.phone);

      alert(t("profile.updated"));
      setShowEdit(false);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || t("profile.updateFailed"));
    }
  };

  return (
    <div className="profile-container">

      <div className="profile-card">
        <div>
          <h2>{formData.name}</h2>
          <p>{t("profile.welcome")}</p>
        </div>

        <div className="profile-actions">
          <button onClick={() => setShowEdit(true)}>
            {t("profile.edit")}
          </button>
          <button onClick={logout} className="logout-btn">
            {t("profile.logout")}
          </button>
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat-box">
          <h3>{orders.length}</h3>
          <p>{t("profile.totalOrders")}</p>
        </div>
        <div className="stat-box">
          <h3>₹{totalSpent}</h3>
          <p>{t("profile.totalSpent")}</p>
        </div>
        <div className="stat-box">
          <h3>
            {orders.filter((o) => o.orderStatus === "Delivered").length}
          </h3>
          <p>{t("profile.delivered")}</p>
        </div>
      </div>

      <h3 className="section-title">{t("profile.myOrders")}</h3>

      {orders.length === 0 ? (
        <p>{t("profile.noOrders")}</p>
      ) : (
        orders.map((order) => (
          <div key={order._id} className="order-card">

            <div
              className="order-header"
              onClick={() =>
                setExpandedOrder(
                  expandedOrder === order._id ? null : order._id
                )
              }
            >
              <div>
                <p><strong>{t("profile.orderId")}:</strong> {order._id}</p>
                <p>{t("profile.total")}: ₹{order.totalAmount}</p>
              </div>

              <span className="status">{order.orderStatus}</span>
            </div>

            {expandedOrder === order._id && (
              <div className="order-details">
                {order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <img src={item.product.image} alt={item.product.name} />
                    <div>
                      <p>{item.product.name}</p>
                      <p>{t("profile.qty")}: {item.quantity}</p>
                    </div>
                  </div>
                ))}

                <p><strong>{t("profile.tracking")}:</strong> {order.trackingId}</p>
                <p><strong>{t("profile.paymentMethod")}:</strong> {order.paymentMethod}</p>
                <p><strong>{t("profile.paymentStatus")}:</strong> {order.paymentStatus || t("profile.pending")}</p>
                {order.paymentId && <p><strong>{t("profile.paymentId")}:</strong> {order.paymentId}</p>}
                <p><strong>{t("profile.address")}:</strong> {order.address}</p>

                {order.orderStatus === "Processing" && (
                  <button
                    className="cancel-btn"
                    onClick={() => cancelOrder(order._id)}
                  >
                    {t("profile.cancelOrder")}
                  </button>
                )}
              </div>
            )}
          </div>
        ))
      )}

      {showEdit && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{t("profile.edit")}</h2>

            <input
              type="text"
              placeholder={t("profile.name")}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            <input
              type="text"
              placeholder={t("profile.phone")}
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />

            <input
              type="email"
              placeholder={t("profile.email")}
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                setEmailChanged(true);
              }}
            />

            {emailChanged && (
              <>
                <button onClick={sendOtp} disabled={otpTimer > 0}>
                  {otpTimer > 0
                    ? `${t("profile.resendIn")} ${otpTimer}s`
                    : t("profile.sendOtp")}
                </button>

                <input
                  type="text"
                  placeholder={t("profile.enterOtp")}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </>
            )}

            <hr />
            <h3>{t("profile.changePassword")}</h3>

            <input
              type="password"
              placeholder={t("profile.oldPassword")}
              value={passwordData.oldPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, oldPassword: e.target.value })
              }
            />

            <input
              type="password"
              placeholder={t("profile.newPassword")}
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, newPassword: e.target.value })
              }
            />

            <input
              type="password"
              placeholder={t("profile.confirmPassword")}
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, confirmPassword: e.target.value })
              }
            />

            <div className="modal-actions">
              <button onClick={updateProfile}>
                {t("profile.save")}
              </button>
              <button onClick={() => setShowEdit(false)}>
                {t("profile.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Profile;