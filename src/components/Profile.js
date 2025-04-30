import React, { useState } from "react";
import { doc, updateDoc ,setDoc } from "firebase/firestore";
import { db } from "../firebase";

const Profile = ({ user, onback , updateUser }) => {
  const [userName, setUserName] = useState(user.userName || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [address, setAddress] = useState(user.address || "");
  const [isSaving, setIsSaving] = useState(false); // 用於顯示保存狀態

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const userDocRef = doc(db, "users", user.uid); // 假設 user.uid 是用戶的唯一 ID
      await updateDoc(userDocRef, {
        userName ,
        phone,
        address,
      });
      updateUser({userName, phone, address}); // 更新父組件的用戶狀態
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile: ", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      <img
        src="img/icon/back.png"
        alt="back"
        style={{ width: "30px", height: "30px", cursor: "pointer" }}
        onClick={onback}
      />
      <div style={styles.profile}>
        <img
          src="img/userheadpng/1.png"
          alt="User"
          style={{ width: "100px", height: "100px", borderRadius: "50%" }}
        />
        <div style={styles.inputGroup}>
          <label>Username:</label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={styles.inputGroup}>
          <label>Phone:</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={styles.inputGroup}>
          <label>Address:</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={styles.input}
          />
        </div>
        <button
          onClick={handleSave}
          style={styles.saveButton}
          disabled={isSaving} // 禁用按鈕以防止重複提交
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    textAlign: "center",
  },
  profile: {
    textAlign: "center",
    marginTop: "20px",
  },
  inputGroup: {
    marginBottom: "15px",
    textAlign: "left",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    marginTop: "5px",
  },
  saveButton: {
    padding: "10px 20px",
    borderRadius: "5px",
    border: "none",
    backgroundColor: "#007bff",
    color: "white",
    cursor: "pointer",
    marginTop: "20px",
  },
};

export default Profile;