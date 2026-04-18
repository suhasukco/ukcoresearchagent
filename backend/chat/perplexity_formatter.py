import json
import re
import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)


async def generate_perplexity_response(query: str, report: str) -> Dict[str, Any]:
    """Convert a markdown research report into a Perplexity-style structured response."""
    try:
        from gpt_researcher.config.config import Config
        from gpt_researcher.utils.llm import create_chat_completion

        cfg = Config()
        truncated = report[:5000] if len(report) > 5000 else report

        messages = [
            {
                "role": "system",
                "content": (
                    "You are UKCOResearcher, a professional AI research assistant built for UKCO. "
                    "Always respond with valid JSON only — no markdown fences, no extra text."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Convert this research into a Perplexity-style structured response.\n\n"
                    f"Research Query: {query}\n\n"
                    f"Research Findings:\n{truncated}\n\n"
                    "Return ONLY the following JSON (no other text):\n"
                    "{\n"
                    '  "answer": "Direct 2-3 paragraph answer to the query. Use [1] [2] [3] for inline citations where evidence supports a claim.",\n'
                    '  "key_points": [\n'
                    '    "Key finding 1 [1]",\n'
                    '    "Key finding 2 [2]",\n'
                    '    "Key finding 3 [3]",\n'
                    '    "Key finding 4 [4]",\n'
                    '    "Key finding 5 [5]"\n'
                    "  ],\n"
                    '  "follow_up_questions": [\n'
                    '    "Related follow-up question 1?",\n'
                    '    "Related follow-up question 2?",\n'
                    '    "Related follow-up question 3?"\n'
                    "  ],\n"
                    '  "confidence": "high"\n'
                    "}\n\n"
                    "Rules:\n"
                    "- answer: concise, direct, no markdown headers, use [n] citation markers\n"
                    "- key_points: exactly 5 items, each under 120 characters\n"
                    "- follow_up_questions: exactly 3 relevant questions\n"
                    "- confidence: 'high' if multiple sources agree, 'medium' if mixed, 'low' if uncertain\n"
                    "- Return ONLY the JSON object, nothing else"
                ),
            },
        ]

        response = await create_chat_completion(
            model=cfg.smart_llm_model,
            messages=messages,
            temperature=0.3,
            llm_provider=cfg.smart_llm_provider,
            max_tokens=1200,
            llm_kwargs=cfg.llm_kwargs,
        )

        text = (response if isinstance(response, str) else str(response)).strip()
        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            text = match.group(0)

        return json.loads(text)

    except Exception as exc:
        logger.error(f"Perplexity formatter error: {exc}")
        snippet = report[:600].strip()
        return {
            "answer": snippet + ("..." if len(report) > 600 else ""),
            "key_points": [],
            "follow_up_questions": [],
            "confidence": "medium",
        }
