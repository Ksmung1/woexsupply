import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import Home from "./pages/Home";
import Navbar from "./components/Global/Navbar";
import Authentication from "./pages/Authentication";
import Profile from "./pages/Profile";
import Recharge from "./pages/Recharge";
import { AlertProvider } from "./context/AlertContext";
import { ModalProvider } from "./context/ModalContext";
import Shortcut from "./components/Global/Shortcut";
import Admin from "./pages/Admin";
import Orders from "./pages/Orders";
import Wallet from "./pages/Wallet";
import AdminOrders from "./components/Admins/AdminOrders";
import AdminLayout from "./layouts/AdminLayout";
import MainLayout from "./layouts/MainLayout";
import AdminProducts from "./components/Admins/AdminProducts";
import AdminUsers from "./components/Admins/AdminUsers";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Payment from "./pages/Payment";
const App = () => {
  return (
    <UserProvider>
      <ModalProvider>
        <AlertProvider>
          <Router>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Home />}></Route>
                <Route path="orders" element={<Orders />} />
                <Route path="wallet" element={<Wallet />} />
                <Route path="login" element={<Authentication />} />
                <Route path="about" element={<About />} />
                <Route path="leaderboards" element={<Profile />} />
                <Route path="recharge/:gamename" element={<Recharge />} />
                <Route path="payment" element={<Payment />} />
                <Route
                  path="authentication-selection"
                  element={<Authentication />}
                />
                <Route path="*" element={<NotFound />} />
              </Route>

              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Admin />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="products" element={<AdminProducts />} />
              </Route>
            </Routes>
          </Router>
        </AlertProvider>
      </ModalProvider>
    </UserProvider>
  );
};

export default App;
