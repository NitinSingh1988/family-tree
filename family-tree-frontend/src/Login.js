import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    "https://hjlmluiixkjifyjvvfch.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqbG1sdWlpeGtqaWZ5anZ2ZmNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwNDUwNTEsImV4cCI6MjA1MzYyMTA1MX0.-ejoMpgS1odUzqSGaXpd00Sd6h7MO_3K3bLW4qVfJxs"
  );

  const Login = ({ onLogin }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
  
    const handleLogin = async (e) => {
      e.preventDefault(); // Prevent default form submission
  
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
  
      if (error) {
        console.error("Login failed:", error.message);
        setError(error.message);
      } else {
        console.log("Login successful:", data);
  
        // Save session to local storage
        localStorage.setItem("supabase.auth.token", JSON.stringify(data));
  
        // Call the parent function to update the user state
        onLogin(data.user);
      }
    };

  return (
    <div>
      <h2>Admin Login</h2>
      <form onSubmit={handleLogin}>
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
        <button type="submit">Login</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default Login;
