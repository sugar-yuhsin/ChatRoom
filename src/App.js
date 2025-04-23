import React from "react";
import { BrowserRouter as Router , Routes , Route } from "react-router-dom";
import SignAndLogIn from "./components/SignAndLogIn.js";
import GroupChatRoom from "./components/GroupChatRoom.js";

function App() {
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
