import { useNavigate } from "react-router-dom";
import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, provider } from "../firebase";
import { useEffect, useState } from "react";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result && result.user) {
          navigate("/app");
        } else {
          setLoading(false);
        }
      })
      .catch((error) => {
        console.log(error);
        setLoading(false);
      });
  }, []);

  const handleGoogleLogin = async () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    try {
      if (isMobile) {
        setLoading(true);
        await signInWithRedirect(auth, provider);
      } else {
        await signInWithPopup(auth, provider);
        navigate("/app");
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(to bottom right, #f8faff, #eef3ff)",
      }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "18px", color: "#555", fontWeight: "600" }}>Signing you in...</p>
          <p style={{ fontSize: "13px", color: "#aaa", marginTop: "8px" }}>Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "linear-gradient(to bottom right, #f8faff, #eef3ff)",
      padding: "20px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "420px",
        background: "white",
        padding: "40px 30px",
        borderRadius: "28px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
      }}>
        <div style={{ marginBottom: "30px", textAlign: "center" }}>
          <h1 style={{
            fontSize: "clamp(28px, 8vw, 42px)",
            fontWeight: "800",
            color: "#111",
            marginBottom: "10px",
            lineHeight: "1.2",
            whiteSpace: "nowrap",
          }}>
            Expense Tracker
          </h1>
          <p style={{ color: "#666", fontSize: "clamp(13px, 4vw, 16px)" }}>
            Track your spending habits beautifully
          </p>
        </div>

        <button
          onClick={handleGoogleLogin}
          style={{
            width: "100%",
            padding: "16px",
            background: "#111",
            color: "white",
            border: "none",
            borderRadius: "14px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "16px",
          }}
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}