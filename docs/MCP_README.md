# Shopping List MCP Server

This project implements a simple MCP server that serves as a database for managing shopping lists based on recipes. The server is built using Flask and interacts with a dataset of recipes stored in a CSV file.
It was created to serve a [Rohlík AI ReAct Agent](https://github.com/jozso39/rohlik-agent-js). Both of the projects have to be used simultaniously.
Both of the projects are created as an interview assignmnent to [Rohlík](https://www.rohlik.cz/) company. There is no intention to deploy this code or use it in production.

# Instalation
```
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

# Usage
```
python shopping_list_mcp_server/server.py
```

## Tests
```
python -m unittest tests/test_api.py
```

## Endpoints

### Get Shopping List
- **URL**: `/get_shopping_list`
- **Method**: `GET`
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
        "shopping_list": ["Mléko", "Cibule", "Chléb"]
    }
    ```

### Search Recipes
- **URL**: `/search_recipes`
- **Method**: `GET`
- **Query Parameters**:
  - `diet` (optional): Search recipes by diet category (e.g., "vegetarian", "vegan", "high-protein")
  - `meal_type` (optional): Search recipes by meal type (e.g., "polévka", "hlavní chod", "desert")
  - `name` (optional): Search recipes by name
  - `includes_ingredients` (optional): Comma-separated list of ingredients that must be present in the recipe (e.g., "Cibule,Máslo")
  - `excludes_ingredients` (optional): Comma-separated list of ingredients that must NOT be present in the recipe (e.g., "Mléko,Vejce")
  - `page` (optional): Page number for pagination (default: 1)
- **Note**: Results are limited to 10 recipes per page
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
        "recipes": [
            {
                "id": "12",
                "ingredients": ["Cibule", "Cukr krupice", "..."],
                "name": "Hrášková krémová polévka",
                "steps": "...",
                "diet": ["vegetarian"],
                "meal_type": ["polévka"]
            }
        ],
        "pagination": {
            "page": 1,
            "per_page": 10,
            "total": 25,
            "total_pages": 3,
            "has_next": true,
            "has_prev": false
        }
    }
    ```

### Get All Recipes
- **URL**: `/get_recipes`
- **Method**: `GET`
- **Query Parameters**:
  - `page` (optional): Page number for pagination (default: 1)
- **Note**: Results are limited to 10 recipes per page
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
        "recipes": [
            {
            "id": "10",
            "ingredients": [
                "Bobkový list",
                "Drcený kmín"
            ],
            "name": "Hovězí guláš s karlovarským knedlíkem",
            "steps": "...",
            "diet": ["masité", "high-protein"],
            "meal_type": ["hlavní chod"]
        }
        ],
        "pagination": {
            "page": 1,
            "per_page": 10,
            "total": 100,
            "total_pages": 10,
            "has_next": true,
            "has_prev": false
        }
    }
    ```

### Get All Ingredients
- **URL**: `/get_all_ingredients`
- **Method**: `GET`
- **Description**: Get all unique ingredients from all recipes
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
        "count": 125,
        "ingredients": ["Badyán", "Bobkový list", "Cibule", "Citron", "Cukr krupice", "..."]
    }
    ```

### Get All Diets
- **URL**: `/get_all_diets`
- **Method**: `GET`
- **Description**: Get all unique diet types from all recipes
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
        "count": 8,
        "diets": ["bezlepkové", "high-protein", "low-carb", "masité", "tučné", "vegan", "vegetarian", "bez laktozy"]
    }
    ```

### Add Multiple Ingredients to Shopping List
- **URL**: `/add_ingredients`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
      "ingredients": ["Mléko", "Cibule", "Chléb"]
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
        "message": "3 ingredients added",
        "shopping_list": ["Mléko", "Cibule", "Chléb"]
    }
    ```

### Remove Ingredients from Shopping List
- **URL**: `/remove_ingredients`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
      "ingredients": ["Cibule", "Máslo", "Neexistuje"]
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
        "shopping_list": ["Mléko", "Chléb"]
    }
    ```

#### Clear Shopping List
- **URL**: `/clear_shopping_list`
- **Method**: `POST`
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
        "message": "Shopping list cleared"
    }
    ```

## TODO: Future Enhancements

- integrating a more robust database solution (e.g., SQLite or PostgreSQL) for better data management as the project scales.
- user authentication
