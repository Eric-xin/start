from functools import lru_cache
import concurrent.futures
import time

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

# Threadpool and circuit breaker configuration for translation calls.
_TRANSLATION_WORKERS = 4
_TRANSLATION_TIMEOUT_SECONDS = 1.0
_TRANSLATION_FAILURE_THRESHOLD = 5
_TRANSLATION_COOLDOWN_SECONDS = 60.0

_translation_executor: concurrent.futures.Executor | None = None
_translation_failure_count = 0
_translation_disabled_until = 0.0


def _get_translation_executor() -> concurrent.futures.Executor:
    """
    Lazily initialize a shared threadpool for translation calls.
    """
    global _translation_executor
    if _translation_executor is None:
        _translation_executor = concurrent.futures.ThreadPoolExecutor(
            max_workers=_TRANSLATION_WORKERS,
            thread_name_prefix="translation-worker",
        )
    return _translation_executor


def _translate_via_google(text: str, target_lang: str) -> str:
    """
    Perform the actual Google translation in a threadpool with
    timeouts and a simple circuit breaker.
    """
    global _translation_failure_count, _translation_disabled_until

    if not text or target_lang == "en":
        return text
    if GoogleTranslator is None:
        return text

    now = time.time()
    if now < _translation_disabled_until:
        # Circuit breaker open; skip translation.
        return text

    executor = _get_translation_executor()

    def _do_translate() -> str:
        return GoogleTranslator(source="en", target=target_lang).translate(text)

    future = executor.submit(_do_translate)
    try:
        translated = future.result(timeout=_TRANSLATION_TIMEOUT_SECONDS)
    except (concurrent.futures.TimeoutError, Exception):
        _translation_failure_count += 1
        if _translation_failure_count >= _TRANSLATION_FAILURE_THRESHOLD:
            _translation_disabled_until = now + _TRANSLATION_COOLDOWN_SECONDS
        # On failure or timeout, fall back to original text.
        return text
    else:
        # Successful call; reset failure counter.
        _translation_failure_count = 0
        return translated


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
    """
    Cached translation wrapper. Delegates to the threadpool-based
    translator to avoid blocking the main event loop thread with
    network I/O.
    """
    return _translate_via_google(text, target_lang)


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
