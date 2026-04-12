"""Tests for catalog management — categories, products, stock items, recipes."""

from app.models import ProductCategory, Product, StockItem, ProductIngredient, Franchise
from app.utils.security import hash_password, generate_token
from decimal import Decimal


def _franchisor_and_token(db_session, suffix=""):
    from app.models import Franchisor
    franchisor = Franchisor(
        organization_name=f"Cat Org{suffix}",
        contact_person=f"Cat Contact{suffix}",
        email=f"catalogtest{suffix}@org.com",
        phone=f"990000{suffix[:4] if suffix else '0011'}",
        password_hash=hash_password("Password123!"),
    )
    db_session.add(franchisor)
    db_session.flush()
    franchise = Franchise(franchisor_id=franchisor.franchisor_id, name=f"Cat Franchise{suffix}")
    db_session.add(franchise)
    db_session.commit()
    token = generate_token(franchisor.franchisor_id, role="FRANCHISOR")
    return {"Authorization": f"Bearer {token}"}, franchise


def test_create_category(client, db_session):
    """Franchisor can create a product category."""
    headers, franchise = _franchisor_and_token(db_session, suffix="1c")
    response = client.post(
        "/api/catalog/categories",
        json={"name": "Drinks", "description": "Cold and hot drinks"},
        headers=headers,
    )
    assert response.status_code == 201
    data = response.get_json()
    assert data["category_name"] == "Drinks"


def test_create_duplicate_category_fails(client, db_session):
    """Creating a category with a duplicate name returns 409."""
    headers, franchise = _franchisor_and_token(db_session, suffix="2c")
    client.post("/api/catalog/categories", json={"name": "Burgers"}, headers=headers)
    response = client.post("/api/catalog/categories", json={"name": "Burgers"}, headers=headers)
    assert response.status_code == 409


def test_create_product(client, db_session):
    """Franchisor can create a product with a valid category."""
    headers, franchise = _franchisor_and_token(db_session, suffix="3c")
    cat_resp = client.post(
        "/api/catalog/categories",
        json={"name": "Snacks"},
        headers=headers,
    )
    cat_id = cat_resp.get_json()["category_id"]
    response = client.post(
        "/api/catalog/products",
        json={"name": "Samosa", "category_id": cat_id, "base_price": 20.0},
        headers=headers,
    )
    assert response.status_code == 201
    data = response.get_json()
    assert data["product_name"] == "Samosa"
    assert float(data["base_price"]) == 20.0


def test_update_product(client, db_session):
    """Franchisor can update a product's price and name."""
    headers, franchise = _franchisor_and_token(db_session, suffix="4c")
    cat_resp = client.post(
        "/api/catalog/categories", json={"name": "Hot Items"}, headers=headers
    )
    cat_id = cat_resp.get_json()["category_id"]
    prod_resp = client.post(
        "/api/catalog/products",
        json={"name": "Plain Paratha", "category_id": cat_id, "base_price": 30.0},
        headers=headers,
    )
    product_id = prod_resp.get_json()["product_id"]

    update_resp = client.put(
        f"/api/catalog/products/{product_id}",
        json={"base_price": 40.0},
        headers=headers,
    )
    assert update_resp.status_code == 200
    assert float(update_resp.get_json()["base_price"]) == 40.0


def test_add_and_remove_ingredient(client, db_session):
    """Franchisor can add an ingredient to a product and remove it."""
    headers, franchise = _franchisor_and_token(db_session, suffix="5c")
    cat_resp = client.post(
        "/api/catalog/categories", json={"name": "Mains"}, headers=headers
    )
    cat_id = cat_resp.get_json()["category_id"]
    prod_resp = client.post(
        "/api/catalog/products",
        json={"name": "Dal Makhani", "category_id": cat_id, "base_price": 120.0},
        headers=headers,
    )
    product_id = prod_resp.get_json()["product_id"]

    # Create stock item via inventory endpoint
    stock_resp = client.post(
        "/api/inventory/stock-items",
        json={"stock_item_name": "Black Lentils", "unit_id": 1},
        headers=headers,
    )
    assert stock_resp.status_code == 201
    stock_item_id = stock_resp.get_json()["stock_item_id"]

    # Add ingredient
    add_resp = client.post(
        f"/api/catalog/products/{product_id}/ingredients",
        json={"stock_item_id": stock_item_id, "quantity_required": 0.2},
        headers=headers,
    )
    assert add_resp.status_code == 201
    product_ingredient_id = add_resp.get_json()["product_ingredient_id"]

    # Remove ingredient
    del_resp = client.delete(
        f"/api/catalog/products/{product_id}/ingredients/{product_ingredient_id}",
        headers=headers,
    )
    assert del_resp.status_code == 200


def test_list_categories_empty(client, db_session):
    """Fetching categories for a new franchisor returns empty list."""
    headers, franchise = _franchisor_and_token(db_session, suffix="6c")
    response = client.get("/api/catalog/categories", headers=headers)
    assert response.status_code == 200
    assert response.get_json() == []


def test_branch_cannot_access_catalog(client, setup_franchise_branch):
    """Branch-scoped users cannot access franchisor catalog endpoints."""
    f_id, b_id, branch_auth_headers = setup_franchise_branch
    response = client.get("/api/catalog/categories", headers=branch_auth_headers)
    assert response.status_code == 403
