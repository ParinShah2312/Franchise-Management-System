from app.models import StockItem, BranchInventory


def test_get_inventory_empty(client, setup_franchise_branch):
    """Test fetching inventory for a branch yields empty list initially."""
    f_id, b_id, branch_auth_headers = setup_franchise_branch
    response = client.get(
        f"/api/inventory?branch_id={b_id}", headers=branch_auth_headers
    )

    assert response.status_code == 200
    assert response.get_json() == []


def test_list_stock_items(client, setup_franchise_branch, db_session):
    """Test fetching available stock items for a franchise."""
    f_id, b_id, branch_auth_headers = setup_franchise_branch

    stock1 = StockItem(franchise_id=f_id, name="Stock 1", unit_id=1)
    stock2 = StockItem(franchise_id=f_id, name="Stock 2", unit_id=2)
    db_session.add_all([stock1, stock2])
    db_session.commit()

    response = client.get("/api/inventory/stock-items", headers=branch_auth_headers)
    assert response.status_code == 200

    items = response.get_json()
    assert len(items) == 2


def test_add_branch_inventory(client, setup_franchise_branch, db_session):
    """Test inserting/updating inventory quantity at a branch."""
    f_id, b_id, branch_auth_headers = setup_franchise_branch

    stock = StockItem(franchise_id=f_id, name="Test Potato", unit_id=1)
    db_session.add(stock)
    db_session.commit()
    stock_item_id = stock.stock_item_id

    trx_payload = {
        "branch_id": b_id,
        "stock_item_id": stock_item_id,
        "quantity": 50.0,
        "reorder_level": 10.0,
    }

    response = client.post(
        "/api/inventory", json=trx_payload, headers=branch_auth_headers
    )
    assert response.status_code == 201

    inv = (
        db_session.query(BranchInventory)
        .filter_by(branch_id=b_id, stock_item_id=stock_item_id)
        .first()
    )
    assert inv is not None
    assert float(inv.quantity) == 50.0
