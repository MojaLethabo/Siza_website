"use client";

import { useState } from "react";
import styles from "./register.module.css";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) return alert("You must accept the terms.");
    if (password !== confirmPassword) return alert("Passwords don't match.");

    try {
      const response = await fetch("http://localhost:3000/register-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          password,
          phoneNumber,
          imageBase64: image,
          acceptedTerms: accepted ? "Yes" : "No",
        }),
      });

      if (response.ok) {
        alert("Registration successful");
        router.push("/login");
      } else {
        const data = await response.json();
        alert(data.message || "Registration failed");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div
      className={styles.registercontainer}
      style={{ overflowY: "auto", maxHeight: "100vh" }}
    >
      <form onSubmit={submit} className={styles.form}>
        <img
          src="img/hanover1.png"
          alt="Siza"
          className={`mb-2 ms-5 ${styles.img}`}
        />
        <h1>Create Account</h1>

        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <input
          type="tel"
          placeholder="Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
        />

        <div className="mb-3">
          <label className="form-label">Profile Photo</label>
          <input type="file" accept="image/*" onChange={handleFile} />
        </div>

        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="termsCheck"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="termsCheck">
            I accept the{" "}
            <span
              className="text-primary"
              style={{ cursor: "pointer" }}
              onClick={() => setShowTerms(true)}
            >
              Terms & Conditions
            </span>
          </label>
        </div>

        <button type="submit" className={styles.button} disabled={!accepted}>
          Register
        </button>

        <p className={styles.redirectText}>
          Already have an account?{" "}
          <Link href="/login" className={styles.redirectLink}>
            Login
          </Link>
        </p>
      </form>

      {showTerms && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowTerms(false)}
        >
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "80vh", overflowY: "auto" }}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Terms & Conditions</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowTerms(false)}
                />
              </div>
              <div className="modal-body">
                {/* Your terms content here */}
                <p>Here are the terms and conditions...</p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowTerms(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
