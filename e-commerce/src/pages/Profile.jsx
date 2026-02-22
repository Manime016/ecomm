import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Profile.css";

const ORDER_API = "http://localhost:5000/api/orders";
const USER_API = "http://localhost:5000/api/users";

function Profile() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  const userEmail = localStorage.getItem("email");
  const userPhone = localStorage.getItem("phone");

  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);

  const [showEdit, setShowEdit] = useState(false);
  const [emailChanged, setEmailChanged] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [resendCount, setResendCount] = useState(0);

  const [formData, setFormData] = useState({
    name: username || "",
    email: userEmail || "",
    phone: userPhone || "",
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // ✅ Proper auth axios
  const authAxios = axios.create({
    baseURL: "http://localhost:5000",
  });

  authAxios.interceptors.request.use((config) => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      config.headers.Authorization = `Bearer ${storedToken}`;
    }
    return config;
  });

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchOrders();
  }, []);

  // OTP countdown timer
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
      console.error(err);
    }
  };

  const cancelOrder = async (id) => {
    try {
      await authAxios.put(`/api/orders/${id}/cancel`);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || "Cannot cancel");
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

  // ✅ SEND OTP (FIXED)
  const sendOtp = async () => {
    if (resendCount >= 3) {
      alert("Maximum resend attempts reached");
      return;
    }

    try {
      const res = await authAxios.post("/api/users/send-otp");

      console.log("OTP:", res.data.otp); // testing only

      setOtpTimer(60);
      setResendCount((prev) => prev + 1);
      alert("OTP generated successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Unauthorized");
    }
  };

  // UPDATE PROFILE
  const updateProfile = async () => {
    if (
      passwordData.newPassword &&
      passwordData.newPassword !== passwordData.confirmPassword
    ) {
      alert("Passwords do not match");
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

      alert("Profile updated successfully");
      setShowEdit(false);
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    }
  };

  return (
    <div className="profile-container">

      {/* PROFILE HEADER */}
      <div className="profile-card">
        <div>
          <h2>{username}</h2>
          <p>Welcome back 👋</p>
        </div>

        <div className="profile-actions">
          <button onClick={() => setShowEdit(true)}>
            Edit Profile
          </button>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="profile-stats">
        <div className="stat-box">
          <h3>{orders.length}</h3>
          <p>Total Orders</p>
        </div>
        <div className="stat-box">
          <h3>₹{totalSpent}</h3>
          <p>Total Spent</p>
        </div>
        <div className="stat-box">
          <h3>
            {orders.filter((o) => o.orderStatus === "Delivered").length}
          </h3>
          <p>Delivered</p>
        </div>
      </div>

      <h3 className="section-title">My Orders</h3>

      {orders.length === 0 ? (
        <p>No orders yet</p>
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
                <p><strong>Order ID:</strong> {order._id}</p>
                <p>Total: ₹{order.totalAmount}</p>
              </div>

              <span className={`status ${order.orderStatus.toLowerCase().replace(/\s/g, "-")}`}>
                {order.orderStatus}
              </span>
            </div>

            {expandedOrder === order._id && (
              <div className="order-details">
                <div className="order-items">
                  {order.items.map((item, index) => (
                    <div key={index} className="order-item">
                      <img src={item.product.image} alt={item.product.name} />
                      <div>
                        <p>{item.product.name}</p>
                        <p>Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <p><strong>Tracking ID:</strong> {order.trackingId}</p>
                <p><strong>Payment Method:</strong> {order.paymentMethod}</p>

                <p>
                  <strong>Payment Status:</strong>{" "}
                  <span className={`payment-${order.paymentStatus?.toLowerCase()}`}>
                    {order.paymentStatus || "Pending"}
                  </span>
                </p>

                {order.paymentId && (
                  <p><strong>Payment ID:</strong> {order.paymentId}</p>
                )}

                <p><strong>Address:</strong> {order.address}</p>

                {order.orderStatus === "Processing" && (
                  <button
                    className="cancel-btn"
                    onClick={() => cancelOrder(order._id)}
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            )}
          </div>
        ))
      )}

      {/* EDIT PROFILE MODAL */}
      {showEdit && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Edit Profile</h2>

            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            <input
              type="text"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />

            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                setEmailChanged(true);
              }}
            />

            {emailChanged && (
              <>
                <button onClick={sendOtp} disabled={otpTimer > 0}>
                  {otpTimer > 0 ? `Resend in ${otpTimer}s` : "Send OTP"}
                </button>

                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </>
            )}

            <hr />
            <h3>Change Password</h3>

            <input
              type="password"
              placeholder="Old Password"
              value={passwordData.oldPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, oldPassword: e.target.value })
              }
            />

            <input
              type="password"
              placeholder="New Password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, newPassword: e.target.value })
              }
            />

            <input
              type="password"
              placeholder="Confirm New Password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, confirmPassword: e.target.value })
              }
            />

            <div className="modal-actions">
              <button onClick={updateProfile}>Save</button>
              <button onClick={() => setShowEdit(false)}>Cancel</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Profile;