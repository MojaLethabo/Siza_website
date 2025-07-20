"use client";

import { useState } from "react";
import styles from "./login.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { login } = useAuth(); // Get login function from context

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch("http://localhost:3000/login-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // First check response status
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();
      console.log("🔍 Backend response:", data);

      // Check if user data exists
      if (!data.user) {
        throw new Error("User data missing in response");
      }

      // Store the user object
      /*localStorage.setItem("admin", JSON.stringify(data.user));
      setMessage(`Welcome, ${data.user.FullName}!`);*/
      // Use context login instead of localStorage
      login(data.user);
      setMessage(`Welcome, ${data.user.FullName}!`);

      // Add delay for better UX
      setTimeout(() => {
        router.push("/Home");
      }, 1000);
    } catch (err: any) {
      console.error("❌ Login error:", err);
      setMessage(err.message || "Something went wrong. Please try again.");
    }
  };

  return (
  <div className={styles.wrapper}>
    <div className={styles.logincontainer}>
      <form onSubmit={submit}>
        <img
          src="img/hanover1.png"
          alt="Siza"
          className={`mb-2 ms-4 ${styles.img}`}
        />
        <h1>Siza Admin</h1>

        <input
          type="text"
          name="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Login</button>

        {message && (
          <div
            className={`mt-3 ${
              message.includes("Welcome") ? "text-success" : "text-danger"
            }`}
          >
            {message}
          </div>
        )}

        <p className={styles.redirectText}>
          Don't have an account?{" "}
          <Link href="/register" className={styles.redirectLink}>
            Register
          </Link>
        </p>
      </form>
    </div>
  </div>
);

}
