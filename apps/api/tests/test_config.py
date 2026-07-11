from app.core.config import Settings


def test_csv_cors_parsing():
    settings = Settings(CORS_ALLOW_ORIGINS="http://a.test,http://b.test", DATABASE_URL="sqlite://")
    assert settings.CORS_ALLOW_ORIGINS == ["http://a.test", "http://b.test"]


def test_groq_provider_configuration_parses():
    settings = Settings(
        LLM_PROVIDER="groq", LLM_BASE_URL="https://api.groq.com/openai/v1",
        LLM_API_KEY="", LLM_MODEL="openai/gpt-oss-120b",
        LLM_FALLBACK_MODEL="llama-3.3-70b-versatile", DATABASE_URL="sqlite://",
    )
    assert settings.LLM_PROVIDER == "groq"
    assert settings.LLM_MAX_RETRIES == 2
