import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiSearch,
  FiShoppingCart,
  FiUser,
  FiSettings,
  FiLogOut
} from "react-icons/fi";

import "../styles/Dashboard.css";

function Sidebar() {
  return (
    <div className="sidebar">

      <h2 className="sidebar-logo">SHOPP111</h2>

      <nav className="sidebar-menu">

        <NavLink to="/Home" className="sidebar-link">
          <FiHome className="icon" />
          <span>Home</span>
        </NavLink>

        <NavLink to="/search" className="sidebar-link">
          <FiSearch className="icon" />
          <span>Search</span>
        </NavLink>

        <NavLink to="/cart" className="sidebar-link">
          <FiShoppingCart className="icon" />
          <span>Cart</span>
        </NavLink>

        <NavLink to="/Profile" className="sidebar-link">
          <FiUser className="icon" />
          <span>Profile</span>
        </NavLink>

        <NavLink to="/settings" className="sidebar-link">
          <FiSettings className="icon" />
          <span>Settings</span>
        </NavLink>

        <button
          className="logout-btn"
          onClick={() => {
            localStorage.clear();
            window.location.href = "/";
          }}
        >
          <FiLogOut className="icon" />
          Logout
        </button>

      </nav>
    </div>
  );
}

export default Sidebar;
