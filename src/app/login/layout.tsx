// src/app/login/layout.tsx
import "./login.module.css";

export const metadata = {
  title: "Login – Siza Admin",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
