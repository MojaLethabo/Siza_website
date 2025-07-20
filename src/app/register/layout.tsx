// src/app/register/layout.tsx
import "./register.module.css"; // if you need global styles here

// src/app/login/layout.tsx
export const metadata = {
  title: "Register – Siza Admin",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
