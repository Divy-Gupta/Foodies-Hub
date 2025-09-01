import React, { useRef, useState, useEffect } from "react";
import Logo from "../images/logohome.jpg";
import { Link, useNavigate } from "react-router-dom";
import { fetchRecipeById, fetchAllRecipes } from "../api/recipes";
import * as mobilenet from "@tensorflow-models/mobilenet";
import "@tensorflow/tfjs";

const Navbar = ({ setSearchTerm, setMatchedRecipes }) => {
  const navigate = useNavigate();
  const searchRef = useRef();
  const navbarRef = useRef();
  const [input, setInput] = useState("");
  const [likedRecipes, setLikedRecipes] = useState([]);
  const [showLikes, setShowLikes] = useState(false);
  const [modalRecipe, setModalRecipe] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [allRecipes, setAllRecipes] = useState([]);

  // Load all recipes
  useEffect(() => {
    const loadRecipes = async () => {
      const recipes = await fetchAllRecipes();
      setAllRecipes(recipes);
    };
    loadRecipes();
  }, []);

  // Load likes from localStorage
  useEffect(() => {
    const likes = JSON.parse(localStorage.getItem("likedRecipes") || "[]");
    setLikedRecipes(likes);
  }, []);

  // Sync likes across tabs
  useEffect(() => {
    const handleStorageChange = () => {
      const likes = JSON.parse(localStorage.getItem("likedRecipes") || "[]");
      setLikedRecipes(likes);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const searchHandler = () => {
    searchRef.current.classList.toggle("active");
    navbarRef.current.classList.remove("active");
  };

  const navbarHandler = () => {
    navbarRef.current.classList.toggle("active");
    searchRef.current.classList.remove("active");
  };

  const handleNavLinkClick = () => {
    if (navbarRef.current.classList.contains("active")) {
      navbarRef.current.classList.remove("active");
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    setSearchTerm(e.target.value);
    if (e.target.value.trim() !== "") navigate("/recipes");
  };

  const handleView = async (id) => {
    const recipeDetails = await fetchRecipeById(id);
    if (recipeDetails) setModalRecipe(recipeDetails);
  };

  const handleSaveRecipe = (recipe) => {
    let updatedLikes = [...likedRecipes];
    const exists = likedRecipes.some((r) => r.idMeal === recipe.idMeal);
    if (!exists) updatedLikes.push(recipe);
    else updatedLikes = updatedLikes.filter((r) => r.idMeal !== recipe.idMeal);
    localStorage.setItem("likedRecipes", JSON.stringify(updatedLikes));
    setLikedRecipes(updatedLikes);
    window.dispatchEvent(new Event("storage"));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setNotification("Processing image, please wait...");
    setIsProcessing(true);
    setMatchedRecipes([]);

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.crossOrigin = "anonymous";
    img.width = 224;
    img.height = 224;

    img.onload = async () => {
      try {
        const model = await mobilenet.load({ version: 2, alpha: 1.0 });
        const predictions = await model.classify(img);
        const detectedIngredients = predictions.map((p) =>
          p.className.toLowerCase()
        );

        const matched = allRecipes.filter((recipe) =>
          detectedIngredients.some((det) =>
            recipe.strMeal.toLowerCase().includes(det)
          )
        );

        const matchedWithDetails = await Promise.all(
          matched.map(async (recipe) => {
            const details = await fetchRecipeById(recipe.idMeal);
            return details ? details : recipe;
          })
        );

        if (matchedWithDetails.length > 0) {
          setMatchedRecipes(matchedWithDetails);
          setNotification(`Found ${matchedWithDetails.length} recipe(s)!`);
          navigate("/recipes");
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
    <header className={`header ${isProcessing ? "disabled" : ""}`}>
      <Link to="/" className="logo">
        <img src={Logo} alt="Logo" />
      </Link>

      <nav className="navbar" ref={navbarRef}>
        <Link to="/" onClick={handleNavLinkClick}>
          Home
        </Link>
        <Link to="/recipes" onClick={handleNavLinkClick}>
          All Recipes
        </Link>
        <Link to="/about" onClick={handleNavLinkClick}>
          About US
        </Link>
      </nav>

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
        <div
          className="fas fa-bars"
          id="menu-button"
          onClick={navbarHandler}
          style={{ marginLeft: "10px" }}
        ></div>
      </div>

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

      {/* Liked Recipes Dropdown */}
      {showLikes && likedRecipes.length > 0 && (
        <div className="liked-recipes-dropdown">
          {likedRecipes.map((recipe) => (
            <div key={recipe.idMeal} className="liked-recipe-card">
              <img src={recipe.strMealThumb} alt={recipe.strMeal} />
              <div>
                <h4>{recipe.strMeal}</h4>
                <button onClick={() => handleView(recipe.idMeal)}>View</button>
                <button onClick={() => handleSaveRecipe(recipe)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Viewing Recipe */}
      {modalRecipe && (
        <div
          className="modal"
          onClick={(e) => {
            if (e.target.classList.contains("modal")) setModalRecipe(null);
          }}
        >
          <div className="modal-content">
            <span className="close" onClick={() => setModalRecipe(null)}>&times;</span>
            <h2 className="modal-heading">{modalRecipe.strMeal}</h2>
            <img src={modalRecipe.strMealThumb} alt={modalRecipe.strMeal} className="modal-img"/>
            <p><strong>Category:</strong> {modalRecipe.strCategory}</p>
            <p><strong>Ingredients:</strong></p>
            <ul>
              {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => {
                const ing = modalRecipe[`strIngredient${n}`];
                const meas = modalRecipe[`strMeasure${n}`];
                if (ing && ing.trim() !== "") return <li key={n}>{meas} {ing}</li>;
                return null;
              })}
            </ul>
            <p><strong>Instructions:</strong></p>
            <ul>
              {modalRecipe.strInstructions?.split(". ").map((inst, idx) =>
                inst.trim() ? <li key={idx}>{inst}.</li> : null
              )}
            </ul>
            {modalRecipe.strYoutube && (
              <a href={modalRecipe.strYoutube} target="_blank" rel="noreferrer" className="youtube-link">
                <i className="fab fa-youtube"></i> Watch on YouTube
              </a>
            )}
          </div>
        </div>
      )}

      {notification && <div className="notification">{notification}</div>}
      {isProcessing && <div className="processing-overlay">Processing Image...</div>}
    </header>
  );
};

export default Navbar;
