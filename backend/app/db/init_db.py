from sqlalchemy import text, inspect
from app.db.session import Base, engine


def ensure_schema():
    # Ensure base tables exist for first-time setup.
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)

    org_columns = [c["name"] for c in inspector.get_columns("organizations")]
    with engine.begin() as connection:
        if "country" not in org_columns:
            connection.execute(text("ALTER TABLE organizations ADD COLUMN country VARCHAR(100)"))
        if "type" not in org_columns:
            connection.execute(text("ALTER TABLE organizations ADD COLUMN type VARCHAR(50)"))
        if "website" not in org_columns:
            connection.execute(text("ALTER TABLE organizations ADD COLUMN website VARCHAR(200)"))
        if "contact_email" not in org_columns:
            connection.execute(text("ALTER TABLE organizations ADD COLUMN contact_email VARCHAR(200)"))
        if "password" not in org_columns:
            connection.execute(text("ALTER TABLE organizations ADD COLUMN password VARCHAR(255)"))
        if "otp" not in org_columns:
            connection.execute(text("ALTER TABLE organizations ADD COLUMN otp VARCHAR(10)"))
        if "otp_expires" not in org_columns:
            connection.execute(text("ALTER TABLE organizations ADD COLUMN otp_expires TIMESTAMP WITH TIME ZONE"))
        if "must_change_password" not in org_columns:
            connection.execute(text("ALTER TABLE organizations ADD COLUMN must_change_password BOOLEAN DEFAULT TRUE"))

    if "grants" in inspector.get_table_names():
        grant_columns = [c["name"] for c in inspector.get_columns("grants")]
        with engine.begin() as connection:
            if "created_by_type" not in grant_columns:
                connection.execute(text("ALTER TABLE grants ADD COLUMN created_by_type VARCHAR(50)"))
            if "created_by_id" not in grant_columns:
                connection.execute(text("ALTER TABLE grants ADD COLUMN created_by_id INTEGER"))
            if "status" not in grant_columns:
                connection.execute(text("ALTER TABLE grants ADD COLUMN status VARCHAR(50)"))
            if "category" not in grant_columns:
                connection.execute(text("ALTER TABLE grants ADD COLUMN category VARCHAR(100)"))
