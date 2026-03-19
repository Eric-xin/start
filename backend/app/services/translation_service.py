from functools import lru_cache

from app.schemas.card import CardOut

try:
    from deep_translator import GoogleTranslator
except Exception:  # pragma: no cover - optional dependency fallback
    GoogleTranslator = None


LANGUAGE_MAP = {
    "en": "en",
    "fr": "fr",
    "it": "it",
    # Swiss German is not directly supported by GoogleTranslator.
    # We map to German as closest fallback.
    "gsw": "de",
    "de": "de",
}


def normalize_language(language: str | None) -> str:
    if not language:
        return "en"
    value = language.lower().strip()
    if "-" in value:
        value = value.split("-", 1)[0]
    if "_" in value:
        value = value.split("_", 1)[0]
    return LANGUAGE_MAP.get(value, "en")


@lru_cache(maxsize=4096)
def _translate_cached(text: str, target_lang: str) -> str:
    if not text or target_lang == "en":
        return text
    if GoogleTranslator is None:
        return text
    try:
        return GoogleTranslator(source="en", target=target_lang).translate(text)
    except Exception:
        return text


def localize_text(text: str, language: str | None) -> str:
    target_lang = normalize_language(language)
    return _translate_cached(text, target_lang)


def localize_card_out(card: CardOut, language: str | None) -> CardOut:
    target_lang = normalize_language(language)
    if target_lang == "en":
        return card

    card.title = _translate_cached(card.title, target_lang)
    card.body = _translate_cached(card.body, target_lang)
    card.left_choice = _translate_cached(card.left_choice, target_lang)
    card.right_choice = _translate_cached(card.right_choice, target_lang)
    card.left_lesson = _translate_cached(card.left_lesson, target_lang)
    card.right_lesson = _translate_cached(card.right_lesson, target_lang)
    return card
