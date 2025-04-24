import React, { use ,useEffect} from "react";
import { BrowserRouter as Router , Routes , Route } from "react-router-dom";
import SignAndLogIn from "./components/SignAndLogIn.js";
import GroupChatRoom from "./components/GroupChatRoom.js";
import { db} from "./firebase.js";
import { collection, addDoc } from "firebase/firestore";


function App() {
  // useEffect(() => {
  //   const addUser = async () => {
  //     try {
  //       const docRef = await addDoc(collection(db, "users"), {
  //         first: "Dez",
  //         last: "Chuang",
  //         gender: "male",
  //       });
  //       console.log("Document written with ID: ", docRef.id);
  //     } catch (error) {
  //       console.error("Error adding document: ", error);
  //     }
  //   };
  
  //   addUser();
  // }, []);

  
  

  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignAndLogIn />} />
        <Route path="/chatroom" element={<GroupChatRoom />} />
      </Routes>
    </Router>
  );
  
}

export default App; 
