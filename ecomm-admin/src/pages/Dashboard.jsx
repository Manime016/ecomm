import { useState } from "react";
import AddProduct from "./AddProduct";
import MyProducts from "./MyProducts";
import "../App.css";

function Dashboard() {
  const [activePage, setActivePage] = useState("add"); // ✅ default

  return (
    <div className="dashboard-wrapper">

      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <h3>Admin Panel</h3>

        <button
          className={activePage === "add" ? "active" : ""}
          onClick={() => setActivePage("add")}
        >
          Add Product
        </button>

        <button
          className={activePage === "products" ? "active" : ""}
          onClick={() => setActivePage("products")}
        >
          My Products
        </button>
      </div>

      {/* Content Area */}
      <div className="dashboard-content">
        {activePage === "add" && <AddProduct />}
        {activePage === "products" && <MyProducts />}
      </div>

    </div>
  );
}

export default Dashboard;