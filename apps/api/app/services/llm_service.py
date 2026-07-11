from app.core.provider import get_llm_provider
from app.schemas.llm_schema import SQLGeneration


async def generate_sql(
    question: str,
    schema: str,
    temperature: float = 0.0,
    error_message: str | None = None,
    golden_record: dict | None = None,
) -> SQLGeneration:
    # Kept in the signature for compatibility; provider temperature is always zero.
    del temperature
    retry_context = f"\nPrevious database execution error: {error_message}" if error_message else ""
    example = ""
    if golden_record:
        example = (
            "\nHuman-verified example (guidance only):\n"
            f"Question: {golden_record['question']}\nSQL: {golden_record['sql']}\n"
        )
    system = """You generate safe PostgreSQL analytics queries. Return one JSON object with exactly these fields:
sql (one read-only SELECT or WITH...SELECT), explanation (plain language), tables_used (string array),
assumptions (string array), confidence (number from 0 to 1). Never include Markdown. Use only the supplied schema.
Do not generate INSERT, UPDATE, DELETE, DDL, administrative commands, comments, or multiple statements."""
    user = f"""Schema:
{schema}
{example}
Business question: {question}{retry_context}
"""
    return await get_llm_provider().generate([
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ])
