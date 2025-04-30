import React ,{use, useState} from "react";
import { auth , db} from "../firebase";
import { collection , addDoc } from "firebase/firestore";

const CreateGroup = ({allUsers , onFinish , user})=>{
    const [selectedUsers , setSelectedUsers] = useState([]);
    const [isHovered , setIsHovered] = useState(true);
    const handleSelectUser = (userId) => {
        if(selectedUsers.includes(userId)){
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        }else{
            setSelectedUsers([...selectedUsers , userId]);
        }
    };

    const handleFinish = async () => {
        if (!user || !user.uid) {
            alert("User information is missing. Please log in again.");
            return;
        }

        const groupName = prompt("Enter your group name");
        if (groupName && groupName.trim() !== "") {
            try {
                const groupMembers = [...selectedUsers, user.uid];
                console.log("Group Members:", groupMembers); // 確認成員列表是否正確

                await addDoc(collection(db, "groups"), {
                    groupName: groupName.trim(),
                    members: groupMembers,
                    createdAt: new Date().toISOString(),
                });

                onFinish(groupName); // 通知父元件創建完成
            } catch (error) {
                console.error("Error creating group: ", error);
                alert("Failed to create group. Please try again.");
            }
        } else {
            alert("Group name cannot be empty.");
        }
    };

    return(
        <div>
            <div style={styles.createGroupBar}>
                <h2>Create Group</h2>
                <img src = "/img/icon/back.png" alt = "back" style = {{width: "30px" , height: "30px"}} onClick={() => onFinish(null , null)}/>
            </div>
            {allUsers && allUsers.length === 0 ? (
            <p>Loading users...</p>
            ) : (
            <ul>
                {allUsers
                    .filter((user) => user.uid) // 過濾掉沒有 uid 的用戶
                    .map((user) => (
                    <li
                        key={user.id}
                        style={{
                        ...styles.useritem,
                        backgroundColor: selectedUsers.includes(user.uid) ? "#cedfff" : "#f1f6ff",
                        }}
                        onClick={() => handleSelectUser(user.uid)}
                    >
                        <span style={styles.userName}>{user.userName || "No User"}</span>
                        <div
                        style={{
                            ...styles.dot,
                            backgroundColor: selectedUsers.includes(user.uid) ? "#03448b" : "#c8c8c8",
                        }}
                        ></div>
                    </li>
                    ))}
            </ul>
            )}
            {/* <button type="submit" style={{
                ...styles.submit,
                background: isHovered ? "#dfd8d8" : "white",
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                >
                {isSingIn ? "Sign In" : "Sign Up"}
            </button> */}
            <button onClick={handleFinish} disabled={selectedUsers.length === 0}
                style={{
                    ...styles.submit,
                    background: isHovered ? "#d8d8d8" : "white",
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                Create
            </button>
        </div>
    )};

const styles = {
    checkbox: {
        backgroudColor: "pink",
        marginRight: "10px",
    },
    useritem:{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px",
        borderRadius: "5px",
        marginBottom: "10px",
        cursor: "pointer",
        transition: "background-color 0.3s ease",
        backgroundColor: "#f1f6ff",
    },
    userName:{
        fontSize: "16px",
        color: "#333",
    },
    dot: {
        width: "15px",
        height: "15px",
        borderRadius: "50%",
        border: "1px solid white",
        transition: "background-color 0.3s ease",
      },
    submit:{
        display: "flex",
        border: "2px solid rgb(191, 198, 199)",
        background: "white",
        alignItems: "center",
        height: "40px",
        width: "20%",
        margin: "0 auto",
        cursor: "pointer",
        transition: "background-color 0.3s ease",
        justifyContent: "center",
        fontSize: "18px",
        fontWeihght: "bold",
    },
    createGroupBar:{
        display:"flex",
        alignItems:"center",
        justifyContent:"space-between",
        padding: "10px",
    }
}

export default CreateGroup;