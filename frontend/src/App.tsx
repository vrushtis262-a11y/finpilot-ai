import { Route, Routes } from "react-router";
import AddTransaction from "./pages/AddTransaction";
import Dashboard from "./pages/Dashboard";
import EditTransaction from "./pages/EditTransaction";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ScanReceipt from "./pages/ScanReceipt";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route
        path="/add-transaction"
        element={<AddTransaction />}
      />
      <Route
        path="/edit-transaction/:id"
        element={<EditTransaction />}
      />
      <Route
        path="/scan-receipt"
        element={<ScanReceipt />}
      />
    </Routes>
  );
}

export default App;