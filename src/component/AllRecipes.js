// src/component/AllRecipes.js
import React, { useEffect, useState } from "react";

// Fetch all recipes from MealDB
export const fetchAllRecipes = async () => {
  try {
    const categories = ["Beef", "Chicken", "Dessert", "Lamb", "Pasta", "Seafood", "Vegetarian"];
    const allData = await Promise.all(
      categories.map(async (cat) => {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${cat}`);
        const data = await res.json();
        if (data.meals) {
          return data.meals.map((meal) => ({ ...meal, strCategory: cat }));
        }
        return [];
      })
    );
    return allData.flat();
  } catch (err) {
    console.error("Error fetching recipes:", err);
    return [];
  }
};

// Fetch full recipe details by ID
export const fetchRecipeById = async (id) => {
  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
    const data = await res.json();
    return data.meals ? data.meals[0] : null;
  } catch (err) {
    console.error("Error fetching recipe details:", err);
    return null;
  }
};

const AllRecipes = ({ searchTerm = "", matchedRecipes = [] }) => {
  const [recipes, setRecipes] = useState([]);
  const [displayRecipes, setDisplayRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState([]);
  const [modalRecipe, setModalRecipe] = useState(null);
  const [rating, setRating] = useState({});
  const [showFiltered, setShowFiltered] = useState(false);

  // Sync likes from localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const likes = JSON.parse(localStorage.getItem("likedRecipes") || "[]");
      setLikedIds(likes.map((item) => item.idMeal));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Fetch recipes on mount
  useEffect(() => {
    const getRecipes = async () => {
      const data = await fetchAllRecipes();
      setRecipes(data);
      setDisplayRecipes(data);
      setLoading(false);

      const likes = JSON.parse(localStorage.getItem("likedRecipes") || "[]");
      setLikedIds(likes.map((item) => item.idMeal));

      const savedRatings = JSON.parse(localStorage.getItem("recipeRatings") || "{}");
      setRating(savedRatings);
    };
    getRecipes();
  }, []);

  // Update displayRecipes when searchTerm or matchedRecipes changes
  useEffect(() => {
    if (matchedRecipes.length > 0) {
      setDisplayRecipes(matchedRecipes);
      setShowFiltered(true);
    } else if (searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase();
      setDisplayRecipes(
        recipes.filter((recipe) => (recipe.strMeal || "").toLowerCase().includes(query))
      );
      setShowFiltered(true);
    } else {
      setDisplayRecipes(recipes);
      setShowFiltered(false);
    }
  }, [matchedRecipes, searchTerm, recipes]);

  // Like/Unlike recipe
  const toggleLike = (recipe) => {
    let liked = JSON.parse(localStorage.getItem("likedRecipes") || "[]");
    const exists = liked.find((item) => item.idMeal === recipe.idMeal);

    if (exists) {
      liked = liked.filter((item) => item.idMeal !== recipe.idMeal);
    } else {
      liked.push(recipe);
    }

    localStorage.setItem("likedRecipes", JSON.stringify(liked));
    window.dispatchEvent(new Event("storage"));
    setLikedIds(liked.map((item) => item.idMeal));
    alert(exists ? "Recipe removed from saved!" : "Recipe saved!");
  };

  // View recipe details in modal
  const handleView = async (id) => {
    const recipeDetails = await fetchRecipeById(id);
    if (recipeDetails) {
      recipeDetails.servings = "2-3";
      recipeDetails.time = "30 mins";
      setModalRecipe(recipeDetails);
    }
  };

  // Rate recipe
  const handleRating = (idMeal, value) => {
    const updatedRating = { ...rating, [idMeal]: value };
    setRating(updatedRating);
    localStorage.setItem("recipeRatings", JSON.stringify(updatedRating));
  };

  // Decide what to render
  let content;
  if (loading) {
    content = <p className="loading-text">Loading recipes...</p>;
  } else if (displayRecipes.length === 0) {
    content = (
      <p className="error-text">
        Sorry, no recipes found {searchTerm && `for "${searchTerm}"`}
      </p>
    );
  } else {
    content = (
      <>
        {showFiltered && (
          <button
            onClick={() => {
              setDisplayRecipes(recipes); // reset to all
              setShowFiltered(false);
            }}
            className="back-btn"
          >
            ✖ Back to All Recipes
          </button>
        )}
        <div className="recipes-container">
          {displayRecipes.map((recipe) => (
            <div key={recipe.idMeal} className="recipe-card">
              <img src={recipe.strMealThumb} alt={recipe.strMeal} />
              <h3>{recipe.strMeal}</h3>
              <div className="recipe-actions">
                <i
                  className="fas fa-heart"
                  style={{
                    color: likedIds.includes(recipe.idMeal) ? "red" : "white",
                    cursor: "pointer",
                    fontSize: "1.5rem",
                  }}
                  onClick={() => toggleLike(recipe)}
                ></i>
                <button
                  className="view-btn"
                  onClick={() => handleView(recipe.idMeal)}
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <section className="recipes" id="recipes">
        {content}
      </section>

      {/* Modal */}
      {modalRecipe && (
        <div
          className="modal"
          onClick={(e) => {
            if (e.target.classList.contains("modal")) {
              setModalRecipe(null); // close on clicking outside modal
            }
          }}
        >
          <div className="modal-content">
            <span className="close" onClick={() => setModalRecipe(null)}>
              &times;
            </span>
            <h2 className="modal-heading">{modalRecipe.strMeal}</h2>
            <img
              src={modalRecipe.strMealThumb}
              alt={modalRecipe.strMeal}
              className="modal-img"
            />

            <p>
              <strong>Category:</strong> {modalRecipe.strCategory}
            </p>
            <p>
              <strong>Servings:</strong> {modalRecipe.servings}
            </p>
            <p>
              <strong>Cooking Time:</strong> {modalRecipe.time}
            </p>

            <p>
              <strong>Ingredients:</strong>
            </p>
            <ul className="modal-text">
              {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => {
                const ingredient = modalRecipe[`strIngredient${n}`];
                const measure = modalRecipe[`strMeasure${n}`];
                if (ingredient && ingredient.trim() !== "") {
                  return (
                    <li key={n}>
                      {measure} {ingredient}
                    </li>
                  );
                }
                return null;
              })}
            </ul>

            <p>
              <strong>Instructions:</strong>
            </p>
            <ul className="modal-text">
              {modalRecipe.strInstructions
                ? modalRecipe.strInstructions
                    .split(". ")
                    .map(
                      (inst, idx) =>
                        inst.trim() && <li key={idx}>{inst}.</li>
                    )
                : <li>Not available</li>}
            </ul>

            {modalRecipe.strYoutube && (
              <a
                href={modalRecipe.strYoutube}
                target="_blank"
                rel="noreferrer"
                className="youtube-link"
              >
                <i className="fab fa-youtube"></i> Watch on YouTube
              </a>
            )}

            <div style={{ marginTop: "10px" }}>
              <strong>Rate this recipe: </strong>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => handleRating(modalRecipe.idMeal, star)}
                  style={{
                    cursor: "pointer",
                    color:
                      (rating[modalRecipe.idMeal] || 0) >= star
                        ? "gold"
                        : "gray",
                    fontSize: "1.5rem",
                  }}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AllRecipes;
