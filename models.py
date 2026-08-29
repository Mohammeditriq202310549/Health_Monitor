from sqlalchemy import Table, Column, Integer, Float, String, DateTime, func
from db import metadata # Import metadata container from db

# Define readings table using SQLAlchemy Core
readings = Table(
    "readings",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True), # Primary key id
    Column("value", Float, nullable=False), # CPU usage number
    Column("status", String(50), nullable=False), # Text status ("ok" or "warning")
    Column("created_at", DateTime(timezone=True), server_default=func.now()), # Timestamp
)
