import React ,{use, useState} from "react";
import { auth , db} from "../firebase";
import { collection , addDoc } from "firebase/firestore";

const CreateGroup = ({allUsers , onFinish})=>{
    const [ selectedUsers , setSelectedUsers] = useState([]);

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
                <li key={user.id}>
                    <label>
                        <input 
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                        />
                        {user.userName ? user.userName : "no user"}
                    </label>
                </li>
            )
            )}
        </ul>
        )}
        <button onClick={handleFinish} disabled={selectedUsers.length === 0}>
            Create
        </button>
    </div>
)};



export default CreateGroup;