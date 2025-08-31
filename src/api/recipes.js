// src/api/recipes.js

// Fetch all recipes (lightweight version)
export const fetchAllRecipes = async () => {
  const categories = [
    "Beef",
    "Chicken",
    "Dessert",
    "Lamb",
    "Pasta",
    "Seafood",
    "Vegetarian",
  ];

  try {
    const allData = await Promise.all(
      categories.map(async (cat) => {
        const res = await fetch(
          `https://www.themealdb.com/api/json/v1/1/filter.php?c=${cat}`
        );
        const data = await res.json();
        if (data.meals) {
          return data.meals.map((meal) => ({
            idMeal: meal.idMeal,
            strMeal: meal.strMeal,
            strMealThumb: meal.strMealThumb,
            category: cat,
            servings: Math.floor(Math.random() * 4) + 1, // 1–4 servings random
            time: `${15 + Math.floor(Math.random() * 30)} min`, // 15–45 min random
          }));
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

// Fetch full recipe by ID
export const fetchRecipeById = async (id) => {
  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
    const data = await res.json();
    if (data.meals && data.meals.length > 0) {
      const recipe = data.meals[0];

      // extra fields add karo yaha
      recipe.servings = Math.floor(Math.random() * 4) + 1;  // 1–4 servings
      recipe.time = `${15 + Math.floor(Math.random() * 30)} min`; // 15–45 min

      return recipe;
    }
    return null;
  } catch (err) {
    console.error('Error fetching recipe by ID:', err);
    return null;
  }
};

