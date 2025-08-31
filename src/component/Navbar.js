import React, { useRef, useState, useEffect } from "react";
import Logo from "../images/logohome.jpg";
import { Link, useNavigate } from "react-router-dom";
import { fetchAllRecipes } from "../api/recipes";
import * as mobilenet from "@tensorflow-models/mobilenet";
import "@tensorflow/tfjs";

const Navbar = ({ setSearchTerm }) => {
  const navigate = useNavigate();
  const searchRef = useRef();
  const navbarRef = useRef();
  const [input, setInput] = useState("");
  const [likedRecipes, setLikedRecipes] = useState([]);
  const [showLikes, setShowLikes] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [allRecipes, setAllRecipes] = useState([]);

  // Load all recipes once
  useEffect(() => {
    const loadRecipes = async () => {
      const recipes = await fetchAllRecipes();
      setAllRecipes(recipes);
    };
    loadRecipes();
  }, []);

  // Load likes and ratings from localStorage
  useEffect(() => {
    const likes = JSON.parse(localStorage.getItem("likedRecipes") || "[]");
    setLikedRecipes(likes);
  }, []);

  // Handle storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const likes = JSON.parse(localStorage.getItem("likedRecipes") || "[]");
      setLikedRecipes(likes);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Toggle search form
  const searchHandler = () => {
    searchRef.current.classList.toggle("active");
    navbarRef.current.classList.remove("active");
  };

  // Toggle mobile navbar
  const navbarHandler = () => {
    navbarRef.current.classList.toggle("active");
    searchRef.current.classList.remove("active");
  };

  // Close navbar on link click
  const handleNavLinkClick = () => {
    if (navbarRef.current.classList.contains("active")) {
      navbarRef.current.classList.remove("active");
    }
  };

  // Handle search input change
  const handleInputChange = (e) => {
    setInput(e.target.value);
    setSearchTerm(e.target.value);
    if (e.target.value.trim() !== "") {
      navigate("/recipes");
    }
  };

  // Handle image upload for ingredient detection
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setNotification("Processing image, please wait...");
    setIsProcessing(true);

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.crossOrigin = "anonymous";
    img.width = 224;
    img.height = 224;

    img.onload = async () => {
      try {
        const model = await mobilenet.load({ version: 2, alpha: 1.0 });
        const predictions = await model.classify(img);
        const detectedIngredients = predictions.map((p) => p.className.toLowerCase());

        const matched = allRecipes.filter((recipe) =>
          detectedIngredients.some((det) => recipe.strMeal.toLowerCase().includes(det))
        );

        if (matched.length > 0) {
          setNotification(`Found ${matched.length} recipe(s)!`);
        } else {
          setNotification("Sorry, no recipe found for this ingredient.");
        }
      } catch (err) {
        console.error(err);
        setNotification("Error in image classification.");
      } finally {
        setIsProcessing(false);
        setTimeout(() => setNotification(null), 4000);
      }
    };
  };

  return (
    <header className="header">
      <Link to="/" className="logo">
        <img src={Logo} alt="Logo" />
      </Link>

      {/* Navbar */}
      <nav className="navbar" ref={navbarRef}>
        <Link to="/" onClick={handleNavLinkClick}>Home</Link>
        <Link to="/recipes" onClick={handleNavLinkClick}>All Recipes</Link>
        <Link to="/about" onClick={handleNavLinkClick}>About Us</Link>
      </nav>

      {/* Icons */}
      <div className="icons">
        <div className="fas fa-search" id="search-btn" onClick={searchHandler}></div>
        <div
          className="fas fa-image"
          id="image-upload-btn"
          onClick={() => document.getElementById("image-upload").click()}
          style={{ cursor: "pointer", marginLeft: "10px" }}
        ></div>
        <input
          type="file"
          id="image-upload"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleImageUpload}
        />
        <div
          className="fas fa-heart"
          id="liked"
          style={{
            position: "relative",
            fontSize: "1.2rem",
            cursor: "pointer",
            color: likedRecipes.length > 0 ? "red" : "white",
            marginLeft: "10px",
          }}
          onClick={() => {
            if (likedRecipes.length === 0) alert("Please save a recipe first!");
            else setShowLikes(!showLikes);
          }}
        >
          {likedRecipes.length > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-8px",
                right: "-8px",
                background: "red",
                color: "white",
                borderRadius: "50%",
                padding: "2px 6px",
                fontSize: "0.7rem",
              }}
            >
              {likedRecipes.length}
            </span>
          )}
        </div>
        <div className="fas fa-bars" id="menu-button" onClick={navbarHandler} style={{ marginLeft: "10px" }}></div>
      </div>

      {/* Search form */}
      <div className="search-form" ref={searchRef}>
        <input
          type="search"
          placeholder="Search Here...."
          id="search-box"
          value={input}
          onChange={handleInputChange}
        />
        <label htmlFor="search-box" className="fas fa-search"></label>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className="notification"
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            background: "black",
            color: "white",
            padding: "10px 15px",
            borderRadius: "8px",
            zIndex: 3000,
          }}
        >
          {notification}
        </div>
      )}

      {/* Processing spinner */}
      {isProcessing && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 4000,
            color: "white",
            fontSize: "1.5rem",
            fontWeight: "bold",
          }}
        >
          Processing Image...
        </div>
      )}
    </header>
  );
};

export default Navbar;
