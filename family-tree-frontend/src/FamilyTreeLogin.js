import React, { useEffect, useState, useRef } from "react";
import Tree from "react-d3-tree";
//import axios from "axios";
import * as htmlToImage from "html-to-image";
import { jsPDF } from "jspdf";
import './App.css';  // Import the external CSS file for better styling
import { createClient } from '@supabase/supabase-js';
//import Login from "./Login";

const FamilyTreeLogin = () => {
  const [familyTree, setFamilyTree] = useState([]);
  const [newMember, setNewMember] = useState({ name: "", parent_id: null });
  const [editingMember, setEditingMember] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);  // Track hovered node ID
  const [avatar, setAvatar] = useState({});  // Store avatar images for nodes
  const treeWrapperRef = useRef(null);
  const [admin, setAdmin] = useState(null);

  //console.log(process.env.REACT_APP_TEST_VARIABLE);

  //const supabase = process.env.REACT_APP_API_BASE_URL;
 
  const supabase = createClient(
    "https://hjlmluiixkjifyjvvfch.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqbG1sdWlpeGtqaWZ5anZ2ZmNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwNDUwNTEsImV4cCI6MjA1MzYyMTA1MX0.-ejoMpgS1odUzqSGaXpd00Sd6h7MO_3K3bLW4qVfJxs"
  );

  useEffect(() => {
    fetchFamilyTree();
  }, []);


  useEffect(() => {
    // Check if the user is already logged in via supabase session
    const session = localStorage.getItem("supabase.auth.token");
    if (session) {
      const user = JSON.parse(session).user;
      if (user) {
        setAdmin(user);
      }
    }

    // Subscribe to auth state changes (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          localStorage.setItem("supabase.auth.token", JSON.stringify(session)); // Store session in localStorage
          setAdmin(session.user); // Update state with logged-in user
        } else {
          localStorage.removeItem("supabase.auth.token"); // Remove session on logout
          setAdmin(null); // Update state when logged out
        }
      }
    );

    // Clean up the listener on component unmount
   
  }, []);

  

  const handleLogout = async () => {
    await supabase.auth.signOut(); // Logout via Supabase
    localStorage.removeItem("supabase.auth.token"); // Remove session from localStorage
    setAdmin(null); // Reset the admin state
  };
  

  {/*}
  const fetchFamilyTree = () => {
    
    axios.get(`${supabase}/api/family`).then((response) => {
      const treeData = buildTree(response.data);
       // Map avatar URLs by node ID
        const avatarMap = response.data.reduce((acc, member) => {
          if (member.avatar) {
            acc[member.id] = member.avatar;
          }
          return acc;
        }, {});

      setFamilyTree(treeData);
      setAvatar(avatarMap); // Update the avatar mapping
    });
  };
*/}

const fetchFamilyTree = async () => {
  const { data, error } = await supabase.from("family_tree1").select("*");
  if (error) {
    console.error("Error fetching family tree:", error);
  } else {
    const treeData = buildTree(data); // Ensure buildTree is implemented
    const avatarMap = data.reduce((acc, member) => {
      if (member.avatar) {
        acc[member.id] = member.avatar;
      }
      return acc;
    }, {});
    setFamilyTree(treeData);
    setAvatar(avatarMap);
  }
};

  // Build hierarchical tree structure from flat data
  const buildTree = (data, parentId = null) => {
    return data
      .filter((item) => item.parent_id === parentId)
      .map((item) => ({
        id: item.id,
        name: item.name,
        parent_id: item.parent_id,
        avatar: avatar[item.id], // Include avatar in the tree data
        children: buildTree(data, item.id),
      }));
  };

 {/* // Add new member to the family tree
  const handleAddMember = () => {
    if (newMember.name) {
      axios
        .post(`${supabase}/api/family`, newMember)
        .then(() => {
          setNewMember({ name: "", parent_id: null });
          fetchFamilyTree();
        })
        .catch((err) => {
          console.error("Error adding new member:", err);
        });
    }
  };

  // Edit an existing member
  const handleEditMember = () => {
    if (editingMember.name) {
      axios
        .put(`${supabase}/api/family/${editingMember.id}`, editingMember)
        .then(() => {
          setEditingMember(null);
          fetchFamilyTree();
        })
        .catch((err) => {
          console.error("Error editing member:", err);
        });
    }
  };
*/}

  const handleAddMember = async () => {
    if (newMember.name) {
      try {
        // Insert the new member into the 'family_tree' table
        const { error } = await supabase
          .from('family_tree1')
          .insert([{ name: newMember.name, parent_id: newMember.parent_id || null }]);
  
        if (error) {
          console.error('Error adding new member:', error.message);
        } else {
          // Reset the form and fetch the updated family tree
          setNewMember({ name: "", parent_id: null });
          fetchFamilyTree();
        }
      } catch (err) {
        console.error('Unexpected error adding new member:', err);
      }
    }
  };

  // Edit an existing member
