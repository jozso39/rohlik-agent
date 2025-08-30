import os
import httpx
from typing import List, Optional, Dict, Any
from langchain_core.tools import tool
from pydantic import BaseModel, Field

# Get MCP server URL from environment
MCP_BASE_URL = os.getenv("MCP_BASE_URL", "http://localhost:8001")

class SearchRecipesInput(BaseModel):
    """Input schema for recipe search"""
    diet: Optional[str] = Field(
        None,
        description="Filter recipes by diet or food category. Options: 'bez laktozy', 'bezlepkové', 'high-protein', 'low-carb', 'masité', 'tučné', 'vegan', 'vegetarian'"
    )
    meal_type: Optional[str] = Field(
        None,
        description="Filter recipes by meal type. Options: 'desert', 'dochucovadlo', 'hlavní chod', 'polévka', 'pomazánka', 'předkrm', 'příloha', 'salát', 'snídaně'"
    )
    name: Optional[str] = Field(
        None,
        description="Search recipes by name (partial match)"
    )

class IngredientsInput(BaseModel):
    """Input schema for ingredients operations"""
    ingredients: List[str] = Field(
        description="Array of ingredient names to add/remove from shopping list"
    )

@tool
def search_recipes(diet: Optional[str] = None, meal_type: Optional[str] = None, name: Optional[str] = None) -> str:
    """
    Search for recipes by diet, meal type, or name. Parameters can be combined.
    Useful when you want to find recipes by specific criteria.
    If no recipes are found, you can use get_all_recipes endpoint.
    """
    try:
        params = {}
        if diet:
            params["diet"] = diet
        if meal_type:
            params["meal_type"] = meal_type
        if name:
            params["name"] = name
            
        with httpx.Client() as client:
            response = client.get(f"{MCP_BASE_URL}/search_recipes", params=params)
            response.raise_for_status()
            data = response.json()
            
        import json
        return json.dumps(data, indent=2, ensure_ascii=False)
    except Exception as error:
        return f"Error searching recipes: {str(error)}"

@tool
def get_all_recipes() -> str:
    """
    Returns a list of all available recipes in the database.
    The recipe list is quite long, so use this tool only if you don't find any recipes through search_recipes endpoint.
    """
    try:
        with httpx.Client() as client:
            response = client.get(f"{MCP_BASE_URL}/get_recipes")
            response.raise_for_status()
            data = response.json()
            
        import json
        return json.dumps(data, indent=2, ensure_ascii=False)
    except Exception as error:
        return f"Error getting recipes: {str(error)}"

@tool
def add_ingredients_to_shopping_list(ingredients: List[str]) -> str:
    """
    Add multiple ingredients to the shopping list. 
    Useful when planning meals or when users want to add specific items.
    """
    try:
        payload = {"ingredients": ingredients}
        
        with httpx.Client() as client:
            response = client.post(
                f"{MCP_BASE_URL}/add_ingredients",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            data = response.json()
            
        import json
        return json.dumps(data, indent=2, ensure_ascii=False)
    except Exception as error:
        return f"Error adding ingredients: {str(error)}"

@tool
def get_shopping_list() -> str:
    """
    Returns the content of current shopping list with all items.
    """
    try:
        with httpx.Client() as client:
            response = client.get(f"{MCP_BASE_URL}/get_shopping_list")
            response.raise_for_status()
            data = response.json()
            
        import json
        return json.dumps(data, indent=2, ensure_ascii=False)
    except Exception as error:
        return f"Error getting shopping list: {str(error)}"

@tool
def clear_shopping_list() -> str:
    """
    Remove all items from the shopping list. 
    Use when user wants to start over or has completed shopping.
    """
    try:
        with httpx.Client() as client:
            response = client.post(
                f"{MCP_BASE_URL}/clear_shopping_list",
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            data = response.json()
            
        import json
        return json.dumps(data, indent=2, ensure_ascii=False)
    except Exception as error:
        return f"Error clearing shopping list: {str(error)}"

@tool
def remove_ingredients_from_shopping_list(ingredients: List[str]) -> str:
    """
    Remove specific ingredients from the shopping list. 
    Ingredients not in the list will be ignored.
    Useful for editing shopping list or when user decides not to want some items.
    """
    try:
        payload = {"ingredients": ingredients}
        
        with httpx.Client() as client:
            response = client.post(
                f"{MCP_BASE_URL}/remove_ingredients",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            data = response.json()
            
        import json
        return json.dumps(data, indent=2, ensure_ascii=False)
    except Exception as error:
        return f"Error removing ingredients: {str(error)}"

@tool
def create_meal_plan(title: str, days: List[Dict[str, Any]]) -> str:
    """
    Create a structured meal plan for multiple days.
    Use this tool after creating a meal plan for several days ahead.
    """
    meal_emojis = {
        "snídaně": "🥐",
        "oběd": "🍽️", 
        "večeře": "🌙",
        "svačina": "🍪"
    }
    
    try:
        # Create meal plan text
        console_output = f"📅 JÍDELNÍČEK: {title}\n\n"
        
        for day in days:
            console_output += f"🗓️ {day['day_name']}:\n"
            
            # Group meals by type
            meals_by_type = {}
            for meal in day.get("meals", []):
                meal_type = meal.get("meal_type", "")
                recipe_name = meal.get("recipe_name", "")
                if meal_type not in meals_by_type:
                    meals_by_type[meal_type] = []
                meals_by_type[meal_type].append(recipe_name)
            
            # Display in preferred order
            meal_order = ["snídaně", "oběd", "večeře", "svačina"]
            for meal_type in meal_order:
                if meal_type in meals_by_type:
                    capitalized_type = meal_type.capitalize()
                    recipes = ", ".join(meals_by_type[meal_type])
                    console_output += f"  • {capitalized_type}: {recipes}\n"
            
            console_output += "\n"
        
        return console_output
        
    except Exception as error:
        return f"Error creating meal plan: {str(error)}"

# List of all MCP tools
mcp_tools = [
    search_recipes,
    get_all_recipes,
    add_ingredients_to_shopping_list,
    remove_ingredients_from_shopping_list,
    get_shopping_list,
    clear_shopping_list,
    create_meal_plan
]
