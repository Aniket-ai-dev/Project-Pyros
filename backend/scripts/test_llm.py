from dotenv import load_dotenv
load_dotenv()

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
print("Checking environment...", flush=True)
from src.config import get_config
cfg = get_config()
print(f"Provider: {cfg.llm_provider}", flush=True)
print(f"Model: {cfg.llm_model}", flush=True)

from src.pipeline import _build_llm
from langchain_core.messages import HumanMessage

print("Connecting to LLM...", flush=True)
llm = _build_llm(cfg)
res = llm.invoke([HumanMessage(content="Hello Gemini, please respond with 'NASA Ready'.")])
from src.pipeline import _extract_text
reply = _extract_text(res.content)
print(f"LLM Reply: {reply.strip()}", flush=True)
