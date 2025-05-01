import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import CreateGroup from "./CreateGroup";
import { useNavigate } from "react-router-dom";
import Profile from "./Profile";
import "../css/GroupChatRoom.css"; // 匯入 CSS 檔案

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
      timestamp: serverTimestamp(), // 使用 serverTimestamp 來取得正確的時間戳
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
    <div className="container">
      <div className="leftContainer">
        {isProfileVisible ? (
          <Profile
            user={user}
            onback={() => setIsProfileVisible(false)} // 返回聊天室
            updateUser={(updateData) => {
              setUser((prev) => ({ ...prev, ...updateData }));
            }} // 更新用戶資料
          />
        ) : (
          <>
            <div className="userInfo">
              <img
                className="userHead"
                src="/img/userheadpng/1.png"
                alt="User"
                onClick={() => setIsProfileVisible(true)} // 點擊切換到 Profile
              />
              <h2>{user ? user.userName : "Guest"}</h2>
              <img
                src="/img/icon/create-group.png"
                alt="Create Group"
                className="icon"
                onClick={() => setIsCreatingGroup(true)}
              />
              <img
                src="/img/icon/log-out.png"
                alt="Logout"
                className="icon"
                onClick={handleLogout}
              />
            </div>
            <hr className="line" />
            <ul className="roomList">
              {rooms.map((room, index) => (
                <li
                  key={index}
                  className={`roomItem ${
                    currentRoom === room ? "activeRoom" : ""
                  }`}
                  onClick={() => setCurrentRoom(room)}
                >
                  {room}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="rightContainer">
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
            <hr className="line" />
            <div className="chatBox">
              {isLoadingMes ? (
                <p className="loading">Loading messages...</p>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="message">
                    <strong>{message.sender}</strong>: {message.text}
                  </div>
                ))
              )}
            </div>
            <div className="inputContainer">
              <input
                type="text"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="input"
              />
              <button onClick={handleSendMessage} className="button">
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GroupChatRoom;
