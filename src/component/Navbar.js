import React, { useRef, useState, useEffect } from "react";
import Logo from "../images/logohome.jpg";
import { Link, useNavigate } from "react-router-dom";
import { fetchRecipeById, fetchAllRecipes } from "../api/recipes";
import * as mobilenet from "@tensorflow-models/mobilenet";
import "@tensorflow/tfjs";

const Navbar = ({ setSearchTerm }) => {
  const navigate = useNavigate();
  const searchRef = useRef();
  const navbarRef = useRef();
  const [input, setInput] = useState("");
  const [likedRecipes, setLikedRecipes] = useState([]);
  const [showLikes, setShowLikes] = useState(false);
  const [modalRecipe, setModalRecipe] = useState(null);
  const [matchedRecipes, setMatchedRecipes] = useState([]);
  const [rating, setRating] = useState({});
  const [notification, setNotification] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [allRecipes, setAllRecipes] = useState([]);

  useEffect(() => {
    const loadRecipes = async () => {
      const recipes = await fetchAllRecipes();
      setAllRecipes(recipes);
    };
    loadRecipes();
  }, []);

  useEffect(() => {
    const likes = JSON.parse(localStorage.getItem("likedRecipes") || "[]");
    setLikedRecipes(likes);
    const savedRatings = JSON.parse(localStorage.getItem("recipeRatings") || "{}");
    setRating(savedRatings);
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const likes = JSON.parse(localStorage.getItem("likedRecipes") || "[]");
      setLikedRecipes(likes);
      const savedRatings = JSON.parse(localStorage.getItem("recipeRatings") || "{}");
      setRating(savedRatings);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    if (navbarRef.current) {
      navbarRef.current.classList.remove("active");
    }
  }, []);

  const searchHandler = () => {
    searchRef.current.classList.toggle("active");
    navbarRef.current.classList.remove("active");
  };

  const navbarHandler = () => {
    navbarRef.current.classList.toggle("active");
    searchRef.current.classList.remove("active");
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    setSearchTerm(e.target.value);

    if (e.target.value.trim() !== "") {
      navigate("/recipes");
    }
  };

  const handleView = async (id) => {
    const recipeDetails = await fetchRecipeById(id);
    setModalRecipe(recipeDetails);
  };

  const handleRating = (idMeal, value) => {
    const updatedRating = { ...rating, [idMeal]: value };
    setRating(updatedRating);
    localStorage.setItem("recipeRatings", JSON.stringify(updatedRating));
    window.dispatchEvent(new Event("storage"));
  };

  const handleSaveRecipe = (recipe) => {
    let updatedLikes = [...likedRecipes];
    const exists = likedRecipes.some(r => r.idMeal === recipe.idMeal);
    if (!exists) updatedLikes.push(recipe);
    else updatedLikes = updatedLikes.filter(r => r.idMeal !== recipe.idMeal);
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
        const detectedIngredients = predictions.map(p => p.className.toLowerCase());

        const matched = allRecipes.filter(recipe =>
          detectedIngredients.some(det => recipe.strMeal.toLowerCase().includes(det))
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

      <nav className="navbar" ref={navbarRef}>
        <Link to="/">Home</Link>
        <Link to="/recipes">All Recipes</Link>
        <Link to="/about">About US</Link>
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
          id="liked"
          style={{
            position: "relative",
            fontSize: "1.2rem",
            cursor: "pointer",
            color: likedRecipes.length > 0 ? "red" : "white",
            marginLeft: "10px",
          }}
          onClick={() => setShowLikes(!showLikes)}
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

      {/* Liked Recipes Modal */}
      {showLikes && likedRecipes.length > 0 && (
        <div className="modal" style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ background: "black", color: "white" }}>
            <span className="close" onClick={() => setShowLikes(false)}>&times;</span>
            <h2 style={{ color: "yellow" }}>Saved Recipes</h2>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {likedRecipes.map((recipe) => (
                <li key={recipe.idMeal} style={{ marginBottom: "15px", borderBottom: "1px solid gray", paddingBottom: "10px" }}>
                  <h3 style={{ color: "orange" }}>{recipe.strMeal}</h3>
                  {recipe.strMealThumb && <img src={recipe.strMealThumb} alt={recipe.strMeal} style={{ width: "50%", marginBottom: "10px" }} />}
                  <div>
                    <button
                      style={{ padding: "5px 10px", cursor: "pointer", background: "red", color: "white", border: "none", borderRadius: "5px" }}
                      onClick={() => handleSaveRecipe(recipe)}
                    >
                      Remove
                    </button>
                    <button
                      style={{ padding: "5px 10px", cursor: "pointer", background: "yellow", color: "black", border: "none", borderRadius: "5px", marginLeft: "10px" }}
                      onClick={() => handleView(recipe.idMeal)}
                    >
                      View
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Matched Recipes Modal */}
      {matchedRecipes.length > 0 && (
        <div className="modal" style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ background: "black", color: "white" }}>
            <span className="close" onClick={() => setMatchedRecipes([])}>&times;</span>
            <h2 style={{ color: "yellow" }}>Detected Recipes</h2>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {matchedRecipes.map((recipe) => {
                const isLiked = likedRecipes.some(r => r.idMeal === recipe.idMeal);
                return (
                  <li key={recipe.idMeal} style={{ marginBottom: "15px", borderBottom: "1px solid gray", paddingBottom: "10px" }}>
                    <h3 style={{ color: "orange" }}>{recipe.strMeal}</h3>
                    {recipe.strMealThumb && <img src={recipe.strMealThumb} alt={recipe.strMeal} style={{ width: "50%", marginBottom: "10px" }} />}
                    <div>
                      <button
                        style={{ padding: "5px 10px", cursor: "pointer", background: isLiked ? "red" : "green", color: "white", border: "none", borderRadius: "5px", marginRight: "10px" }}
                        onClick={() => handleSaveRecipe(recipe)}
                      >
                        {isLiked ? "Saved ❤️" : "Save"}
                      </button>
                      <button
                        style={{ padding: "5px 10px", cursor: "pointer", background: "yellow", color: "black", border: "none", borderRadius: "5px" }}
                        onClick={() => handleView(recipe.idMeal)}
                      >
                        View
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Recipe Details Modal */}
      {modalRecipe && (
        <div className="modal" style={{ zIndex: 2000 }}>
          <div className="modal-content" style={{ background: "black", color: "white" }}>
            <span className="close" onClick={() => setModalRecipe(null)}>&times;</span>
            <h2 style={{ color: "yellow" }}>{modalRecipe.strMeal}</h2>
            <img src={modalRecipe.strMealThumb} alt={modalRecipe.strMeal} style={{ width: "50%", marginBottom: "10px" }} />

            <p><strong>Ingredients:</strong></p>
            <ul>
              {Array.from({ length: 20 }).map((_, i) => {
                const ing = modalRecipe[`strIngredient${i + 1}`];
                const measure = modalRecipe[`strMeasure${i + 1}`];
                return ing ? <li key={i}>{ing} - {measure}</li> : null;
              })}
            </ul>

            <p><strong>Instructions:</strong></p>
            <ul>{modalRecipe.strInstructions?.split(". ").map((inst, idx) => <li key={idx}>{inst}.</li>)}</ul>

            {modalRecipe.strYoutube && (
              <a href={modalRecipe.strYoutube} target="_blank" rel="noreferrer" style={{ color: "red", display: "block", marginTop: "10px" }}>
                ▶ Watch on YouTube
              </a>
            )}
            <div style={{ marginTop: "10px" }}>
              <strong>Rate this recipe: </strong>
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} onClick={() => handleRating(modalRecipe.idMeal, star)} style={{ cursor: "pointer", color: (rating[modalRecipe.idMeal] || 0) >= star ? "gold" : "gray", fontSize: "1.5rem" }}>
                  ★
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {notification && <div className="notification" style={{ position: "fixed", top: "20px", right: "20px", background: "black", color: "white", padding: "10px 15px", borderRadius: "8px", zIndex: 3000 }}>{notification}</div>}

      {/* Processing Spinner */}
      {isProcessing && <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 4000, color: "white", fontSize: "1.5rem", fontWeight: "bold" }}>Processing Image...</div>}
    </header>
  );
};

export default Navbar;
