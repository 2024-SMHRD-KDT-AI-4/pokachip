import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // ✅ 추가

  const login = (newToken, userInfo) => {
    if (!userInfo || !userInfo.user_id || !userInfo.user_name) {
      console.error("❌ 유효하지 않은 사용자 정보입니다:", userInfo);
      return;
    }

    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userInfo));
    setIsLoggedIn(true);
    setUser(userInfo);
    setToken(newToken); // ✅ 추가
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUser(null);
    setToken(null); // ✅ 추가
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setIsLoggedIn(true);
        setUser(parsedUser);
        setToken(storedToken); // ✅ 추가
      } catch (err) {
        console.warn("user 파싱 오류", err);
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, user, token, login, logout }} // ✅ token 포함
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
