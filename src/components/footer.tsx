// components/footer.js
"use client";
import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="footer bg-light py-3 border-top mt-auto"
      style={{ flexShrink: 0 }}
    >
      <div className="container-fluid">
        <div className="d-flex flex-wrap justify-content-between align-items-center">
          {/* Left navigation */}
          <nav>
            <ul className="nav">
              <li className="nav-item">
                <Link href="/home" className="nav-link">
                  Home
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/support" className="nav-link">
                  Support Desk
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/settings" className="nav-link">
                  Settings
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/privacy" className="nav-link">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </nav>

          {/* Center copyright */}
          <div className="text-center flex-fill">
            © {currentYear} Siza Admin Dashboard. All rights reserved.
          </div>

          {/* Right credit */}
          <div className="text-end">Built with ❤️ by Siza Team</div>
        </div>
      </div>
    </footer>
  );
}
