import re


def clean_sql_output(value: str) -> str:
    cleaned = re.sub(r"```(?:sql)?|```", "", value, flags=re.IGNORECASE)
    cleaned = cleaned.replace("<s>", "").replace("</s>", "").strip()
    cleaned = re.sub(r"^(query|sql|answer)\s*:\s*", "", cleaned, flags=re.IGNORECASE)
    return cleaned.strip()
