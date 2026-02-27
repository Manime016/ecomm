import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../styles/Dashboard.css";

function Navbar() {
  const location = useLocation();
  const { t } = useTranslation();

  const username = localStorage.getItem("username");

  const getPageTitle = () => {
    const path = location.pathname;

    if (path === "/dashboard") return t("navbar.home");
    if (path === "/search") return t("navbar.search");
    if (path === "/cart") return t("navbar.cart");
    if (path === "/profile") return t("navbar.profile");
    if (path === "/settings") return t("navbar.settings");

    return "App";
  };

  return (
    <div className="navbar">
      <h3>{getPageTitle()}</h3>

      <div className="user">
        👤 {username ? username : t("navbar.user")}
      </div>
    </div>
  );
}

export default Navbar;