import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from "react";
import Cookies from "js-cookie";

const API_URL = 'http://localhost:5001';

const register = () => {
  const [name,setName]=useState("")
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate=useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name, email, password }),
      });

      const data = await response.json();
     if (response.ok) {
             // After registration, auto-login
             const loginResp = await fetch(`${API_URL}/auth/login`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ email, password })
             });
             const loginData = await loginResp.json();
             if (loginResp.ok) {
               Cookies.set("token", loginData.token);
               navigate("/");
             } else {
               alert(loginData.message);
             }
           } else {
             alert(data.message);
           }
    } catch (error) {
      alert("Error:", error);
    }
  };


  return (
    <div>
        <div className="fram">
            <div id="ffc"className="fc">
                <div id='ff'><h3>Chat App</h3>
                    <div>
                        <Link to="/login"><button>Login</button></Link>
                        <Link to="/register"><button>Register</button></Link>
                    </div>
                    <div >
                    <form onSubmit={handleSubmit} id="form">
        <input type="image"/>
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
        <input type="text" 
        placeholder='name'
        value={name}
        onChange={(e)=>setName(e.target.value)} 
        required/>
        <button type="submit">Register</button>
      </form>
                    </div>
                </div>
            </div>
            <div id="sfc"className="fc">
                <h1>Chat App</h1>
            </div>
        </div>
    </div>
  )
}

export default register
