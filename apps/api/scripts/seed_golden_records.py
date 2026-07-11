import asyncio
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.core.embedding_provider import as_pgvector, embed_text

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

APP_DB_URL = settings.DATABASE_URL
engine = create_engine(APP_DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# The Verified "Golden" Pairs
GOLDEN_PAIRS = [
    {
        "question": "What is the most ordered product?",
        # We use the semantic views we created in the last step
        "sql": "SELECT llm_products.product_name, COUNT(order_items.id) AS order_count FROM order_items JOIN llm_products ON order_items.product_id = llm_products.id GROUP BY llm_products.product_name ORDER BY order_count DESC LIMIT 1;"
    },
    {
        "question": "Who are our highest paying customers?",
        "sql": "SELECT llm_users.user_name, SUM(orders.total_amount) AS total_spent FROM orders JOIN llm_users ON orders.user_id = llm_users.id GROUP BY llm_users.user_name ORDER BY total_spent DESC LIMIT 5;"
    }
]

async def seed_golden_records():
    connection_key = "demo_ecom_db"
    db = SessionLocal()
    
    try:
        # Clear old records to prevent duplicates during testing
        db.execute(text("DELETE FROM golden_records WHERE connection_key = :key"), {"key": connection_key})
        
        for pair in GOLDEN_PAIRS:
            logger.info(f"Embedding golden record: '{pair['question']}'")
            
            vector_str = as_pgvector(await embed_text(pair["question"]))
            
            insert_query = text("""
                INSERT INTO golden_records (connection_key, question, sql_query, embedding) 
                VALUES (:key, :q, :sql, :vec)
            """)
            
            db.execute(insert_query, {
                "key": connection_key,
                "q": pair["question"],
                "sql": pair["sql"],
                "vec": vector_str
            })
            
        db.commit()
        logger.info("Verified examples seeded successfully")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to seed golden records: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(seed_golden_records())
