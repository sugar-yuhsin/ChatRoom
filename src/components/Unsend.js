import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

const Unsend = ({ message, currentUser, onClose }) => {
  const [isUnsending, setIsUnsending] = useState(false);
  
  // 檢查當前用戶是否是消息發送者
  const isMessageOwner = message.sender === currentUser?.userName;
  
  // 收回消息處理函數
  const handleUnsendMessage = async () => {
    if (!isMessageOwner) return;
    
    setIsUnsending(true);
    try {
      const messageRef = doc(db, "messages", message.id);
      
      // 更新消息，標記為已收回
      await updateDoc(messageRef, {
        isUnsent: true,
        originalText: message.text,
        text: "Unsent message",
        unsendTime: new Date().toISOString()
      });
      
      onClose(); // 關閉彈窗
    } catch (error) {
      console.error("Error unsending message:", error);
      alert("無法收回消息，請稍後再試");
    } finally {
      setIsUnsending(false);
    }
  };
  
  return (
    <div className="unsend-container">
      <div className="unsend-backdrop" onClick={onClose}></div>
      <div className="unsend-modal">
        <h3>Unsend?</h3>
        <button 
          className="unsend-button" 
          onClick={handleUnsendMessage}
          disabled={isUnsending}
        >
          {isUnsending ? "收回中..." : "Yes, unsend it"}
        </button>
        <button className="unsend-cancel" onClick={onClose}>
          No, keep it
        </button>
      </div>
    </div>
  );
};

export default Unsend;