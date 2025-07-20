// context/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  UserID: number;
  FullName: string;
  Email: string;
  Username: string;
  PhoneNumber: string;
  ProfilePhoto: string;
  DarkMode?: string;
  Role?: string;
  UserType: string;
  DOB?: string;
  HomeAddress?: string;
  TrustedContacts?: String;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  updateUser: (newData: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Initialize from localStorage on mount
    const storedUser = localStorage.getItem("admin");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
        localStorage.removeItem("admin");
      }
    }
  }, []);

  const login = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem("admin", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("admin");
  };

  const updateUser = (newData: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...newData };
    setUser(updatedUser);
    localStorage.setItem("admin", JSON.stringify(updatedUser));
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
