import React ,{use, useState} from "react";
import { auth , db} from "../firebase";
import { collection , addDoc } from "firebase/firestore";

const CreateGroup = ({allUsers , onFinish})=>{
    const [ selectedUsers , setSelectedUsers] = useState([]);
    const [isHovered , setIsHovered] = useState(true);
    const handleSelectUser = (userId) => {
        if(selectedUsers.includes(userId)){
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        }else{
            setSelectedUsers([...selectedUsers , userId]);
        }
    };

    const handleFinish = async () => {
        const groupName = prompt("Enter your group name");
        if(groupName && groupName.trim() !== ""){
           try{
                await addDoc(collection(db, "groups"),{
                    groupName: groupName.trim(),
                    members: selectedUsers,
                    createdAt: new Date().toISOString(),
                });

                onFinish(groupName , selectedUsers)
           }catch(error){
                console.error("Error creating group: ", error);
           }
    };
};
return(
    <div>
        <h2>Create Group</h2>
        {allUsers && allUsers.length === 0 ? (
        <p>Loading users...</p>
        ) : (
        <ul>
            {allUsers.map((user) => (
                <li key={user.id}
                style={{
                    ...styles.useritem,
                    backgroundColor: selectedUsers.includes(user.id) ? "#cedfff" : "#f1f6ff",
                }}
                onClick={() => handleSelectUser(user.id)}
                >
                <span style={styles.userName}>{user.userName ? user.userName : "no user"}</span>
                <div
                style={{
                    ...styles.dot,
                    backgroundColor: selectedUsers.includes(user.id) ? "#03448b" : "#c8c8c8",
                }}></div>
                </li>
            )
            )}
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
}

export default CreateGroup;