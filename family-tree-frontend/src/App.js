import React, { useEffect, useState, useRef } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import './App.css';  // Import the external CSS file for better styling
import { createClient } from '@supabase/supabase-js';
import Login from "./Login";
import FamilyTreePublic from "./FamilyTreePublic";
import FamilyTreeLogin from "./FamilyTreeLogin";

const App = () => {
  
  const [admin, setAdmin] = useState(null);

  //console.log(process.env.REACT_APP_TEST_VARIABLE);

  //const supabase = process.env.REACT_APP_API_BASE_URL;
 
  const supabase = createClient(
    "https://hjlmluiixkjifyjvvfch.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqbG1sdWlpeGtqaWZ5anZ2ZmNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwNDUwNTEsImV4cCI6MjA1MzYyMTA1MX0.-ejoMpgS1odUzqSGaXpd00Sd6h7MO_3K3bLW4qVfJxs"
  );
  
  return (
    <Router>
    <div style={{ width: "100vw", height: "200vh" }}>
      
        <>
        <Routes>
        <Route path="/" element={<FamilyTreePublic />} />
        
        <Route path="/portaladmin" element={admin ?<FamilyTreeLogin /> : <Login onLogin={setAdmin} />} />
          
        </Routes>
        </>
      
    </div>
    </Router>
    );
};

export default App;
