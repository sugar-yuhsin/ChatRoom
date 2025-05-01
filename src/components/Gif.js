import React, { useState } from 'react';
import '../css/Gif.css';

const Gif = ({ onGifSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('funny');
  const [gifs, setGifs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const TENOR_API_KEY = "AIzaSyCBAD-zHc0wzck0XjPQx5KVYNFO2_gzEnk"; // 請換成你自己的

  const searchGifs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://tenor.googleapis.com/v2/search?q=${searchTerm}&key=${TENOR_API_KEY}&limit=20&media_filter=minimal&locale=zh_TW`
      );
      const data = await response.json();
      setGifs(data.results || []);
    } catch (err) {
      console.error("Tenor API 錯誤：", err);
      setGifs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGifClick = (gif) => {
    const gifUrl = gif.media_formats?.gif?.url || gif.url;
    onGifSelect({
      url: gifUrl,
      preview: gifUrl,
      title: gif.content_description || "GIF",
      id: gif.id
    });
    onClose();
  };

  return (
    <div className="gif-overlay">
      <div className="gif-container">
        <div className="gif-header">
          <h3>選擇 GIF</h3>
          <button className="gif-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="gif-search">
          <input
            type="text"
            placeholder="輸入關鍵字"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button onClick={searchGifs}>搜尋</button>
        </div>

        {isLoading ? (
          <div className="gif-loading"><p>載入中...</p></div>
        ) : (
          <div className="gif-grid">
            {gifs.map((gif) => (
              <img
                key={gif.id}
                src={gif.media_formats?.tinygif?.url}
                alt={gif.content_description}
                onClick={() => handleGifClick(gif)}
                className="gif-item"
              />
            ))}
          </div>
        )}

        <div className="gif-footer">
          <span>Powered by Tenor</span>
        </div>
      </div>
    </div>
  );
};

export default Gif;
