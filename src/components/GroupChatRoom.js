import React, { useState, useEffect } from "react";
import { auth , db} from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {collection, addDoc , query , where , getDocs , onSnapshot} from "firebase/firestore";
import  CreateGroup  from "./CreateGroup"; // 匯入 CreateGroup 組件

const GroupChatRoom = () => {
  const [rooms, setRooms] = useState(["General"]); // 聊天室列表
  const [currentRoom, setCurrentRoom] = useState("General"); // 當前選擇的聊天室
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]); // 儲存所有使用者的狀態
  const [isCreatingGroup, setIsCreatingGroup] = useState(false); // 是否顯示創建群組的狀態

  useEffect(() => {

    const fetchUsers = async () => {
        try{
            const userCollection = collection(db, "users");
            const userSnapshot = await getDocs(userCollection);
            const userList = userSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setAllUsers(userList);
            console.log("All Users here!: ", userList);
        }catch (error) {
            console.error("Error fetching users: ", error);
        }
    };

    // 使用立即執行的異步函式
    (async () => {
        await fetchUsers();
    })();

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

  useEffect(() => {
    const fetchMessages = () => {
      const messagesQuery = query(
        collection(db, "messages"),
        where("room", "==", currentRoom) // 僅獲取當前聊天室的訊息
      );
  
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const fetchedMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(fetchedMessages); // 更新訊息狀態
      });
  
      return unsubscribe; // 清理監聽器
    };
  
    const unsubscribe = fetchMessages();
    return () => unsubscribe();
  }, [currentRoom]); // 當聊天室改變時重新獲取訊息

  useEffect(() => {
    const fetchGroups = async () => {
        try {
            const groupsCollection = collection(db, "groups");
            const groupsSnapshot = await getDocs(groupsCollection);
            const groupsList = groupsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setRooms(groupsList.map(group => group.groupName));
        } catch (error) {
            console.error("Error fetching groups: ", error);
        }
    };
    fetchGroups()
  },[])

  const handleSendMessage = async () => {
    if (newMessage.trim() === "") return;
    const message = {
      text: newMessage,
      sender: user.userName,
      timestamp: new Date().toISOString(),
      room: currentRoom,
    };
    try {
        // 將訊息存儲到 Firestore
        await addDoc(collection(db, "messages"), message);
        setNewMessage(""); // 清空輸入框
      } catch (error) {
        console.error("Error sending message: ", error);
      }
  };


  return (
    <div style={styles.container}>
      <div style={styles.leftContainer}>
        <div style={styles.userInfo}>
          <img
            style={styles.userHead}
            src="/img/userheadpng/1.png"
            alt="User"
          />
          <h2>{user ? user.userName : "Guest"}</h2>
          <img
            src="img/icon/create-group.png"
            alt="Create Group"
            style={styles.icon}
            onClick={() => setIsCreatingGroup(true)} // 點擊切換到 Create Group
          />
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
        {isCreatingGroup ? (
          <CreateGroup
            allUsers={allUsers}
            onFinish={(groupName, selectedUsers) => {
              console.log("Group Name: ", groupName);
              console.log("Selected Users: ", selectedUsers);
              setRooms([...rooms, groupName]); // 更新聊天室列表
              setIsCreatingGroup(false); // 創建完成後返回聊天室
            }}
          />
        ) : (
          <>
            <h2>{currentRoom} Room</h2>
            <div style={styles.chatBox}>
              {messages.map((message) => (
                <div key={message.id} style={styles.message}>
                  <strong>{message.sender}</strong>: {message.text}
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
          </>
        )}
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
    padding: "30px",
    margin: "10px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  },
  rightContainer: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: "20px",
    padding: "30px",
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
    justifyContent: "space-between",
    marginBottom: "20px",
  },
  icon:{
    display:"flex",
    alignItems:"right",
    width: "30px",
    height: "30px",
    marginLeft: "auto",
    cursor: "pointer",
  }
};

export default GroupChatRoom;