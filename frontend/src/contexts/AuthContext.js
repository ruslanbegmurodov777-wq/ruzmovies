import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import api, { loginUser, registerUser, getProfile } from "../utils/api"; // Use your api instance

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  // Set axios default header if token exists
  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = useCallback(async () => {
    try {
      const userData = await getProfile();
      setUser(userData);
    } catch (error) {
      // Silently handle error to avoid console pollution
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email, password) => {
      try {
        const response = await loginUser({ email, password });
        const newToken = response.data;

        localStorage.setItem("token", newToken);
        setToken(newToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

        await fetchUser();
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error.response?.data?.message || "Login failed",
        };
      }
    },
    [fetchUser]
  );

  const register = useCallback(
    async (userData) => {
      try {
        const response = await registerUser(userData);
        const newToken = response.data;

        localStorage.setItem("token", newToken);
        setToken(newToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

        await fetchUser();
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error.response?.data?.message || "Registration failed",
        };
      }
    },
    [fetchUser]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common["Authorization"];
  }, []);

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: !!user?.isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};