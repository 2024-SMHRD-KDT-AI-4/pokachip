import { useEffect, useState, createContext, useContext } from "react";

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

    // ✅ 유효성 체크
    if (!userInfo || !userInfo.user_id || !userInfo.user_name) {
      console.error("❌ 유효하지 않은 사용자 정보입니다:", userInfo);
      return;
    }

    const userJson = JSON.stringify(userInfo);
    localStorage.setItem("token", token);
    localStorage.setItem("user", userJson);
    sessionStorage.setItem("user", userJson);

    setIsLoggedIn(true);
    setUser(userInfo);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    setIsLoggedIn(false);
    setUser(null);
  };

  // ✅ 새로고침 없이도 user 정보 복원
  useEffect(() => {
    const sessionUser = sessionStorage.getItem("user");
    const localUser = localStorage.getItem("user");

    if (!sessionUser && localUser) {
      sessionStorage.setItem("user", localUser);
    }

    if (!user && localUser) {
      try {
        const parsed = JSON.parse(localUser);
        if (parsed.user_id && parsed.user_name) {
          setUser(parsed);
          setIsLoggedIn(true);
        } else {
          console.warn("⚠️ user 구조가 이상함:", parsed);
        }
      } catch (err) {
        console.error("❌ user 파싱 실패:", err);
      }
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout, user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
