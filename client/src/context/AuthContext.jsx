import { useEffect, useState, createContext, useContext } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem("token");
  });

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // ✅ 로그인 함수 (기존 그대로 유지)
  const login = (token, userInfo) => {
    console.log("✅ login() 호출됨");
    console.log("👉 userInfo:", userInfo);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userInfo));
    sessionStorage.setItem("user", JSON.stringify(userInfo)); // 필수
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

    // 세션 없고 로컬에 있을 경우 복원
    if (!sessionUser && localUser) {
      sessionStorage.setItem("user", localUser);
    }

    // user 상태가 비어 있으면 localUser로 복원
    if (!user && localUser) {
      setUser(JSON.parse(localUser));
      setIsLoggedIn(true);
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
