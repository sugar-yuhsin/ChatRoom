import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

const GroupChatRoom = () => {
  const [rooms, setRooms] = useState(["General", "Tech", "Random"]); // 聊天室列表
  const [currentRoom, setCurrentRoom] = useState("General"); // 當前選擇的聊天室
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  useEffect(() => {
    // 監聽使用者登入狀態
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if(currentUser){
            const email = currentUser.email;
            const userName = email.substring(0, email.indexOf("@"));
            setUser({email, userName});
        }else{
            setUser(null);
        }
    });
    return () => unsubscribe();
  }, []);

  const handleSendMessage = () => {
    if (newMessage.trim() === "") return;
    const message = {
      text: newMessage,
      sender: user.userName,
      timestamp: new Date().toISOString(),
      room: currentRoom,
    };
    setMessages([...messages, message]);
    setNewMessage("");
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftContainer}>
        <div style={styles.userInfo}>
            <img style = {styles.userHead}
            src="/img/userheadpng/1.png" alt="User "
            />
            <h2>{user?user.userName:"Guest"}</h2>
        </div>
        <ul style={styles.roomList}>
          {rooms.map((room, index) => (
            <li
              key={index}
              style={{
                ...styles.roomItem,
                backgroundColor: currentRoom === room ? "#f0f0f0" : "white",
              }}
              onClick={() => setCurrentRoom(room)}
            >
              {room}
            </li>
          ))}
        </ul>
      </div>
      <div style={styles.rightContainer}>
        <h2>{currentRoom} Room</h2>
        <div style={styles.chatBox}>
          {messages
            .filter((msg) => msg.room === currentRoom)
            .map((msg, index) => (
              <div key={index} style={styles.message}>
                <strong>{msg.sender}:</strong> {msg.text}
              </div>
            ))}
        </div>
        <div style={styles.inputContainer}>
          <input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            style={styles.input}
          />
          <button onClick={handleSendMessage} style={styles.button}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    height: "100vh",
  },
  leftContainer: {
    width: "30%",
    backgroundColor: "white",
    borderRadius: "20px",
    padding: "20px",
    margin: "10px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  },
  rightContainer: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: "20px",
    padding: "20px",
    margin: "10px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    display: "flex",
    flexDirection: "column",
  },
  roomList: {
    listStyleType: "none",
    padding: 0,
  },
  roomItem: {
    padding: "10px",
    borderRadius: "5px",
    cursor: "pointer",
    marginBottom: "10px",
    textAlign: "center",
    transition: "background-color 0.3s ease",
  },
  chatBox: {
    flex: 1,
    // border: "1px solid #ccc",
    borderRadius: "10px",
    padding: "10px",
    overflowY: "scroll",
    marginBottom: "20px",
    // backgroundColor: "#f9f9f9",
  },
  message: {
    marginBottom: "10px",
    textAlign: "left",
    backgroundColor: "#f1f6ff",
    padding: "20px",
    borderRadius: "10px",
  },
  inputContainer: {
    display: "flex",
    gap: "10px",
  },
  input: {
    flex: 1,
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  button: {
    padding: "10px 20px",
    borderRadius: "5px",
    border: "none",
    backgroundColor: "#007bff",
    color: "white",
    cursor: "pointer",
  },
  userHead:{
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    marginRight: "10px",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    marginBottom: "20px",
  },
};

export default GroupChatRoom;