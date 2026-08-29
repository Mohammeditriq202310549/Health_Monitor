from sqlalchemy import create_engine, MetaData

DATABASE_URL = "postgresql://postgres:123456@localhost:5432/health_monitor_db" # Database URL

engine = create_engine(DATABASE_URL) # Create SQLAlchemy Engine
metadata = MetaData() # Create MetaData container
