import { BrowserRouter, Routes, Route } from "react-router-dom";
import AddProduct from "./pages/AddProduct";
import MyProducts from "./pages/MyProducts";
import "./App.css";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Add Product Page */}
        <Route path="/" element={<AddProduct />} />

        {/* My Products Page */}
        <Route path="/my-products" element={<MyProducts />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;