import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = (e) => {
    e.preventDefault();
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        alert("註冊成功！");
        console.log(userCredential.user);
      })
      .catch((error) => {
        alert("註冊失敗：" + error.message);
      });
  };

  return (
    <div>
      <h2>註冊帳號</h2>
      <form onSubmit={handleSignUp}>
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
        <button type="submit">註冊</button>
      </form>
    </div>
  );
}

export default SignUp;
