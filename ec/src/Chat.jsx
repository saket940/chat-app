import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { io } from 'socket.io-client';

const API_URL = 'https://chat-app-5rqd.onrender.com';
let socket;

const Chat = () => {
  const { userId } = useParams();
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const typingTimeoutRef = useRef();

  const token = Cookies.get('token');
  const self = jwtDecode(token);

  useEffect(() => {
  // Ensure conversation
  fetch(`${API_URL}/conversations/ensure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ otherUserId: userId })
  }).then(r => r.json()).then(async ({ conversationId: cid }) => {
    setConversationId(cid);
    // Load history
    const res = await fetch(`${API_URL}/conversations/${cid}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setMessages(data);
    // connect socket
    if (!socket) socket = io(API_URL);
    socket.emit('user:online', self.id);

    socket.on('message:new', (msg) => {
      if (msg.conversationId === cid) setMessages(prev => [...prev, msg]);
    });
    socket.on('typing:start', ({ conversationId: c, userId: u }) => {
      if (c !== cid || u === self.id) return;
      setTypingUsers(prev => new Set(prev).add(u));
    });
    socket.on('typing:stop', ({ conversationId: c, userId: u }) => {
      if (c !== cid || u === self.id) return;
      setTypingUsers(prev => {
        const n = new Set(prev);
        n.delete(u);
        return n;
      });
    });
    socket.on('user:status', () => {});
    socket.on('message:read', () => {});

    // Mark read
    socket.emit('message:read', { conversationId: cid, userId: self.id });
  });

  return () => {
    if (socket) {
      socket.off('message:new');
      socket.off('typing:start');
      socket.off('typing:stop');
      socket.off('user:status');
      socket.off('message:read');
      socket.disconnect(); // ✅ fix destroy error
      socket = null;
    }
  };
}, [userId]);

  const handleSend = () => {
    if (!text.trim() || !conversationId) return;
    socket.emit('message:send', { conversationId, senderId: self.id, text });
    setText('');
  };

  const handleTyping = (value) => {
    setText(value);
    if (!conversationId) return;
    socket.emit('typing:start', { conversationId, userId: self.id });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { conversationId, userId: self.id });
    }, 700);
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map(m => (
          <div key={m._id} className={`message-row ${m.sender?._id === self.id ? 'self' : 'other'}`}>
            <div className={`message ${m.sender?._id === self.id ? 'self' : 'other'}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      {typingUsers.size > 0 && <div className="typing">typing...</div>}
      <div className="input-row">
        <input value={text} onChange={e => handleTyping(e.target.value)} placeholder="Type a message" />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default Chat;



