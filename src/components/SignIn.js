import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        alert("登入成功！");
        console.log(userCredential.user);
      })
      .catch((error) => {
        alert("登入失敗：" + error.message);
      });
  };

  return (
    <div>
      <h2>登入帳號</h2>
      <form onSubmit={handleSignIn}>
        <input
          type="email"
          placeholder="輸入 Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        /><br/>
        <input
          type="password"
          placeholder="輸入密碼"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        /><br/>
        <button type="submit">登入</button>
      </form>
    </div>
  );
}

export default SignIn;
