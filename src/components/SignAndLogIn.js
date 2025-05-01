import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import "../css/SignAndLogin.css"; // 匯入 CSS 檔案

const SignAndLogIn = () => {
  const navigate = useNavigate();
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignIn) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
          alert("User does not exist. Please sign up first.");
          setLoading(false);
          return;
        }
        console.log("Sign In", { email, password });
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Sign Up", { email, password });

        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          userName: userName || email.split("@")[0],
          phone: phone || "unknown",
          address: address || "unknown",
          email: email,
        });
      }
      navigate("/chatroom");
    } catch (error) {
      console.error("Error signing in/up", error);
      if (error.code === "auth/email-already-in-use") {
        alert("This email is already in use. Please use a different email.");
      } else if (error.code === "auth/weak-password") {
        alert("The password is too weak. Please use a stronger password.");
      } else if (error.code === "auth/invalid-email") {
        alert("The email address is invalid. Please enter a valid email.");
      } else if (error.code === "auth/wrong-password") {
        alert("Incorrect password. Please try again.");
      } else {
        alert("An error occurred: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    console.log("Google Sign In");
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      console.log("Google Sign In", user);

      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          userName: user.displayName || user.email.split("@")[0],
          phone: user.phoneNumber || "unknown",
          address: "unknown",
          email: user.email,
        });
      }
      navigate("/chatroom");
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  return (
    <div className="box">
      <div className="typewriter">GO CHAT !</div>
      <div className="toggleContainer">
        <span
          onClick={() => setIsSignIn(true)}
          className={`toggleOption ${isSignIn ? "active" : ""}`}
        >
          Sign In
        </span>
        <span
          onClick={() => setIsSignIn(false)}
          className={`toggleOption ${!isSignIn ? "active" : ""}`}
        >
          Sign Up
        </span>
      </div>
      {loading ? (
        <p className="loading">Loading...</p>
      ) : (
        <form onSubmit={handleSubmit} className="form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
          {!isSignIn && (
            <>
              <input
                type="text"
                placeholder="User Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="input"
              />
              <input
                type="text"
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input"
              />
              <input
                type="text"
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="input"
              />
            </>
          )}
          <div className="submitcontainer">
            <button
              type="submit"
              className={`submit ${isHovered ? "hovered" : ""}`}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {isSignIn ? "Sign In" : "Sign Up"}
            </button>
            <img
              src="/img/icon/google.jpg"
              alt="Google"
              className="googleIcon"
              onClick={handleGoogleSignIn}
            />
          </div>
        </form>
      )}
    </div>
  );
};

export default SignAndLogIn;