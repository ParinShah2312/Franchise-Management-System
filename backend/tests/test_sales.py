import pytest
from app.models import Product, ProductCategory

def test_create_sale(client, setup_franchise_branch, db_session):
    """Test creating a simple sale."""
    f_id, b_id, branch_auth_headers = setup_franchise_branch
    
    cat = ProductCategory(franchise_id=f_id, name="Burgers")
    db_session.add(cat)
    db_session.commit()
    
    prod = Product(
        franchise_id=f_id,
        category_id=cat.category_id,
        name="Test Burger",
        base_price=5.99
    )
    db_session.add(prod)
    db_session.commit()
    
    sale_payload = {
        "branch_id": b_id,
        "items": [
            {
                "product_id": prod.product_id,
                "quantity": 2,
                "unit_price": 5.99
            }
        ],
        "subtotal": 11.98,
        "tax_amount": 1.0,
        "discount_amount": 0,
        "total_amount": 12.98,
        "payment_method": "CASH"
    }
    response = client.post("/api/sales", json=sale_payload, headers=branch_auth_headers)
    assert response.status_code == 201
    
    data = response.get_json()
    assert "sale_id" in data
    assert "total_amount" in data
