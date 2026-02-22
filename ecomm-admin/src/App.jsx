import { BrowserRouter, Routes, Route } from "react-router-dom";
import AddProduct from "./pages/AddProduct";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AddProduct />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
