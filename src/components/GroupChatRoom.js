import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, query, where, getDocs, onSnapshot, orderBy, doc, getDoc, serverTimestamp } from "firebase/firestore";
import CreateGroup from "./CreateGroup"; 
import { useNavigate } from "react-router-dom";

const GroupChatRoom = () => {
  const [rooms, setRooms] = useState(["General"]);
  const [currentRoom, setCurrentRoom] = useState("General");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isLoadingMes, setIsLoadingMes] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userCollection = collection(db, "users");
        const userSnapshot = await getDocs(userCollection);
        const userList = userSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
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
          const userName = userDocSnap.data().userName;
          setUser({ email, userName });
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    let isMounted = true;

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
        if (isMounted) {
          const fetchedMessages = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMessages(fetchedMessages);
          setIsLoadingMes(false);
        }
      },
      (error) => {
        if (isMounted) {
          console.error("Error fetching messages: ", error);
          setIsLoadingMes(false);
        }
      }
    );

    return () => {
      isMounted = false;
      if (unsubscribeMessages) {
        unsubscribeMessages();
      }
    };
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

        const filteredGroups = groupsList.filter(
          (group) =>
            group.groupName === "General" || 
            (user && group.members.includes(user.userName))
        );

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
        <div style={styles.userInfo}>
          <img style={styles.userHead} src="/img/userheadpng/1.png" alt="User" />
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
      </div>

      <div style={styles.rightContainer}>
        {isCreatingGroup ? (
          <CreateGroup
            allUsers={allUsers}
            onFinish={(groupName, selectedUsers) => {
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
};

export default GroupChatRoom;
