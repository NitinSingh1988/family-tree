import React, { useEffect, useState, useRef } from "react";
import Tree from "react-d3-tree";
import * as htmlToImage from "html-to-image";
import { jsPDF } from "jspdf";
import './App.css';  // Import the external CSS file for better styling
import { createClient } from '@supabase/supabase-js';


const FamilyTreePublic = () => {
  const [familyTree, setFamilyTree] = useState([]);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);  // Track hovered node ID
  const [avatar, setAvatar] = useState({});  // Store avatar images for nodes
  const treeWrapperRef = useRef(null);


  //console.log(process.env.REACT_APP_TEST_VARIABLE);

  //const supabase = process.env.REACT_APP_API_BASE_URL;
 
  const supabase = createClient(
    "https://hjlmluiixkjifyjvvfch.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqbG1sdWlpeGtqaWZ5anZ2ZmNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwNDUwNTEsImV4cCI6MjA1MzYyMTA1MX0.-ejoMpgS1odUzqSGaXpd00Sd6h7MO_3K3bLW4qVfJxs"
  );

  useEffect(() => {
    fetchFamilyTree();
  }, []);


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

  

  return (
    <div style={{ width: "100vw", height: "200vh" }}>
     
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
                      
                    />                   
            
                    <rect
                      x={10}
                      y={-40}
                      width={70}
                      height={30}
                      fill="transparent"
                      stroke="none"
                      rx={5}
                      ry={5}
                      
                    />
                    
                  </g>
              
              </g>
            )}
          />
        )}
      </div>
    </div>
  );
};

export default FamilyTreePublic;
