import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api";

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

export function StoreProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fk_user")) || null; }
    catch { return null; }
  });
  const [cartCount, setCartCount] = useState(0);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [config, setConfig] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "ok") => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast((t) => (t && Date.now() - t.id >= 2900 ? null : t)), 3000);
  }, []);

  const loginUser = useCallback((data) => {
    localStorage.setItem("fk_token", data.token);
    localStorage.setItem("fk_user", JSON.stringify(data));
    setUser(data);
  }, []);

  const logoutUser = useCallback(async () => {
    try { await api.post("/auth/logout/"); } catch { /* already invalid */ }
    localStorage.removeItem("fk_token");
    localStorage.removeItem("fk_user");
    setUser(null);
    setCartCount(0);
    setWishlistIds([]);
  }, []);

  // Re-fetch the profile so loyalty points etc. never go stale
  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem("fk_token")) return;
    try {
      const d = await api.get("/auth/me/");
      localStorage.setItem("fk_user", JSON.stringify(d));
      setUser(d);
    } catch (e) {
      if (e.status === 401) {          // token revoked — clean up
        localStorage.removeItem("fk_token");
        localStorage.removeItem("fk_user");
        setUser(null);
      }
    }
  }, []);

  const refreshCart = useCallback(async () => {
    if (!localStorage.getItem("fk_token")) return;
    try {
      const d = await api.get("/cart/");
      setCartCount(d.count);
    } catch { /* ignore */ }
  }, []);

  const refreshWishlist = useCallback(async () => {
    if (!localStorage.getItem("fk_token")) return;
    try {
      const d = await api.get("/wishlist/");
      setWishlistIds(d.ids);
    } catch { /* ignore */ }
  }, []);

  const toggleWishlist = useCallback(async (vegId) => {
    if (!user) { showToast("Please login to use your wishlist.", "warn"); return; }
    try {
      const d = await api.post("/wishlist/toggle/", { veg_id: vegId });
      setWishlistIds(d.ids);
      showToast(d.added ? "Added to wishlist ❤️" : "Removed from wishlist.");
    } catch (e) { showToast(e.message, "warn"); }
  }, [user, showToast]);

  useEffect(() => {
    api.get("/config/").then(setConfig).catch(() => {});
    if (user) { refreshUser(); refreshCart(); refreshWishlist(); }
  }, []); // eslint-disable-line

  // Fired by api.js when the server rejects our token — reset to logged-out.
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setCartCount(0);
      setWishlistIds([]);
      showToast("Your session expired — please login again.", "warn");
    };
    window.addEventListener("fk-session-expired", onExpired);
    return () => window.removeEventListener("fk-session-expired", onExpired);
  }, [showToast]);

  return (
    <StoreContext.Provider value={{
      user, loginUser, logoutUser, refreshUser,
      cartCount, setCartCount, refreshCart,
      wishlistIds, toggleWishlist, refreshWishlist,
      config, showToast,
    }}>
      {children}
      {toast && (
        <div className={`toast toast-${toast.type}`} key={toast.id}>{toast.message}</div>
      )}
    </StoreContext.Provider>
  );
}