const handleEditMember = async () => {
  if (editingMember?.name) {
    try {
      // Update the existing member in the 'family_tree' table
      const { error } = await supabase
        .from('family_tree1')
        .update({
          name: editingMember.name,
          parent_id: editingMember.parent_id || null, // Update parent_id, or set it to null
        })
        .eq('id', editingMember.id); // Specify the row to update by ID

      if (error) {
        console.error("Error editing member:", error.message);
      } else {
        // Reset the editing state and fetch the updated family tree
        setEditingMember(null);
        fetchFamilyTree();
      }
    } catch (err) {
      console.error("Unexpected error editing member:", err);
    }
  }
};

const handleAvatarUpload = async (e, nodeId) => {
  const file = e.target.files[0];
  if (file) {
    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('name', editingMember.name);
    formData.append('parent_id', editingMember.parent_id || '');

    // If editing a member, handle avatar upload
    if (nodeId) {
      try {
        // Step 1: Upload the avatar image to Supabase Storage
        const { data, error: uploadError } = await supabase
          .storage
          .from('avatars') // specify the bucket name
          .upload(`${file.name}`, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          console.error('Error uploading avatar:', uploadError.message);
          return;
        }

        // Step 2: Update the family member's avatar URL in the database
        const avatarUrl = data?.Key ? `https://hjlmluiixkjifyjvvfch.supabase.co/storage/v1/object/avatars/${data.Key}` : null;

        // Update the member's avatar in the `family_tree` table
        const { error: updateError } = await supabase
          .from('family_tree1')
          .update({ avatar: avatarUrl })
          .eq('id', nodeId);

        if (updateError) {
          console.error('Error updating member avatar:', updateError.message);
          return;
        }

        // Step 3: Refresh the family tree after the update
        fetchFamilyTree();

      } catch (err) {
        console.error('Error handling avatar upload:', err);
      }
    }
  }
};



