import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import "../css/Search.css"; // 假設你有一個 CSS 文件來處理樣式

const Search = ({ onClose, user }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    try {
      // 獲取用戶可訪問的所有群組
      const groupsCollection = collection(db, "groups");
      const groupsSnapshot = await getDocs(groupsCollection);
      const userGroups = groupsSnapshot.docs
        .filter(doc => doc.data().members.includes(user.uid))
        .map(doc => doc.data().groupName);
      
      // 搜索所有用戶可訪問群組中的訊息
      let allResults = [];
      
      for (const room of userGroups) {
        const messagesQuery = query(
          collection(db, "messages"),
          where("room", "==", room)
        );
        
        const messagesSnapshot = await getDocs(messagesQuery);
        const roomResults = messagesSnapshot.docs
          .filter(doc => 
            doc.data().text.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            roomName: room // 添加房間名稱
          }));
        
        allResults = [...allResults, ...roomResults];
      }
      
      // 根據時間戳排序（如果有）
      allResults.sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp.toDate()) : new Date(0);
        const timeB = b.timestamp ? new Date(b.timestamp.toDate()) : new Date(0);
        return timeB - timeA; // 最新的訊息排在前面
      });
      
      setSearchResults(allResults);
    } catch (error) {
      console.error("Error searching messages:", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="search-container">
      <div className="search-header">
        <h2>Search message</h2>
        <img
          src="/img/icon/back.png"
          alt="Close"
          className="icon"
          onClick={onClose}
        />
      </div>
      
      <div className="search-input-container">
        <input
          type="text"
          placeholder="key word..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button 
          onClick={handleSearch}
          disabled={isSearching || !searchTerm.trim()}
          className="search-button"
        >
          {isSearching ? "searching..." : "search"}
        </button>
      </div>
      
      <div className="search-results">
        {isSearching ? (
          <p className="searching">Searching...</p>
        ) : searchResults.length === 0 ? (
          searchTerm.trim() ? 
            <p className="no-results">Can't find</p> :
            <p className="no-results">Enter some keywords</p>
        ) : (
          <ul className="results-list">
            {searchResults.map((result) => (
              <li key={result.id} className="result-item">
                <div className="result-room">{result.roomName}</div>
                <div className="result-message">
                  <strong>{result.sender}</strong>: {result.text}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Search;

