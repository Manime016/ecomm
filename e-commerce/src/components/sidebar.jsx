import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  return (
    <div className="sidebar">

      <h2 className="sidebar-logo">SHOPP111</h2>

      <nav className="sidebar-menu">

        <NavLink to="/dashboard" className="sidebar-link">
          <FiHome className="icon" />
          <span>{t("navbar.home")}</span>
        </NavLink>

        <NavLink to="/search" className="sidebar-link">
          <FiSearch className="icon" />
          <span>{t("navbar.search")}</span>
        </NavLink>

        <NavLink to="/cart" className="sidebar-link">
          <FiShoppingCart className="icon" />
          <span>{t("navbar.cart")}</span>
        </NavLink>

        <NavLink to="/profile" className="sidebar-link">
          <FiUser className="icon" />
          <span>{t("navbar.profile")}</span>
        </NavLink>

        <NavLink to="/settings" className="sidebar-link">
          <FiSettings className="icon" />
          <span>{t("navbar.settings")}</span>
        </NavLink>

        <button
          className="logout-btn"
          onClick={() => {
            localStorage.clear();
            window.location.href = "/";
          }}
        >
          <FiLogOut className="icon" />
          {t("navbar.logout")}
        </button>

      </nav>
    </div>
  );
}

export default Sidebar;