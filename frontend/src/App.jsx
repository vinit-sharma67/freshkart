import React from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import ChatWidget from "./components/ChatWidget";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import { useStore } from "./context";

import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Help from "./pages/Help";
import Home from "./pages/Home";
import Invoice from "./pages/Invoice";
import Login from "./pages/Login";
import Orders from "./pages/Orders";
import OrderSuccess from "./pages/OrderSuccess";
import Product from "./pages/Product";
import Register from "./pages/Register";
import Wishlist from "./pages/Wishlist";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminOrders from "./pages/admin/AdminOrders";
import Coupons from "./pages/admin/Coupons";
import FeedbackAdmin from "./pages/admin/FeedbackAdmin";
import Dashboard from "./pages/admin/Dashboard";
import Settings from "./pages/admin/Settings";
import Users from "./pages/admin/Users";
import Vegetables from "./pages/admin/Vegetables";
import VegForm from "./pages/admin/VegForm";

function RequireAuth() {
  const { user } = useStore();
  const loc = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return <Outlet />;
}

function RequireAdmin() {
  const { user } = useStore();
  if (!user) return <Navigate to="/login" state={{ from: "/admin" }} replace />;
  if (!user.is_staff) return <Navigate to="/" replace />;
  return <Outlet />;
}

export default function App() {
  const loc = useLocation();
  const isAdmin = loc.pathname.startsWith("/admin");
  const isInvoice = loc.pathname.startsWith("/invoice");
  return (
    <>
      {!isAdmin && !isInvoice && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/vegetable/:id" element={<Product />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<RequireAuth />}>
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success/:id" element={<OrderSuccess />} />
          <Route path="/my-orders" element={<Orders />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/help" element={<Help />} />
          <Route path="/invoice/:id" element={<Invoice />} />
        </Route>
        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="vegetables" element={<Vegetables />} />
            <Route path="vegetables/new" element={<VegForm />} />
            <Route path="vegetables/:id" element={<VegForm />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="coupons" element={<Coupons />} />
            <Route path="feedback" element={<FeedbackAdmin />} />
            <Route path="users" element={<Users />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!isAdmin && !isInvoice && <Footer />}
      {!isAdmin && !isInvoice && <ChatWidget />}
    </>
  );
}
