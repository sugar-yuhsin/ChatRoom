import React, { useState, useEffect, use } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, query, where, getDocs, onSnapshot, orderBy, doc, getDoc, serverTimestamp, updateDoc, setDoc } from "firebase/firestore";
import CreateGroup from "./CreateGroup"; 
import { useNavigate } from "react-router-dom";
import Profile from "./Profile";

const GroupChatRoom = () => {
  const [rooms, setRooms] = useState(["General"]);
  const [currentRoom, setCurrentRoom] = useState("General");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isLoadingMes, setIsLoadingMes] = useState(false);
  const [isProfileVisible, setIsProfileVisible] = useState(false); // 新增狀態
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userCollection = collection(db, "users");
        const userSnapshot = await getDocs(userCollection);
        const userList = userSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            uid: data.uid || doc.id, // 確保 uid 存在
            userName: data.userName || "Unknown User",
            phone: data.phone || "Unknown",
            address: data.address || "Unknown",
          };
        });
        setAllUsers(userList);
      } catch (error) {
        console.error("Error fetching users: ", error);
      }
    };

    fetchUsers();

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const email = currentUser.email;
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const currentUserData = {
            uid: currentUser.uid,
            email,
            userName: userData.userName,
            phone: userData.phone,
            address: userData.address,
          };
          setUser(currentUserData);

          // 確保用戶加入 General 群組
          const generalGroupRef = doc(db, "groups", "General");
          const generalGroupSnap = await getDoc(generalGroupRef);

          if (generalGroupSnap.exists()) {
            const generalGroupData = generalGroupSnap.data();
            if (!generalGroupData.members.includes(currentUserData.uid)) {
              await updateDoc(generalGroupRef, {
                members: [...generalGroupData.members, currentUserData.uid],
              });
            }
          } else {
            // 如果 General 群組不存在，創建它
            await setDoc(generalGroupRef, {
              groupName: "General",
              members: [currentUserData.uid],
              createdAt: new Date().toISOString(),
            });
          }
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentRoom) return;

    setIsLoadingMes(true);

    const messagesQuery = query(
      collection(db, "messages"),
      where("room", "==", currentRoom),
      orderBy("timestamp", "asc")
    );

    const unsubscribeMessages = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const fetchedMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(fetchedMessages);
        setIsLoadingMes(false);
      },
      (error) => {
        console.error("Error fetching messages: ", error);
        setIsLoadingMes(false);
      }
    );

    return () => unsubscribeMessages();
  }, [currentRoom]);

  useEffect(() => {
    if (!user) return;

    const fetchGroups = async () => {
      try {
        const groupsCollection = collection(db, "groups");
        const groupsSnapshot = await getDocs(groupsCollection);
        const groupsList = groupsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // 過濾出包含當前用戶的群組
        const filteredGroups = groupsList.filter(
          (group) => group.members.includes(user.uid)
        );

        // 確保 General 群組存在於 rooms 中
        if (!filteredGroups.some((group) => group.groupName === "General")) {
          filteredGroups.push({
            groupName: "General",
            members: user.uid,
          });
        }

        setRooms(filteredGroups.map((group) => group.groupName));
      } catch (error) {
        console.error("Error fetching groups: ", error);
      }
    };

    fetchGroups();
  }, [user]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === "") return;
    const message = {
      text: newMessage,
      sender: user.userName,
      timestamp: serverTimestamp(),  // 使用 serverTimestamp 來取得正確的時間戳
      room: currentRoom,
    };
    try {
      await addDoc(collection(db, "messages"), message);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      navigate("/");
    } catch (error) {
      console.error("Logout error: ", error);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftContainer}>
        {isProfileVisible ? (
          <Profile
            user={user}
            onback={() => setIsProfileVisible(false)} // 返回聊天室
            updateUser={(updateData) => {
              setUser((prev) => ({ ...prev, ...updateData }));
            }
            } // 更新用戶資料
          />
        ) : (
          <>
            <div style={styles.userInfo}>
              <img
                style={styles.userHead}
                src="/img/userheadpng/1.png"
                alt="User"
                onClick={() => setIsProfileVisible(true)} // 點擊切換到 Profile
              />
              <h2>{user ? user.userName : "Guest"}</h2>
              <img
                src="/img/icon/create-group.png"
                alt="Create Group"
                style={styles.icon}
                onClick={() => setIsCreatingGroup(true)}
              />
              <img
                src="/img/icon/log-out.png"
                alt="Logout"
                style={styles.icon}
                onClick={handleLogout}
              />
            </div>
            <hr style={styles.line} />
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
          </>
        )}
      </div>

      <div style={styles.rightContainer}>
        {isCreatingGroup ? (
          <CreateGroup
            allUsers={allUsers}
            user={user}
            onFinish={(groupName) => {
              setRooms((prev) => [...prev, groupName]);
              setIsCreatingGroup(false);
            }}
          />
        ) : (
          <>
            <h2>{currentRoom} Room</h2>
            <hr style={styles.line} />
            <div style={styles.chatBox}>
              {isLoadingMes ? (
                <p style={styles.loading}>Loading messages...</p>
              ) : (
                messages.map((message) => (
                  <div key={message.id} style={styles.message}>
                    <strong>{message.sender}</strong>: {message.text}
                  </div>
                ))
              )}
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
  userInfo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20px",
  },
  userHead: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    marginRight: "10px",
  },
  icon: {
    width: "30px",
    height: "30px",
    marginLeft: "10px",
    cursor: "pointer",
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
    borderRadius: "10px",
    padding: "10px",
    overflowY: "scroll",
    marginBottom: "20px",
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
  line: {
    width: "100%",
    backgroundColor: "#ccc",
    height: "1px",
    border: "none",
  },
  loading: {
    fontSize: "18px",
    color: "#007bff",
    textAlign: "center",
    marginTop: "20px",
  },

  // Media Queries for RWD
  "@media screen and (max-width: 1024px)": {
    container: {
      flexDirection: "column", // 將左右容器堆疊
    },
    leftContainer: {
      width: "100%", // 左容器佔滿寬度
      margin: "10px 0",
    },
    rightContainer: {
      width: "100%", // 右容器佔滿寬度
      margin: "10px 0",
    },
    userHead: {
      width: "40px", // 縮小用戶頭像
      height: "40px",
    },
    icon: {
      width: "25px", // 縮小圖標
      height: "25px",
    },
    roomItem: {
      fontSize: "14px", // 縮小房間列表字體
    },
    message: {
      fontSize: "14px", // 縮小訊息字體
    },
  },
  "@media screen and (max-width: 768px)": {
    container: {
      flexDirection: "column", // 將左右容器堆疊
    },
    leftContainer: {
      width: "100%", // 左容器佔滿寬度
      margin: "10px 0",
    },
    rightContainer: {
      width: "100%", // 右容器佔滿寬度
      margin: "10px 0",
    },
    userHead: {
      width: "35px", // 縮小用戶頭像
      height: "35px",
    },
    icon: {
      width: "20px", // 縮小圖標
      height: "20px",
    },
    roomItem: {
      fontSize: "12px", // 縮小房間列表字體
    },
    message: {
      fontSize: "12px", // 縮小訊息字體
    },
  },
  "@media screen and (max-width: 480px)": {
    container: {
      flexDirection: "column", // 將左右容器堆疊
    },
    leftContainer: {
      width: "100%", // 左容器佔滿寬度
      margin: "10px 0",
    },
    rightContainer: {
      width: "100%", // 右容器佔滿寬度
      margin: "10px 0",
    },
    userHead: {
      width: "30px", // 縮小用戶頭像
      height: "30px",
    },
    icon: {
      width: "15px", // 縮小圖標
      height: "15px",
    },
    roomItem: {
      fontSize: "10px", // 縮小房間列表字體
    },
    message: {
      fontSize: "10px", // 縮小訊息字體
    },
  },
};

export default GroupChatRoom;
