import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

const API_URL = 'https://chat-app-5rqd.onrender.com';

const Index = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [self, setSelf] = useState(null);

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) return navigate('/login');
    const user = jwtDecode(token);
    setSelf(user);
    fetch(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      });
  }, [navigate]);

  if (loading) return <div>Loading users...</div>;

  return (
    <div className="users-wrapper">
    <h2>Users</h2>
    <ul>
      {users.map(u => (
        <li key={u._id}>
          <button onClick={() => navigate(`/chat/${u._id}`)}>
            <span className="user-name">{u.username}</span>
            <span className="user-status">{u.online ? '🟢' : '⚪'}</span>
          </button>
        </li>
      ))}
    </ul>
  </div>
  );
};

export default Index;