{/*
  // Avatar upload handler
  const handleAvatarUpload = (e, nodeId) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();

      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('name', editingMember.name);
      formData.append('parent_id', editingMember.parent_id || '');

        // If editing a member, send avatar with the PUT request
        if (nodeId) {
          axios
          .put(`${supabase}/api/family/${nodeId}`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })
            .then(() => {
              fetchFamilyTree(); // Refresh tree after update
            });
        }

      reader.onloadend = () => {
       // const avatarBase64 = reader.result; // Get the base64 string

      
        setAvatar((prevState) => ({
          ...prevState,
          [nodeId]: reader.result, // Save the image data in the state
        }));
      };
      reader.readAsDataURL(file);
    }
  };
*/}
  {/*
  // Delete a member from the family tree
  const handleDeleteMember = (id) => {
    axios
      .delete(`${supabase}/api/family/${id}`)
      .then(() => {
        fetchFamilyTree();
      })
      .catch((err) => {
        console.error("Error deleting member:", err);
      });
  };
*/}
// Delete a member from the family tree
const handleDeleteMember = async (id) => {
  try {
    // Delete the member and its descendants from the 'family_tree' table
    const { error } = await supabase
      .from('family_tree1')
      .delete()
      .or(`id.eq.${id},parent_id.eq.${id}`); // Deletes the member and its children

    if (error) {
      console.error("Error deleting member:", error.message);
    } else {
      // Refresh the family tree after successful deletion
      fetchFamilyTree();
    }
  } catch (err) {
    console.error("Unexpected error deleting member:", err);
  }
};

  // Export the tree as an image
  const exportToImage = () => {
    setTimeout(() => {
      if (treeWrapperRef.current) {
        htmlToImage
          .toPng(treeWrapperRef.current, {
            backgroundColor: "#ffffff",
            pixelRatio: 15,
          })
          .then((dataUrl) => {
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = "FamilyTree.png";
            link.click();
          })
          .catch((err) => {
            console.error("Failed to export the tree as an image:", err);
          });
      }
    }, 100);
  };

  // Export the tree as a PDF
  const exportToPDF = () => {
    setTimeout(() => {
      if (treeWrapperRef.current) {
        htmlToImage
          .toPng(treeWrapperRef.current, {
            backgroundColor: "#ffffff",
            pixelRatio: 8,
          })
          .then((dataUrl) => {
            const pdf = new jsPDF("landscape", "mm", "a4");
            const imgProps = pdf.getImageProperties(dataUrl);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save("FamilyTree.pdf");
          })
          .catch((err) => {
            console.error("Failed to export the tree as a PDF:", err);
          });
      }
    }, 100);
  };

  // Show tooltip with the node ID
  const handleNodeHover = (nodeId) => {
    setHoveredNodeId(nodeId);
  };

  const countNodes = (tree) => {
    if (!tree || tree.length === 0) return 0;
    return tree.reduce((count, node) => {
      return count + 1 + countNodes(node.children || []);
    }, 0);
  };

  return (
    <div style={{ width: "100vw", height: "200vh" }}>
      <h1 style={{ textAlign: "center" }}>Dynamic Tree</h1>
      <button onClick={handleLogout}>Logout</button>
      {/* Display Total Nodes */}
        <h2 style={{ textAlign: "center" }}>
          Total Nodes in the Tree: {countNodes(familyTree)}
        </h2>
      {/* Add Member Form */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Name"
          value={newMember.name}
          onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
        />
        <input
          type="number"
          placeholder="Parent ID (optional)"
          value={newMember.parent_id || ""}
          onChange={(e) =>
            setNewMember({
              ...newMember,
              parent_id: e.target.value ? parseInt(e.target.value) : null,
            })
          }
        />
        <button onClick={handleAddMember}>Add Member</button>
      </div>

      {/* Edit Member Form */}
{editingMember && (
  <div style={{ textAlign: "center", marginBottom: "20px" }}>
    <input
      type="text"
      placeholder="Name"
      value={editingMember.name}
      onChange={(e) =>
        setEditingMember({ ...editingMember, name: e.target.value })
      }
    />
    <input
      type="number"
      placeholder="Parent ID (optional)"
      value={editingMember.parent_id || ""}
      onChange={(e) =>
        setEditingMember({
          ...editingMember,
          parent_id: e.target.value ? parseInt(e.target.value) : null,
        })
      }
    />
    
    {/* Avatar Upload Button */}
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleAvatarUpload(e, editingMember.id)}
      />
      {avatar[editingMember.id] && (
        <div>
          <img
            src={avatar[editingMember.id]}
            alt="Avatar"
            style={{ width: "100px", height: "100px", borderRadius: "50%" }}
          />
        </div>
      )}
    </div>

    <button onClick={handleEditMember}>Save Changes</button>
    <button onClick={() => setEditingMember(null)}>Cancel</button>
  </div>
)}


      {/* Export Buttons */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <button onClick={exportToImage}>Export as Image</button>
        <button onClick={exportToPDF}>Export as PDF</button>
      </div>

      {/* Tree Visualization */}
      <div
        id="treeWrapper"
        style={{ width: "100%", height: "60%", position: "relative" }}
        ref={treeWrapperRef}
      >
        {familyTree.length > 0 && (
          <Tree
            data={familyTree}
            orientation="vertical"
            translate={{ x: 700, y: 50 }}
            pathFunc="elbow"
            renderCustomNodeElement={({ nodeDatum }) => (
              <g
                className="tree-node"
                onMouseEnter={() => handleNodeHover(nodeDatum.id)} // Trigger hover state
                onMouseLeave={() => setHoveredNodeId(null)} // Clear hover state
              >
                {/* Invisible bounding box for hover area */}
                <rect
                  x={-20}
                  y={-30}
                  width={80}
                  height={70}
                  fill="transparent"
                  stroke="none"
                />
            
                {/* Node Circle */}
                <circle
                  r={25}
                  fill={hoveredNodeId === nodeDatum.id ? "orange" : "blue"}
                  className="node-circle"
                />

                {/* Avatar inside Node Circle */}
                {avatar[nodeDatum.id] && (
                  <image
                    href={avatar[nodeDatum.id]}
                    x={-40}
                    y={-40}
                    width="80"
                    height="80"
                    clipPath="circle(25px at center)"
                  />
                )}
            
                {/* Node Name */}
                <text dx={-80} dy={65} fontSize={12} className="node-name">
                  {nodeDatum.name}
                </text>
            
                {/* Show Node ID on Hover */}
                {hoveredNodeId === nodeDatum.id && (
                  <text
                    x={-10}
                    y={5} // Position below the node name
                    fontSize={10}
                    fill="gray"
                    className="node-id"
                  >
                    {nodeDatum.id}
                  </text>
                )}

                {/* Edit/Delete Buttons (visible only on hover) */}
                {hoveredNodeId === nodeDatum.id && (
                  <g>
                    <rect
                      x={-40}
                      y={-40}
                      width={60}
                      height={30}
                      fill="transparent"
                      stroke="none"
                      rx={5}
                      ry={5}
                      onClick={() => setEditingMember(nodeDatum)}
                    />
                    <text
                      x={-30}
                      y={-20}
                      fontSize={10}
                      className="edit-id"
                      fill="transparent"
                      stroke="black"
                      onClick={() => setEditingMember(nodeDatum)}
                    >
                      Edit
                    </text>
            
                    <rect
                      x={10}
                      y={-40}
                      width={70}
                      height={30}
                      fill="transparent"
                      stroke="none"
                      rx={5}
                      ry={5}
                      onClick={() => handleDeleteMember(nodeDatum.id)}
                    />
                    <text
                      x={15}
                      y={-20}
                      fontSize={10}
                      className="delete-id"
                      fill="white"
                      stroke="red"
                      onClick={() => handleDeleteMember(nodeDatum.id)}
                    >
                      Delete
                    </text>
                  </g>
                )}
              </g>
            )}
          />
        )}
      </div>
    </div>
  );
};

export default FamilyTreeLogin;
