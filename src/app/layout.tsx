"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./globals.css"; // Make sure you have global styles

export default function RootLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isTokenChecked, setIsTokenChecked] = useState(false);

  useEffect(() => {
    // Check if we're on the root and only check the token once after login
    if (window.location.pathname === "/" && !isTokenChecked) {
      checkTokenExpiration();
    }
  }, [isTokenChecked]);

  const logout = async () => {
    // Optionally call the logout API (optional, since JWT is client-side)
    await fetch("/api/auth/logout", { method: "POST" });

    // Remove JWT token from localStorage or sessionStorage
    localStorage.removeItem("authToken"); // Or sessionStorage.removeItem("authToken");

    // Redirect user to login page or home page after logout
    router.push("/login"); // Adjust the URL to your login page
  };

  const checkTokenExpiration = () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return logout();
    }

    try {
      // Decode the JWT token to check its expiration time
      const base64Url = token.split(".")[1];
      const base64 = decodeURIComponent(
        atob(base64Url)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );
      const decoded = JSON.parse(base64);

      // Compare expiration time with current time
      const currentTime = Date.now() / 1000; // Current time in seconds
      if (decoded.exp < currentTime) {
        return logout(); // Token is expired, log out
      }
    } catch (error) {
      console.error("Failed to decode token", error);
      logout();
    }

    // After checking the token, set the state to avoid repeated checks
    setIsTokenChecked(true);
  };

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          {/* Page Content */}
          <main className="flex-grow">{children}</main>
        </div>
      </body>
    </html>
  );
}

