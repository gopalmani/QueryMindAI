import asyncio
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.core.embedding_provider import as_pgvector, embed_text

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_URL = settings.DATABASE_URL

engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# THE SEMANTIC LAYER SCHEMA
# THE SEMANTIC LAYER SCHEMA (With Enforced Join Paths)
TARGET_SCHEMA = {
    "llm_users": "CREATE TABLE llm_users (id INT PRIMARY KEY, username VARCHAR, email VARCHAR, phone VARCHAR, created_at TIMESTAMP);",
    "llm_products": "CREATE TABLE llm_products (id INT PRIMARY KEY, product_name VARCHAR, sku VARCHAR, price DECIMAL, in_stock BOOLEAN, created_at TIMESTAMP);",
    "addresses": "CREATE TABLE addresses (id INT PRIMARY KEY, user_id INT REFERENCES llm_users(id), address_line VARCHAR, city VARCHAR, state VARCHAR, pincode VARCHAR);",
    "orders": "CREATE TABLE orders (id INT PRIMARY KEY, user_id INT REFERENCES llm_users(id), status VARCHAR, total_amount DECIMAL, created_at TIMESTAMP);",
    "order_items": "CREATE TABLE order_items (id INT PRIMARY KEY, order_id INT REFERENCES orders(id), product_id INT REFERENCES llm_products(id), quantity INT, price DECIMAL);",
    "payments": "CREATE TABLE payments (id INT PRIMARY KEY, order_id INT REFERENCES orders(id), payment_method VARCHAR, status VARCHAR, amount DECIMAL, created_at TIMESTAMP);"
}

async def embed_and_store_schema():
    connection_key = "demo_ecom_db" 
    db = SessionLocal()
    
    try:
        # Clear obsolete physical schema embeddings
        db.execute(text("DELETE FROM schema_embeddings WHERE connection_key = :key"), {"key": connection_key})
        db.commit()
        
        for table_name, ddl in TARGET_SCHEMA.items():
            logger.info(f"Embedding semantic layer: {table_name}...")
            
            vector_str = as_pgvector(await embed_text(ddl))
            
            insert_query = text("""
                INSERT INTO schema_embeddings (connection_key, table_name, schema_ddl, embedding) 
                VALUES (:key, :name, :ddl, :vec)
            """)
            
            db.execute(insert_query, {
                "key": connection_key,
                "name": table_name,
                "ddl": ddl,
                "vec": vector_str
            })
            
            logger.info(f"Successfully stored {table_name} in pgvector.")
            
        db.commit()
        logger.info("Semantic Schema ingestion complete.")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to ingest schema: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(embed_and_store_schema())
