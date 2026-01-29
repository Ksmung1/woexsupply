import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import { AlertProvider } from "./context/AlertContext";
import { ModalProvider } from "./context/ModalContext";
import { ThemeProvider } from "./context/ThemeContext";
import MaintenanceGuard from "./pages/MaintenanceGuard";
import Maintenance from "./pages/Maintenance";

// Import all pages directly (non-lazy)
import Home from "./pages/Home";
import Authentication from "./pages/Authentication";
import Profile from "./pages/Profile";
import Recharge from "./pages/Recharge";
import Charisma from "./pages/Charisma";
import Skin from "./pages/Skin";
import Admin from "./pages/Admin";
import Orders from "./pages/Orders";
import Queues from "./pages/Queues";
import Wallet from "./pages/Wallet";
import AdminOrders from "./components/Admins/AdminOrders";
import AdminTopups from "./components/Admins/AdminTopups";
import AdminQueues from "./components/Admins/AdminQueues";
import AdminLayout from "./layouts/AdminLayout";
import MainLayout from "./layouts/MainLayout";
import AdminProducts from "./components/Admins/AdminProducts";
import AdminUsers from "./components/Admins/AdminUsers";
import AdminMessages from "./components/Admins/AdminMessages";
import AdminAccounts from "./components/Admins/AdminAccounts";
import AdminGameAccounts from "./components/Admins/AdminGameAccounts";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Payment from "./pages/Payment";
import Messages from "./pages/Messages";
import RegionChecker from "./pages/RegionChecker";
import GameAccount from "./pages/GameAccount";
import MyAccounts from "./pages/MyAccounts";
import Browse from "./pages/Browse";

const App = () => {
  return (
    <ThemeProvider>
      <UserProvider>
        <ModalProvider>
          <AlertProvider>
            <Router>
              <Routes>
                {/* 🚧 Maintenance Page */}
                <Route path="/maintenance" element={<Maintenance />} />

                {/* 🌍 PUBLIC / USER ROUTES (GUARDED) */}
                <Route
                  path="/"
                  element={
                    <MaintenanceGuard>
                      <MainLayout />
                    </MaintenanceGuard>
                  }
                >
                  <Route index element={<Home />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="accounts" element={<MyAccounts />} />
                  <Route path="browse" element={<Browse />} />
                  <Route path="game-acc" element={<GameAccount />} />
                  <Route path="region-checker" element={<RegionChecker />} />
                  <Route path="queues" element={<Queues />} />
                  <Route path="wallet" element={<Wallet />} />
                  <Route path="messages" element={<Messages />} />
                  <Route path="login" element={<Authentication />} />
                  <Route path="about" element={<About />} />
                  <Route path="leaderboards" element={<Profile />} />
                  <Route path="recharge/:gamename" element={<Recharge />} />
                  <Route path="charisma" element={<Charisma />} />
                  <Route path="skin" element={<Skin />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="payment" element={<Payment />} />
                  <Route
                    path="authentication-selection"
                    element={<Authentication />}
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>

                {/* 🔐 ADMIN ROUTES (NOT GUARDED) */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Admin />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="topups" element={<AdminTopups />} />
                  <Route path="queues" element={<AdminQueues />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="accounts" element={<AdminAccounts />} />
                  <Route path="game-accounts" element={<AdminGameAccounts />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="messages" element={<AdminMessages />} />
                </Route>
              </Routes>
            </Router>
          </AlertProvider>
        </ModalProvider>
      </UserProvider>
    </ThemeProvider>
  );
};

export default App;
