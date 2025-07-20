"use client";

import { useState } from "react";
import styles from "./login.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { login } = useAuth();

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch("https://myappapi-yo3p.onrender.com/login-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();
      console.log("🔍 Backend response:", data);

      if (!data.user) {
        throw new Error("User data missing in response");
      }

      login(data.user);
      setMessage(`Welcome, ${data.user.FullName}!`);

      setTimeout(() => {
        router.push("/Home");
      }, 1000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage(err.message);
      } else {
        setMessage("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.logincontainer}>
        <form onSubmit={submit}>
          <Image
            src="/img/hanover1.png"
            alt="Siza"
            className={`mb-2 ms-4 ${styles.img}`}
            width={100}
            height={100}
            priority
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
            Don&apos;t have an account?{" "}
            <Link href="/register" className={styles.redirectLink}>
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
