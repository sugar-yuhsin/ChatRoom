import React, { use, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth , db} from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword , GoogleAuthProvider , signInWithPopup } from "firebase/auth";
import { doc , setDoc , getDoc } from "firebase/firestore";

const SignAndLogIn = () => {
  const navigate = useNavigate();
  const [isSignIn, setIsSignIn] = useState(true); // 修正拼寫
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
          userName:userName ||email.split("@")[0],
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

  const handleGoogleSignIn =  async ()=> {
    console.log("Google Sign In");
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      console.log("Google Sign In", user);
      
      if (!userDocSnap.exists()) {
        // 如果文件不存在，創建新文件
        await setDoc(userDocRef, {
          uid: user.uid,
          userName: user.displayName || user.email.split("@")[0],
          phone: user.phoneNumber || "unknown",
          address: "unknown",
          email: user.email,
        });
      }
      // await setDoc(doc(db, "users", user.uid), {
      //   userName: user.displayName || email.split("@")[0],
      //   phone: user.phoneNumber || "unknown",
      //   address:  "unknown",
      //   email: user.email,
      // } , { merge: true });
      navigate("/chatroom");
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  return (
    <div style={styles.box}>
      <h1 style={styles.h1}>GO CHAT !</h1>
      <div style={styles.toggleContainer}>
        <span
          onClick={() => setIsSignIn(true)}
          style={{
            ...styles.toggleOption,
            cursor: "pointer",
            borderBottom: isSignIn ? "3px solid #9fd5e1" : "none",
          }}
        >
          Sign In
        </span>
        <span
          onClick={() => setIsSignIn(false)}
          style={{
            ...styles.toggleOption,
            cursor: "pointer",
            borderBottom: !isSignIn ? "3px solid #9fd5e1" : "none",
          }}
        >
          Sign Up
        </span>
      </div>
      {loading ? (
        <p style={styles.loading}>Loading...</p>
      ) : (
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          {!isSignIn && (
            <>
              <input
                type="text"
                placeholder="User Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={styles.input}
              />
              
            </>
          )}
          <div style ={styles.submitcontainer}>
            <button
              type="submit"
              style={{
                ...styles.submit,
                background: isHovered ? "#dfd8d8" : "white",
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {isSignIn ? "Sign In" : "Sign Up"}
            </button>
            <img src="/img/icon/google.jpg" alt="Google" style={{ width: "30px", height: "30px", marginTop: "10px" }} 
              onClick={handleGoogleSignIn}
            />
          </div>
        </form>
      )}
    </div>
  );
};

const styles = {
  box: {
    width: "30%",
    background: "white",
    borderRadius: "10px",
    padding: "20px",
    margin: "10% auto",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
  },
  toggleContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  input: {
    padding: "10px",
    background: "#fffafa",
    borderRadius: "50px",
    border: "0px solid #ccc",
    width: "40%",
    height: "20px",
    margin: "0 auto",
  },
  submit: {
    border: "2px solid rgb(191, 198, 199)",
    background: "white",
    height: "40px",
    width: "20%",
    margin: "0 auto",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
  h1: {
    fontSize: "10.5rem !important", //no change
    fontWeight: "bold",
    color: "#002c5c",
    marginBottom: "20px",
  },
  loading: {
    fontSize: "18px",
    color: "#007bff",
    textAlign: "center",
    marginTop: "20px 0",
  },
  submitcontainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // Media Queries for RWD
  "@media (max-width: 1024px)": {
    box: {
      width: "50%", // 調整寬度
      margin: "5% auto",
    },
    input: {
      width: "60%", // 調整輸入框寬度
    },
    h1: {
      fontSize: "8rem", // 縮小標題字體
    },
  },
  "@media (max-width: 768px)": {
    box: {
      width: "70%", // 調整寬度
      margin: "5% auto",
    },
    input: {
      width: "80%", // 調整輸入框寬度
    },
    h1: {
      fontSize: "6rem", // 縮小標題字體
    },
    submit: {
      width: "40%", // 調整按鈕寬度
    },
  },
  "@media (max-width: 480px)": {
    box: {
      width: "90%", // 調整寬度
      margin: "5% auto",
    },
    input: {
      width: "90%", // 調整輸入框寬度
    },
    h1: {
      fontSize: "4rem", // 縮小標題字體
    },
    submit: {
      width: "60%", // 調整按鈕寬度
    },
  },
};

export default SignAndLogIn;