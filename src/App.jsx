import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { UserProvider } from "./context/UserContext";
import { AlertProvider } from "./context/AlertContext";
import { ModalProvider } from "./context/ModalContext";
import LoadingPage from "./components/Global/LoadingPage";

// Lazy load all pages
const Home = lazy(() => import("./pages/Home"));
const Authentication = lazy(() => import("./pages/Authentication"));
const Profile = lazy(() => import("./pages/Profile"));
const Recharge = lazy(() => import("./pages/Recharge"));
const Charisma = lazy(() => import("./pages/Charisma"));
const Skin = lazy(() => import("./pages/Skin"));
const Admin = lazy(() => import("./pages/Admin"));
const Orders = lazy(() => import("./pages/Orders"));
const Queues = lazy(() => import("./pages/Queues"));
const Wallet = lazy(() => import("./pages/Wallet"));
const AdminOrders = lazy(() => import("./components/Admins/AdminOrders"));
const AdminTopups = lazy(() => import("./components/Admins/AdminTopups"));
const AdminQueues = lazy(() => import("./components/Admins/AdminQueues"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const MainLayout = lazy(() => import("./layouts/MainLayout"));
const AdminProducts = lazy(() => import("./components/Admins/AdminProducts"));
const AdminUsers = lazy(() => import("./components/Admins/AdminUsers"));
const AdminMessages = lazy(() => import("./components/Admins/AdminMessages"));
const AdminAccounts = lazy(() => import("./components/Admins/AdminAccounts"));
const AdminGameAccounts = lazy(() =>
  import("./components/Admins/AdminGameAccounts")
);
const NotFound = lazy(() => import("./pages/NotFound"));
const About = lazy(() => import("./pages/About"));
const Payment = lazy(() => import("./pages/Payment"));
const Messages = lazy(() => import("./pages/Messages"));
const RegionChecker = lazy(() => import("./pages/RegionChecker"));
const GameAccount = lazy(() => import("./pages/GameAccount"));
const MyAccounts = lazy(() => import("./pages/MyAccounts"));
const Browse = lazy(() => import("./pages/Browse"));
const App = () => {
  return (
    <UserProvider>
      <ModalProvider>
        <AlertProvider>
          <Router>
            <Suspense fallback={<LoadingPage />}>
              <Routes>
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Home />}></Route>
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
                  <Route path="*" element={<NotFound />} />
                </Route>

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
            </Suspense>
          </Router>
        </AlertProvider>
      </ModalProvider>
    </UserProvider>
  );
};

export default App;
