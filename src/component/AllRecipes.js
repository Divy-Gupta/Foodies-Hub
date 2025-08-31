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

const AllRecipes = ({ searchTerm }) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState([]);
  const [modalRecipe, setModalRecipe] = useState(null);
  const [rating, setRating] = useState({});

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
      setLoading(false);

      const likes = JSON.parse(localStorage.getItem("likedRecipes") || "[]");
      setLikedIds(likes.map((item) => item.idMeal));

      const savedRatings = JSON.parse(localStorage.getItem("recipeRatings") || "{}");
      setRating(savedRatings);
    };
    getRecipes();
  }, []);

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
    window.dispatchEvent(new Event("storage")); // sync with navbar if needed
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

  // Search filter
  const query = searchTerm.trim();
  const filteredRecipes = query
    ? recipes.filter((recipe) =>
        (recipe.strMeal || "").toLowerCase().includes(query.toLowerCase())
      )
    : recipes;

  // Decide what to render
  let content;
  if (loading) {
    content = <p>Loading recipes...</p>;
  } else if (query && filteredRecipes.length === 0) {
    content = (
      <p style={{ color: "yellow", fontSize: "1.2rem" }}>
        Sorry, this recipe is not in our dataset!
      </p>
    );
  } else {
    content = (
      <div className="recipes-container">
        {filteredRecipes.map((recipe) => (
          <div key={recipe.idMeal} className="recipe-card">
            <img src={recipe.strMealThumb} alt={recipe.strMeal} />
            <h3>{recipe.strMeal}</h3>
            <div style={{ display: "flex", justifyContent: "space-around", marginTop: "10px" }}>
              <i
                className="fas fa-heart"
                style={{
                  color: likedIds.includes(recipe.idMeal) ? "red" : "white",
                  cursor: "pointer",
                  fontSize: "1.5rem",
                }}
                onClick={() => toggleLike(recipe)}
              ></i>
              <button className="view-btn" onClick={() => handleView(recipe.idMeal)}>
                View
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <section className="recipes" id="recipes">
        <h1>All Recipes</h1>
        {content}
      </section>

      {/* Modal */}
      {modalRecipe && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setModalRecipe(null)}>
              &times;
            </span>
            <h2 className="modal-heading">{modalRecipe.strMeal}</h2>
            <img src={modalRecipe.strMealThumb} alt={modalRecipe.strMeal} className="modal-img" />

            <p>
              <strong>Category:</strong> <span className="modal-text">{modalRecipe.strCategory}</span>
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
                ? modalRecipe.strInstructions.split(". ").map(
                    (inst, idx) => inst.trim() && <li key={idx}>{inst}.</li>
                  )
                : <li>Not available</li>}
            </ul>

            {modalRecipe.strYoutube && (
              <a href={modalRecipe.strYoutube} target="_blank" rel="noreferrer" className="youtube-link">
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
                    color: (rating[modalRecipe.idMeal] || 0) >= star ? "gold" : "gray",
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
