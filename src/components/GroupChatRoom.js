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
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const navigate = useNavigate();

  // 請求通知權限
  useEffect(() => {
    const requestNotificationPermission = async () => {
      if ("Notification" in window && Notification.permission !== "granted") {
        try {
          await Notification.requestPermission();
        } catch (err) {
          console.error("Notification permission error:", err);
        }
      }
    };
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userCollection = collection(db, "users");
        const userSnapshot = await getDocs(userCollection);
        const userList = userSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            uid: data.uid || doc.id,
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
    if (!currentRoom || !user) return;

    setIsLoadingMes(true);

    const messagesQuery = query(
      collection(db, "messages"),
      where("room", "==", currentRoom),
      orderBy("timestamp", "asc")
    );

    let lastSeenId = null;

    const unsubscribeMessages = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const fetchedMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // 通知邏輯（只對新訊息，且非自己發的）
        const lastMessage = fetchedMessages[fetchedMessages.length - 1];
        if (
          lastMessage &&
          lastMessage.sender !== user.userName &&
          lastMessage.id !== lastSeenId &&
          Notification.permission === "granted"
        ) {
          console.log("New message received:", lastMessage);
          new Notification(`💬 ${lastMessage.sender}`, {
            body: lastMessage.text,
          });
          lastSeenId = lastMessage.id;
        }else{
          console.log("No new message or it's from the same user.");
        }

        setMessages(fetchedMessages);
        setIsLoadingMes(false);
      },
      (error) => {
        console.error("Error fetching messages: ", error);
        setIsLoadingMes(false);
      }
    );

    return () => unsubscribeMessages();
  }, [currentRoom, user]);

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

        const filteredGroups = groupsList.filter((group) =>
          group.members.includes(user.uid)
        );

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
      timestamp: serverTimestamp(),
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
            onback={() => setIsProfileVisible(false)}
            updateUser={(updateData) =>
              setUser((prev) => ({ ...prev, ...updateData }))
            }
          />
        ) : (
          <>
            <div className="userInfo">
              <img
                className="userHead"
                src="/img/userheadpng/1.png"
                alt="User"
                onClick={() => setIsProfileVisible(true)}
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
