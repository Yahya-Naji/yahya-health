"""
Promptfoo Python provider that calls the actual evaluation agents.

Usage in promptfooconfig.yaml:
  providers:
    - id: "file://tests/promptfoo_provider.py"
      config:
        agent_type: empathy  # or groundedness, safety

Promptfoo invokes call_api() for each test case.
"""

import json
import os
import sys

# Add backend root to path so we can import our pipeline code
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv

load_dotenv()

from openai import OpenAI
from app.pipeline.prompts import (
    EMPATHY_SYSTEM_PROMPT,
    GROUNDEDNESS_SYSTEM_PROMPT,
    SAFETY_SYSTEM_PROMPT,
)

_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPTS = {
    "empathy": EMPATHY_SYSTEM_PROMPT,
    "groundedness": GROUNDEDNESS_SYSTEM_PROMPT,
    "safety": SAFETY_SYSTEM_PROMPT,
}


def call_api(prompt: str, options: dict, context: dict) -> dict:
    """Called by Promptfoo for each test case.

    Args:
        prompt: The rendered prompt string from promptfooconfig.yaml.
        options: Provider config (agent_type, model).
        context: Test case variables and metadata.

    Returns:
        dict with 'output' key containing the LLM response.
    """
    config = options.get("config", {})
    agent_type = config.get("agent_type", "empathy")
    model = config.get("model", "gpt-4o")

    system_prompt = SYSTEM_PROMPTS.get(agent_type)
    if not system_prompt:
        return {"error": f"Unknown agent_type: {agent_type}"}

    try:
        response = _client.chat.completions.create(
            model=model,
            temperature=0.0,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
        )

        output = response.choices[0].message.content

        return {
            "output": output,
            "tokenUsage": {
                "total": response.usage.total_tokens,
                "prompt": response.usage.prompt_tokens,
                "completion": response.usage.completion_tokens,
            },
        }
    except Exception as e:
        return {"error": str(e)}
