import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem("token");
  });

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const login = (token, userInfo) => {
    console.log("✅ login() 호출됨");
    console.log("👉 userInfo:", userInfo);

    if (!userInfo || !userInfo.user_id || !userInfo.user_name) {
      console.error("❌ 유효하지 않은 사용자 정보입니다:", userInfo);
      return;
    }

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userInfo));
    setIsLoggedIn(true);
    setUser(userInfo);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUser(null);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsLoggedIn(true);
      } catch {
        console.warn("⚠️ user 파싱 실패");
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout, user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
