import { useLocation } from "react-router-dom";
import "../styles/Dashboard.css";

function Navbar() {

  const location = useLocation();

  const username = localStorage.getItem("username");

  const getPageTitle = () => {
    const path = location.pathname;

    if (path === "/Home") return "Home";
    if (path === "/search") return "Search";
    if (path === "/cart") return "Cart";
    if (path === "/Profile") return "Profile";
    if (path === "/settings") return "Settings";

    return "App";
  };

  return (
    <div className="navbar">

      {/* Dynamic Page Name */}
      <h3>{getPageTitle()}</h3>

      {/* User */}
      <div className="user">
        👤 {username ? username : "User"}
      </div>

    </div>
  );
}

export default Navbar;
