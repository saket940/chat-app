import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {Cookies} from "js-cookie";

const API_URL = 'https://chat-app-5rqd.onrender.com';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate=useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        Cookies.set("token", data.token);
        navigate("/");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div>
      <div className="fram">
        <div id="ffc" className="fc">
          <div id="ff">
            <h3>Welcome to Chat App</h3>
            <div>
              <Link to="/login">
                <button>Login</button>
              </Link>
              <Link to="/register">
                <button>Register</button>
              </Link>
            </div>
            <div>
              <form onSubmit={handleSubmit} id="form">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button id="login" type="submit">
                  Login
                </button>
              </form>
            </div>
          </div>
        </div>
        <div id="sfc" className="fc">
          <h1>Chat App</h1>
          
        </div>
      </div>
    </div>
  );
};

export default Login;


