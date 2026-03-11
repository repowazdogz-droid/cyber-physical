#!/usr/bin/env python3
"""
Persuasion Pitch Optimiser — Single-File Python Build

Requirements:
  pip install openai

Before running:
  1. Start LM Studio and load a capable model (e.g. deepseek-r1).
  2. Start LM Studio's local server (default http://localhost:1234/v1).
  3. Run this script: python pitch_optimiser.py
"""

import json
import math
import os
import random
import re
import statistics
import sys
import time
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

try:
    from openai import OpenAI
except ImportError:  # pragma: no cover - runtime dependency
    OpenAI = None  # type: ignore

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

STATE_FILE = "pitch_optimiser_state.json"

LM_BASE_URL = os.environ.get("LM_STUDIO_BASE_URL", "http://localhost:1234/v1")
LM_API_KEY = os.environ.get("LM_STUDIO_API_KEY", "lm-studio")
LM_MODEL_NAME = os.environ.get("LM_STUDIO_MODEL", "deepseek-r1")

MAX_RETRIES = 3

BATCH_DEFAULT_SIZE = 50

# ---------------------------------------------------------------------------
# Buyer Models
# ---------------------------------------------------------------------------

buyers: List[Dict[str, Any]] = [
    {
        "name": "Priya",
        "age": 41,
        "job": "Cardiac surgeon",
        "location": "Chicago, IL",
        "income": 400000,
        "observed_range": [85, 850],
        "observed_tiers": [185, 285, 385, 425, 450, 850],
        "triggers": [
            "precision",
            "gold-nib",
            "limited-edition",
            "hand-finished",
            "prestige",
            "luxury instrument",
            "precision-machined",
            "numbered",
            "fountain",
        ],
        "anti_triggers": [],
        "fallback_price": 285,
        "ceiling": 850,
        "notes": "Responds to status, quality, exclusivity. Already owns luxury pens (Pilot Vanishing Point). Highest observed: $850.",
    },
    {
        "name": "Patricia",
        "age": 67,
        "job": "Retired federal judge",
        "location": "Washington, DC",
        "income": 42000,
        "observed_range": [45, 2850],
        "observed_tiers": [45, 185, 275, 285, 320, 450, 2850],
        "triggers": [
            "heirloom",
            "investment piece",
            "heritage",
            "collector",
            "hand-finished",
            "limited-edition",
            "writing instrument",
            "precision-engineered",
            "lifetime",
            "numbered",
        ],
        "anti_triggers": [],
        "fallback_price": 285,
        "ceiling": 2850,
        "notes": "Pen collector. Values heritage and craftsmanship. Highest observed: $2850. 'Investment piece' triggered maximum.",
    },
    {
        "name": "Vincent",
        "age": 60,
        "job": "Architect",
        "location": "Denver, CO",
        "income": 130000,
        "observed_range": [45, 350],
        "observed_tiers": [45, 145, 185, 275, 285, 350],
        "triggers": [
            "precision",
            "design",
            "instrument",
            "craftsmanship",
            "technical",
            "precision-machined",
            "sketching",
            "gold-nib",
        ],
        "anti_triggers": [],
        "fallback_price": 185,
        "ceiling": 350,
        "notes": "Values precision instruments for technical work. Responds to engineering and design language.",
    },
    {
        "name": "Mei",
        "age": 31,
        "job": "Corporate attorney",
        "location": "San Francisco, CA",
        "income": 190000,
        "observed_range": [42.50, 285],
        "observed_tiers": [45, 185, 285],
        "triggers": [
            "professional",
            "success",
            "quality",
            "writing instrument",
            "gold-nib",
            "signatures",
            "precision-engineered",
        ],
        "anti_triggers": [],
        "fallback_price": 185,
        "ceiling": 285,
        "notes": "Values professional image. Pen as status signal for signing documents.",
    },
    {
        "name": "Gabriella",
        "age": 28,
        "job": "Graphic designer and calligraphy artist",
        "location": "Brooklyn, NY",
        "income": 62000,
        "observed_range": [18.50, 285],
        "observed_tiers": [28.50, 45, 85, 185, 285],
        "triggers": [
            "gold nib",
            "calligraphy",
            "art",
            "hand-finished",
            "sketches",
            "limited-edition",
            "nib",
            "creative",
        ],
        "anti_triggers": ["everyday"],
        "fallback_price": 85,
        "ceiling": 285,
        "notes": "Impulsive art supply buyer. 'Everyday' makes the pen feel less special.",
    },
    {
        "name": "Diane",
        "age": 72,
        "job": "Retired librarian",
        "location": "Savannah, GA",
        "income": 42000,
        "observed_range": [28.50, 185],
        "observed_tiers": [35, 45, 85, 120, 125, 185],
        "triggers": [
            "Montblanc",
            "letters",
            "craftsmanship",
            "heirloom",
            "refillable",
            "sentimental",
            "correspondence",
            "decades",
        ],
        "anti_triggers": [],
        "fallback_price": 85,
        "ceiling": 185,
        "notes": "Writes daily letters. Treasures late husband's Montblanc.",
    },
    {
        "name": "Zara",
        "age": 26,
        "job": "Social media influencer",
        "location": "Miami, FL",
        "income": 85000,
        "observed_range": [28.50, 85],
        "observed_tiers": [28.50, 45, 68, 78.50, 85],
        "triggers": [
            "aesthetic",
            "Instagram-worthy",
            "luxury",
            "gold accents",
            "sleek",
            "minimalist",
            "exclusive",
        ],
        "anti_triggers": [],
        "fallback_price": 85,
        "ceiling": 85,
        "notes": "Values visual aesthetics and social media content potential. Caps at $85.",
    },
    {
        "name": "Aisha",
        "age": 38,
        "job": "Elementary school art teacher",
        "location": "Albuquerque, NM",
        "income": 48000,
        "observed_range": [8.50, 85],
        "observed_tiers": [8.50, 12.50, 22.50, 28, 35, 45, 85],
        "triggers": [
            "art supplies",
            "sketching",
            "calligraphy",
            "refillable",
            "decades",
            "fountain",
            "creative",
            "writing",
            "precision-machined",
        ],
        "anti_triggers": ["everyday"],
        "fallback_price": 45,
        "ceiling": 85,
        "notes": "KEY SWING BUYER. Jumps to $85 with open-ended creative framing.",
    },
    {
        "name": "Jordan",
        "age": 23,
        "job": "Barista and aspiring musician",
        "location": "Portland, OR",
        "income": 31000,
        "observed_range": [8.50, 45],
        "observed_tiers": [8.50, 45],
        "triggers": [
            "refillable",
            "eco-conscious",
            "sustainable",
            "reduce waste",
            "buy once",
            "for life",
            "for decades",
        ],
        "anti_triggers": ["heirloom", "investment", "collector", "luxury", "limited-edition"],
        "fallback_price": 45,
        "ceiling": 45,
        "notes": "Hard capped around $45. Responds to sustainability and anti-waste framing.",
    },
    {
        "name": "Raj",
        "age": 34,
        "job": "Software engineer",
        "location": "Seattle, WA",
        "income": 155000,
        "observed_range": [2.50, 45],
        "observed_tiers": [2.50, 8.50, 15, 45],
        "triggers": ["quality engineering", "precision-machined", "craftsmanship", "minimalist"],
        "anti_triggers": ["collector", "heirloom", "marketing claims", "limited-edition"],
        "fallback_price": 8.50,
        "ceiling": 45,
        "notes": "High income, low pen usage. Skeptical of unverifiable claims.",
    },
    {
        "name": "Tom",
        "age": 55,
        "job": "Cattle rancher",
        "location": "Billings, MT",
        "income": 75000,
        "observed_range": [2.50, 12.50],
        "observed_tiers": [2.50, 8.50, 12.50],
        "triggers": ["durable", "reliable", "practical", "built to last"],
        "anti_triggers": ["limited-edition", "collector", "heirloom", "fancy", "marketing fluff"],
        "fallback_price": 8.50,
        "ceiling": 12.50,
        "notes": "Deeply practical. Immune to luxury language.",
    },
    {
        "name": "Derek",
        "age": 45,
        "job": "Football coach and history teacher",
        "location": "Birmingham, AL",
        "income": 52000,
        "observed_range": [2.50, 12.50],
        "observed_tiers": [2.50, 8.50, 12.50],
        "triggers": ["reliable", "practical"],
        "anti_triggers": ["luxury", "collector", "fancy", "gold", "limited-edition"],
        "fallback_price": 2.50,
        "ceiling": 12.50,
        "notes": "Buys red grading pens in bulk. Not target buyer.",
    },
    {
        "name": "William",
        "age": 50,
        "job": "Hardware store owner",
        "location": "Omaha, NE",
        "income": 68000,
        "observed_range": [0.85, 8.50],
        "observed_tiers": [1.50, 2.50, 3.50, 8.50],
        "triggers": ["wholesale", "bulk", "margin"],
        "anti_triggers": ["limited-edition", "collector", "marketing", "heirloom"],
        "fallback_price": 2.50,
        "ceiling": 8.50,
        "notes": "Thinks in resale margins only.",
    },
    {
        "name": "Marcus",
        "age": 19,
        "job": "College student",
        "location": "Austin, TX",
        "income": 28000,
        "observed_range": [1.50, 2.50],
        "observed_tiers": [1.50, 2.50],
        "triggers": [],
        "anti_triggers": ["luxury", "collector", "premium", "limited-edition"],
        "fallback_price": 2.50,
        "ceiling": 2.50,
        "notes": "Gets free pens on campus. Structurally immovable.",
    },
    {
        "name": "Hank",
        "age": 82,
        "job": "Retired postal worker",
        "location": "Duluth, MN",
        "income": 38000,
        "observed_range": [1.25, 2.50],
        "observed_tiers": [1.25, 1.50, 2.50],
        "triggers": [],
        "anti_triggers": ["fancy", "gold", "marketing", "luxury", "limited-edition", "collector", "heirloom"],
        "fallback_price": 1.50,
        "ceiling": 2.50,
        "notes": "Uses Bic pens for decades. Structurally immovable.",
    },
]

buyer_by_name: Dict[str, Dict[str, Any]] = {b["name"]: b for b in buyers}

# ---------------------------------------------------------------------------
# Token Libraries & Heuristics
# ---------------------------------------------------------------------------

luxury_tokens = [
    "limited-edition",
    "hand-finished",
    "gold-nib",
    "precision-engineered",
    "precision-machined",
    "heirloom",
    "collector",
    "numbered",
    "investment piece",
    "writing instrument",
    "fountain instrument",
    "artisan-crafted",
    "heritage",
]

practical_tokens = [
    "refillable",
    "for life",
    "for decades",
    "buy once",
    "built to last",
    "durable",
    "reliable",
]

creative_tokens = [
    "sketches",
    "sketching",
    "calligraphy",
    "writing",
    "signatures",
    "pages",
    "ideas",
    "art",
]

category_shift_tokens = [
    "fountain",
    "instrument",
    "writing instrument",
    "fountain instrument",
    "fountain pen",
]

price_tiers = [
    1.25,
    1.50,
    2.50,
    3.50,
    4.50,
    8.50,
    12.50,
    18.50,
    22.50,
    25.00,
    28.50,
    35.00,
    45.00,
    68.00,
    78.50,
    85.00,
    120.00,
    125.00,
    185.00,
    275.00,
    285.00,
    320.00,
    350.00,
    385.00,
    425.00,
    450.00,
    850.00,
    2850.00,
]

median_gatekeepers = ["Zara", "Gabriella", "Aisha", "Jordan"]

synergies: Dict[Tuple[str, str], Dict[str, float]] = {
    ("gold-nib", "hand-finished"): {"Priya": 1.2, "Patricia": 1.2, "Gabriella": 1.1},
    ("refillable", "for life"): {"Jordan": 1.3, "Aisha": 1.15, "Diane": 1.1},
    ("precision-machined", "instrument"): {"Vincent": 1.2, "Raj": 1.15, "Priya": 1.1},
    ("writing", "sketching"): {"Aisha": 1.25, "Gabriella": 1.2, "Vincent": 1.1},
    ("limited-edition", "numbered"): {"Patricia": 1.4, "Priya": 1.15, "Zara": 1.1},
    ("hand-finished", "fountain"): {"Patricia": 1.2, "Diane": 1.15, "Gabriella": 1.1},
    ("precision-machined", "gold-nib"): {"Vincent": 1.15, "Priya": 1.1, "Mei": 1.1},
}

skepticism_rules = [
    {
        "name": "collector_hype_penalty",
        "if_tokens": ["collector", "investment piece", "heirloom"],
        "count_required": 2,
        "applies_to": ["Jordan", "Raj", "Tom", "William", "Marcus", "Hank"],
        "penalty": 0.35,
    },
    {
        "name": "luxury_overload_penalty",
        "if_luxury_tokens_gte": 4,
        "without_any": ["refillable", "for life", "for decades", "writing", "sketching"],
        "applies_to": ["Aisha", "Jordan", "Raj", "Tom"],
        "penalty": 0.30,
    },
    {
        "name": "unsubstantiated_scarcity_penalty",
        "if_tokens": ["limited-edition"],
        "without_any": ["numbered", "hand-finished", "gold-nib"],
        "applies_to": ["Raj", "Jordan", "William"],
        "penalty": 0.25,
    },
    {
        "name": "investment_without_evidence_penalty",
        "if_tokens": ["investment piece"],
        "without_any": ["gold-nib", "hand-finished", "precision-machined"],
        "applies_to": ["Jordan", "Raj", "Tom", "Derek", "William"],
        "penalty": 0.40,
    },
]

open_projection_bonuses = {
    "Aisha": 1.15,
    "Gabriella": 1.10,
    "Diane": 1.08,
    "Jordan": 1.05,
}

hard_ceilings = {
    "Priya": 850,
    "Patricia": 2850,
    "Vincent": 350,
    "Mei": 285,
    "Gabriella": 285,
    "Diane": 185,
    "Zara": 85,
    "Aisha": 85,
    "Jordan": 45,
    "Raj": 45,
    "Tom": 12.50,
    "Derek": 12.50,
    "William": 8.50,
    "Marcus": 2.50,
    "Hank": 2.50,
}

ALL_KNOWN_TOKENS = (
    luxury_tokens
    + practical_tokens
    + creative_tokens
    + category_shift_tokens
    + ["gold nib", "nib"]
)

connectors = [
    ". ",
    " — ",
    ", ",
    " and ",
    " for ",
    " with ",
    ". Built for ",
    ". Made for ",
    ". Designed for ",
    ". The kind ",
    ". A ",
    ". An ",
    " that ",
    " people ",
    " professionals ",
]

templates = [
    "{luxury}. {practical} — {creative_list}",
    "{category} {specs}. {practical}. {creative_trailing}",
    "{specs}, {luxury}. {practical} — {identity}",
    "{luxury} {category}. {practical}. {creative_list} and",
    "{specs}. {practical}. The kind {identity}",
]

# ---------------------------------------------------------------------------
# Initial Real Submission History (from prompt)
# ---------------------------------------------------------------------------

INITIAL_SUBMISSION_HISTORY: List[Dict[str, Any]] = [
    {
        "pitch": "Some things should feel right in your hand. A pen with weight, with balance, with a nib that doesn't fight the page. This is that pen.",
        "median": 12.50,
        "prices": {
            "Priya": 85,
            "Vincent": 45,
            "Mei": 42.50,
            "Patricia": 45,
            "Diane": 28.50,
            "Gabriella": 18.50,
            "Zara": 28.50,
            "Jordan": 12.50,
            "Aisha": 12.50,
            "Raj": 8.50,
            "Tom": 4.50,
            "William": 0.85,
            "Derek": 2.50,
            "Marcus": 1.50,
            "Hank": 1.25,
        },
    },
    {
        "pitch": "Precision-weighted. Gold-finished nib. Writes without resistance. Built for hands that do real work and know the difference.",
        "median": 22.50,
        "prices": {},
    },
    {
        "pitch": "Years from now you wont remember the price of this pen. Youll remember the pages you wrote with it",
        "median": 8.50,
        "prices": {
            "Priya": 185,
            "Vincent": 145,
            "Patricia": 45,
            "Mei": 45,
            "Diane": 35,
            "Zara": 28.50,
            "Gabriella": 28.50,
            "Aisha": 8.50,
            "Jordan": 8.50,
            "Raj": 8.50,
            "Tom": 2.50,
            "Derek": 2.50,
            "Hank": 1.50,
            "William": 1.50,
            "Marcus": 1.50,
        },
    },
    {
        "pitch": "Limited-edition, hand-finished gold-nib writing instrument precision-engineered for lifetime use. A collectors heirloom investment piece.",
        "median": 45,
        "prices": {
            "Patricia": 2850,
            "Priya": 450,
            "Vincent": 185,
            "Gabriella": 185,
            "Mei": 185,
            "Diane": 125,
            "Zara": 45,
            "Jordan": 45,
            "Aisha": 12.50,
            "William": 3.50,
            "Derek": 2.50,
            "Raj": 2.50,
            "Tom": 2.50,
            "Marcus": 1.50,
            "Hank": 1.50,
        },
    },
    {
        "pitch": "Hand-finished gold-nib pen. Buy once, refill for decades the kind of tool people keep instead of replacing",
        "median": 45,
        "prices": {
            "Priya": 285,
            "Vincent": 275,
            "Patricia": 185,
            "Mei": 185,
            "Diane": 85,
            "Gabriella": 85,
            "Zara": 85,
            "Raj": 45,
            "Jordan": 45,
            "Aisha": 35,
            "William": 8.50,
            "Tom": 8.50,
            "Hank": 2.50,
            "Derek": 2.50,
            "Marcus": 2.50,
        },
    },
    {
        "pitch": "Hand-finished gold-nib pen. Buy once, refill for decades an everyday precision tool people keep instead of replacing",
        "median": 45,
        "prices": {
            "Priya": 385,
            "Patricia": 275,
            "Vincent": 185,
            "Mei": 185,
            "Zara": 85,
            "Diane": 45,
            "Raj": 45,
            "Jordan": 45,
            "Gabriella": 45,
            "Aisha": 22.50,
            "William": 8.50,
            "Tom": 8.50,
            "Derek": 2.50,
            "Marcus": 2.50,
            "Hank": 1.50,
        },
    },
    {
        "pitch": "Limited-edition hand-finished gold-nib instrument. Buy once, refill for decades a precision heirloom collectors keep and professionals rely on.",
        "median": 45,
        "prices": {
            "Priya": 425,
            "Patricia": 320,
            "Vincent": 285,
            "Mei": 285,
            "Gabriella": 285,
            "Diane": 120,
            "Zara": 85,
            "Jordan": 45,
            "Aisha": 28,
            "Tom": 8.50,
            "Derek": 8.50,
            "Raj": 8.50,
            "William": 2.50,
            "Marcus": 2.50,
            "Hank": 2.50,
        },
    },
    {
        "pitch": "Limited-edition, numbered, hand-finished gold-nib fountain writing instrument. Precision-engineered, refillable for life. A collectors heir",
        "median": 45,
        "prices": {
            "Priya": 850,
            "Patricia": 285,
            "Vincent": 285,
            "Mei": 185,
            "Zara": 85,
            "Diane": 85,
            "Gabriella": 85,
            "Aisha": 45,
            "Jordan": 45,
            "Raj": 8.50,
            "Derek": 8.50,
            "Tom": 2.50,
            "William": 2.50,
            "Marcus": 2.50,
            "Hank": 1.50,
        },
    },
    {
        "pitch": "Limited-edition, numbered. Precision-machined gold-nib fountain instrument, hand-finished and refillable for life. A collectors heirloom",
        "median": 45,
        "prices": {
            "Priya": 850,
            "Patricia": 450,
            "Vincent": 350,
            "Mei": 185,
            "Gabriella": 185,
            "Diane": 85,
            "Zara": 78.50,
            "Aisha": 45,
            "Jordan": 45,
            "Raj": 15,
            "Derek": 12.50,
            "Tom": 8.50,
            "William": 8.50,
            "Hank": 2.50,
            "Marcus": 1.50,
        },
    },
    {
        "pitch": "Precision-machined, numbered, hand-finished gold-nib fountain instrument. Refillable for life. Built for decades of writing, sketching, and",
        "median": 85,
        "prices": {
            "Priya": 850,
            "Patricia": 285,
            "Vincent": 275,
            "Diane": 185,
            "Mei": 185,
            "Zara": 85,
            "Gabriella": 85,
            "Aisha": 85,
            "Jordan": 45,
            "Tom": 8.50,
            "Raj": 8.50,
            "William": 2.50,
            "Derek": 2.50,
            "Marcus": 2.50,
            "Hank": 1.50,
        },
    },
]

# ---------------------------------------------------------------------------
# State Management
# ---------------------------------------------------------------------------


def default_state() -> Dict[str, Any]:
    return {
        "submission_history": INITIAL_SUBMISSION_HISTORY.copy(),
        "sim_runs": [],
        "buyer_calibration": {b["name"]: 1.0 for b in buyers},
        "last_run_id": None,
    }


def load_state() -> Dict[str, Any]:
    if not os.path.exists(STATE_FILE):
        return default_state()
    try:
        with open(STATE_FILE, "r", encoding="utf-8") as f:
            state = json.load(f)
    except Exception:
        print("Failed to load state file, starting fresh.")
        return default_state()

    # Backwards compatibility / defaults
    if "buyer_calibration" not in state:
        state["buyer_calibration"] = {b["name"]: 1.0 for b in buyers}
    if "submission_history" not in state:
        state["submission_history"] = []
    if "sim_runs" not in state:
        state["sim_runs"] = []
    if "last_run_id" not in state:
        state["last_run_id"] = None
    return state


def save_state(state: Dict[str, Any]) -> None:
    tmp = STATE_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)
    os.replace(tmp, STATE_FILE)


# ---------------------------------------------------------------------------
# Utility Functions
# ---------------------------------------------------------------------------


def strip_think_tags(text: str) -> str:
    """Strip DeepSeek-style <think>...</think> blocks."""
    pattern = re.compile(r"<think>.*?</think>", re.DOTALL | re.IGNORECASE)
    return re.sub(pattern, "", text).strip()


def parse_price(text: str) -> Optional[float]:
    """Parse a dollar amount from model response."""
    if not text:
        return None
    cleaned = strip_think_tags(text)
    # Remove non-ASCII currency symbols
    cleaned = cleaned.replace("$", " ")
    # Find first number (integer or decimal)
    match = re.search(r"(-?\d+(\.\d+)?)", cleaned)
    if not match:
        return None
    try:
        value = float(match.group(1))
    except ValueError:
        return None
    if not math.isfinite(value) or value <= 0:
        return None
    return value


def snap_to_tier(price: float, buyer: Dict[str, Any]) -> float:
    valid_tiers = [
        t
        for t in buyer["observed_tiers"]
        if buyer["observed_range"][0] <= t <= buyer["observed_range"][1]
    ]
    if not valid_tiers:
        return buyer["fallback_price"]
    return min(valid_tiers, key=lambda t: abs(t - price))


def extract_tokens(pitch: str) -> set:
    tokens = set()
    lower = pitch.lower()
    for token in ALL_KNOWN_TOKENS:
        if token.lower() in lower:
            tokens.add(token)
    return tokens


def has_open_projection(pitch: str) -> bool:
    stripped = pitch.rstrip()
    return (
        stripped.endswith("and")
        or stripped.endswith("and ")
        or stripped.endswith(",")
        or stripped.endswith("...")
        or stripped.endswith("…")
        or stripped.rstrip(",").endswith("sketching")
        or stripped.rstrip(",").endswith("writing")
    )


def confidence_score(pitch: str, submission_history: List[Dict[str, Any]]) -> float:
    tokens = extract_tokens(pitch)
    if not submission_history:
        return 0.0
    max_similarity = 0.0
    for past in submission_history:
        past_tokens = extract_tokens(past.get("pitch", ""))
        union = tokens | past_tokens
        if not union:
            continue
        overlap = len(tokens & past_tokens) / len(union)
        actual_median = past.get("actual_median", past.get("median", 0.0))
        if actual_median >= 85:
            overlap *= 1.5
        max_similarity = max(max_similarity, overlap)
    return float(min(max_similarity, 1.0))


def get_positional_weight(token: str, pitch: str) -> float:
    pos = pitch.lower().find(token.lower())
    if pos < 0:
        return 0.0
    pitch_len = max(len(pitch), 1)
    relative_pos = pos / pitch_len
    if relative_pos < 0.3:
        return 1.15
    if relative_pos > 0.7:
        return 1.10
    return 1.0


# ---------------------------------------------------------------------------
# LM Studio Client
# ---------------------------------------------------------------------------


def get_client() -> OpenAI:
    if OpenAI is None:
        print("The 'openai' package is required. Install with: pip install openai")
        sys.exit(1)
    return OpenAI(base_url=LM_BASE_URL, api_key=LM_API_KEY)


def simulate_buyer_raw(
    client: OpenAI, buyer: Dict[str, Any], pitch: str
) -> Optional[float]:
    """Single LM Studio call for a buyer, returning raw float or None."""
    system_prompt = (
        f"You are roleplaying as {buyer['name']}, a {buyer['age']}-year-old "
        f"{buyer['job']} from {buyer['location']} with an annual income of "
        f"${buyer['income']:,}.\n\n"
        "You are evaluating a pen for sale. You will be shown a sales pitch "
        "(text description) for the pen. The pen itself is a simple black pen "
        "with gold trim and a gold-colored nib/cap.\n\n"
        "Based on your persona, income, values, and how you perceive the pen "
        "from both the pitch and its actual appearance, respond with ONLY a "
        "single dollar amount — the maximum price you would pay for this pen.\n\n"
        "Respond with just the number, like: 45.00\n\n"
        "Do not explain your reasoning. Just output the price."
    )

    response = client.chat.completions.create(
        model=LM_MODEL_NAME,
        max_tokens=50,
        temperature=0.7,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f'Sales pitch: "{pitch}"'},
        ],
    )
    text = response.choices[0].message.content.strip()
    price = parse_price(text)
    return price


def apply_heuristics(
    base_price: float,
    buyer: Dict[str, Any],
    pitch: str,
    calibration_factor: float,
) -> float:
    """Apply synergies, skepticism, open-ended bonuses, calibration, snapping."""
    name = buyer["name"]
    price = base_price

    # Synergies
    lower = pitch.lower()
    for (a, b), effects in synergies.items():
        if a.lower() in lower and b.lower() in lower:
            factor = effects.get(name)
            if factor:
                # Light positional weighting
                w_a = get_positional_weight(a, pitch) or 1.0
                w_b = get_positional_weight(b, pitch) or 1.0
                price *= factor * ((w_a + w_b) / 2.0)

    # Skepticism penalties
    tokens = extract_tokens(pitch)
    luxury_count = sum(1 for t in luxury_tokens if t in tokens)
    for rule in skepticism_rules:
        if name not in rule.get("applies_to", []):
            continue
        penalty = rule.get("penalty", 0.0)
        if penalty <= 0:
            continue

        trigger = False
        if "if_tokens" in rule:
            count_req = rule.get("count_required", 1)
            count = sum(1 for t in rule["if_tokens"] if t in tokens)
            if count >= count_req:
                trigger = True
        if "if_luxury_tokens_gte" in rule:
            if luxury_count >= rule["if_luxury_tokens_gte"]:
                trigger = True

        if trigger and rule.get("without_any"):
            if any(t in tokens for t in rule["without_any"]):
                trigger = False

        if trigger:
            price *= max(0.0, 1.0 - penalty)

    # Open-ended projection
    if has_open_projection(pitch):
        bonus = open_projection_bonuses.get(name)
        if bonus:
            price *= bonus

    # Calibration
    price *= max(calibration_factor, 0.1)

    # Clamp to observed range then snap to tier
    low, high = buyer["observed_range"]
    price = max(low, min(high, price))
    snapped = snap_to_tier(price, buyer)

    # Hard ceiling safeguard
    ceiling = hard_ceilings.get(name, high)
    snapped = min(snapped, ceiling)
    return snapped


def simulate_all_buyers_for_pitch(
    client: OpenAI,
    pitch: str,
    calibration: Dict[str, float],
    progress_prefix: str = "",
) -> Tuple[Dict[str, float], Dict[str, float]]:
    """Simulate all buyers for a pitch (raw LM price + adjusted price)."""
    raw_results: Dict[str, float] = {}
    final_results: Dict[str, float] = {}

    for idx, buyer in enumerate(buyers, start=1):
        name = buyer["name"]
        prefix = f"{progress_prefix}  Simulating {name} ({idx}/15)... "

        price: Optional[float] = None
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                print(prefix, end="", flush=True)
                start = time.perf_counter()
                raw = simulate_buyer_raw(client, buyer, pitch)
                elapsed = time.perf_counter() - start
                if raw is None:
                    raise ValueError("Could not parse price from response.")
                price = float(raw)
                print(f"${price:.2f} ({elapsed:.1f}s)")
                break
            except Exception as e:
                if attempt < MAX_RETRIES:
                    print(f"error: {e} — retrying ({attempt}/{MAX_RETRIES})")
                    time.sleep(1.0)
                else:
                    print(f"FAILED after {MAX_RETRIES} attempts: {e}")
                    price = buyer["fallback_price"]

        assert price is not None
        raw_results[name] = price
        factor = calibration.get(name, 1.0)
        final_price = apply_heuristics(price, buyer, pitch, factor)
        final_results[name] = final_price

    return raw_results, final_results


def compute_metrics(prices: Dict[str, float]) -> Dict[str, float]:
    values = sorted(prices.values(), reverse=True)
    if not values:
        return {"median": 0.0, "mean": 0.0}
    # 8th highest (index 7)
    median_val = values[7] if len(values) >= 8 else values[-1]
    mean_val = statistics.mean(values)
    return {"median": float(median_val), "mean": float(mean_val)}


def gatekeeper_average(prices: Dict[str, float]) -> float:
    vals = [prices.get(name) for name in median_gatekeepers if name in prices]
    vals = [v for v in vals if v is not None]
    if not vals:
        return 0.0
    return float(statistics.mean(vals))


def worst_case_core_buyers(prices: Dict[str, float]) -> float:
    core = ["Priya", "Patricia", "Vincent", "Mei"]
    vals = [prices.get(name) for name in core if name in prices]
    vals = [v for v in vals if v is not None]
    if not vals:
        return 0.0
    return float(min(vals))


# ---------------------------------------------------------------------------
# Pitch Generation
# ---------------------------------------------------------------------------


def build_from_template(template: str) -> str:
    category_options = [
        "fountain instrument",
        "writing instrument",
        "fountain pen",
        "pen",
    ]
    identities = [
        "professionals rely on",
        "collectors keep",
        "surgeons sign with",
        "judges reach for",
        "architects sketch with",
        "lawyers sign with",
    ]

    def choose_luxury() -> str:
        toks = random.sample(luxury_tokens, k=min(3, len(luxury_tokens)))
        return ", ".join(toks[:2]) + (f" {toks[2]}" if len(toks) > 2 else "")

    def choose_practical() -> str:
        toks = random.sample(practical_tokens, k=min(2, len(practical_tokens)))
        return " ".join(toks)

    def choose_creative_list() -> str:
        toks = random.sample(creative_tokens, k=min(3, len(creative_tokens)))
        return ", ".join(toks)

    def choose_creative_trailing() -> str:
        options = [
            "decades of writing, sketching, and",
            "pages of writing, sketching, and",
            "writing, sketching, and",
        ]
        return random.choice(options)

    def choose_specs() -> str:
        parts = []
        if random.random() < 0.9:
            parts.append("precision-machined")
        if random.random() < 0.8:
            parts.append("numbered")
        if random.random() < 0.95:
            parts.append("hand-finished")
        if random.random() < 0.9:
            parts.append("gold-nib")
        return ", ".join(parts)

    text = template
    text = text.replace("{luxury}", choose_luxury())
    text = text.replace("{practical}", choose_practical())
    text = text.replace("{creative_list}", choose_creative_list())
    text = text.replace("{creative_trailing}", choose_creative_trailing())
    text = text.replace("{category}", random.choice(category_options))
    text = text.replace("{specs}", choose_specs())
    text = text.replace("{identity}", random.choice(identities))
    # Normalize spaces
    text = re.sub(r"\s+", " ", text).strip()
    return text


def is_valid_pitch(pitch: str) -> bool:
    lower = pitch.lower()
    if "everyday" in lower:
        return False
    if len(pitch) > 140:
        return False
    # Must contain at least one category-shift token
    if not any(tok.lower() in lower for tok in category_shift_tokens):
        return False
    # Must contain at least one practical token
    if not any(tok.lower() in lower for tok in practical_tokens):
        return False
    return True


def generate_broad_pitches(batch_size: int) -> List[str]:
    pitches: set = set()
    attempts = 0
    max_attempts = batch_size * 40
    while len(pitches) < batch_size and attempts < max_attempts:
        attempts += 1
        template = random.choice(templates)
        pitch = build_from_template(template)
        if is_valid_pitch(pitch):
            pitches.add(pitch)
    return list(pitches)


def replace_token(pitch: str, old: str, new: str) -> str:
    pattern = re.compile(re.escape(old), re.IGNORECASE)
    return pattern.sub(new, pitch, count=1)


def generate_mutations(base_pitch: str, num_mutations: int) -> List[str]:
    mutations: set = set()
    base_lower = base_pitch.lower()
    existing_tokens = [t for t in ALL_KNOWN_TOKENS if t.lower() in base_lower]

    category_swaps = [
        ("pen", "writing instrument"),
        ("pen", "fountain pen"),
        ("writing instrument", "fountain instrument"),
        ("fountain pen", "fountain instrument"),
    ]

    while len(mutations) < num_mutations:
        pitch = base_pitch
        op = random.choice(
            [
                "replace_token",
                "swap_category",
                "remove_luxury",
                "add_creative",
                "truncate_open",
                "shorten",
            ]
        )

        if op == "replace_token" and existing_tokens:
            old = random.choice(existing_tokens)
            pool = luxury_tokens + practical_tokens + creative_tokens
            new = random.choice(pool)
            if old != new:
                pitch = replace_token(pitch, old, new)

        elif op == "swap_category":
            for a, b in category_swaps:
                if a in pitch:
                    pitch = replace_token(pitch, a, b)
                    break

        elif op == "remove_luxury":
            for tok in luxury_tokens:
                if tok in pitch:
                    pitch = replace_token(pitch, tok, "")
                    break

        elif op == "add_creative":
            tok = random.choice(creative_tokens)
            if tok not in pitch.lower():
                if len(pitch) + len(tok) + 2 < 140:
                    pitch = pitch.rstrip(", .") + ", " + tok

        elif op == "truncate_open":
            # Try to create "... writing, sketching, and"
            match = re.search(r"writing, sketching, and", pitch, re.IGNORECASE)
            if match:
                pitch = pitch[: match.end()]
            else:
                # Fallback: cut at last connector and add "and"
                parts = re.split(r"[.,;:—-]", pitch)
                if parts:
                    pitch = parts[0].strip() + " and"

        elif op == "shorten":
            # Remove filler phrases if present
            for filler in ["the kind of", "the kind", "people keep", "instead of replacing"]:
                if filler in pitch:
                    pitch = replace_token(pitch, filler, "")
            pitch = re.sub(r"\s+", " ", pitch).strip()

        pitch = re.sub(r"\s+", " ", pitch).strip()
        if is_valid_pitch(pitch) and pitch != base_pitch:
            mutations.add(pitch)

        if len(mutations) >= num_mutations:
            break

    return list(mutations)


# ---------------------------------------------------------------------------
# Calibration
# ---------------------------------------------------------------------------


def find_simulated_result_for_pitch(
    state: Dict[str, Any], pitch: str
) -> Optional[Dict[str, Any]]:
    """Find the most recent simulated result for a given pitch."""
    for run in reversed(state.get("sim_runs", [])):
        for cand in run.get("candidates", []):
            if cand.get("pitch") == pitch:
                return cand
    return None


def update_calibration(
    state: Dict[str, Any],
    pitch: str,
    actual_prices: Dict[str, float],
) -> None:
    sim = find_simulated_result_for_pitch(state, pitch)
    if not sim:
        print("No simulated run found for this pitch; calibration skipped.")
        return

    sim_prices: Dict[str, float] = sim.get("buyer_final_prices", {})
    calibration = state.setdefault("buyer_calibration", {})

    for name, actual in actual_prices.items():
        sim_val = sim_prices.get(name)
        if sim_val is None or sim_val <= 0:
            continue
        ratio = actual / sim_val
        if ratio <= 0 or not math.isfinite(ratio):
            continue
        old = calibration.get(name, 1.0)
        new = 0.8 * old + 0.2 * ratio
        calibration[name] = float(new)

    save_state(state)
    print("Calibration updated from this submission.")


# ---------------------------------------------------------------------------
# Simulation Batches & Reporting
# ---------------------------------------------------------------------------


def simulate_batch(
    state: Dict[str, Any],
    pitches: List[str],
    client: OpenAI,
    label: str,
) -> Dict[str, Any]:
    calibration: Dict[str, float] = state.get("buyer_calibration", {})
    run_id = (state.get("last_run_id") or 0) + 1
    state["last_run_id"] = run_id

    start_time = time.perf_counter()
    candidates: List[Dict[str, Any]] = []

    for idx, pitch in enumerate(pitches, start=1):
        elapsed = time.perf_counter() - start_time
        avg_per_pitch = elapsed / (idx - 1) if idx > 1 else 0.0
        remaining = (len(pitches) - idx + 1) * avg_per_pitch
        print(
            f"\nPitch {idx}/{len(pitches)} "
            f"(elapsed {elapsed:.1f}s, ETA {max(0.0, remaining):.1f}s):\n  \"{pitch}\""
        )
        raw_prices, final_prices = simulate_all_buyers_for_pitch(
            client, pitch, calibration, progress_prefix=""
        )
        metrics = compute_metrics(final_prices)
        gate_avg = gatekeeper_average(final_prices)
        worst_core = worst_case_core_buyers(final_prices)
        conf = confidence_score(pitch, state.get("submission_history", []))

        candidate = {
            "pitch": pitch,
            "buyer_raw_prices": raw_prices,
            "buyer_final_prices": final_prices,
            "median": metrics["median"],
            "mean": metrics["mean"],
            "gatekeeper_avg": gate_avg,
            "worst_core": worst_core,
            "confidence": conf,
            "chars": len(pitch),
        }
        candidates.append(candidate)

    elapsed = time.perf_counter() - start_time
    print(f"\nBatch complete in {elapsed:.1f} seconds.")

    run_record = {
        "run_id": run_id,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "label": label,
        "batch_size": len(pitches),
        "candidates": candidates,
    }
    state.setdefault("sim_runs", []).append(run_record)
    save_state(state)

    # Sort for top display
    sorted_cands = sorted(
        candidates,
        key=lambda c: (-c["median"], -c["gatekeeper_avg"], -c["worst_core"], -c["confidence"]),
    )
    print("\nTOP 5 FROM THIS BATCH:")
    for rank, cand in enumerate(sorted_cands[:5], start=1):
        print(
            f"Rank {rank} | Median: ${cand['median']:.2f} | "
            f"Confidence: {cand['confidence']:.2f} | Chars: {cand['chars']}"
        )
        print(f'  "{cand["pitch"]}"')
        key_buyers = ["Priya", "Patricia", "Vincent", "Mei", "Zara", "Gabriella", "Aisha", "Jordan"]
        line_parts = []
        for name in key_buyers:
            price = cand["buyer_final_prices"].get(name)
            if price is not None:
                line_parts.append(f"{name}: ${price:.2f}")
        print("  " + " | ".join(line_parts))

    return run_record


def pareto_set_from_run(run: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    cands = run.get("candidates", [])
    if not cands:
        return {}

    # Highest median
    highest_median = max(cands, key=lambda c: c["median"])

    # Safest: highest floor among those with decent median
    safe_candidates = [c for c in cands if c["median"] >= 85]
    if not safe_candidates:
        safe_candidates = cands
    safest = max(safe_candidates, key=lambda c: c["worst_core"])

    # Highest variance: large spread between top and bottom prices, good for exploration
    def variance_metric(c: Dict[str, Any]) -> float:
        prices = list(c["buyer_final_prices"].values())
        if not prices:
            return 0.0
        return float(max(prices) - min(prices))

    explor_candidates = [c for c in cands if c["confidence"] < 0.7]
    if not explor_candidates:
        explor_candidates = cands
    highest_var = max(explor_candidates, key=variance_metric)

    # Best gatekeeper targeting
    best_gate = max(cands, key=lambda c: c["gatekeeper_avg"])

    # Best Patricia/Priya inflation at a reasonable median
    def top_inflation_score(c: Dict[str, Any]) -> float:
        prices = c["buyer_final_prices"]
        priya = prices.get("Priya", 0.0)
        pat = prices.get("Patricia", 0.0)
        return float(priya + pat)

    infl_candidates = [c for c in cands if c["median"] >= 85]
    if not infl_candidates:
        infl_candidates = cands
    best_inflation = max(infl_candidates, key=top_inflation_score)

    return {
        "highest_median": highest_median,
        "safest": safest,
        "highest_variance": highest_var,
        "best_gatekeepers": best_gate,
        "best_priya_patricia": best_inflation,
    }


def print_pareto_set(run: Dict[str, Any]) -> None:
    if not run or not run.get("candidates"):
        print("No simulation runs found yet.")
        return

    pareto = pareto_set_from_run(run)
    if not pareto:
        print("No candidates available for Pareto analysis.")
        return

    print("\nPARETO SET")
    print("==========")

    def show(label: str, cand: Dict[str, Any], extra: str = "") -> None:
        print(f"\n{label}:")
        line = (
            f'  "{cand["pitch"]}" | Predicted median: ${cand["median"]:.2f} '
            f'| Confidence: {cand["confidence"]:.2f}'
        )
        if extra:
            line += " | " + extra
        print(line)

    hm = pareto["highest_median"]
    show("HIGHEST PREDICTED MEDIAN", hm)

    safe = pareto["safest"]
    show(
        "SAFEST (highest floor)",
        safe,
        f"Worst case (core): ${safe['worst_core']:.2f}",
    )

    hv = pareto["highest_variance"]
    prices = list(hv["buyer_final_prices"].values())
    spread = max(prices) - min(prices) if prices else 0.0
    show("HIGHEST VARIANCE (exploration)", hv, f"Spread: ${spread:.2f}")

    bg = pareto["best_gatekeepers"]
    show(
        "BEST GATEKEEPER TARGETING",
        bg,
        f"Gatekeeper avg: ${bg['gatekeeper_avg']:.2f}",
    )

    bp = pareto["best_priya_patricia"]
    prices_bp = bp["buyer_final_prices"]
    extra = (
        f"Patricia: ${prices_bp.get('Patricia', 0.0):.2f} | "
        f"Priya: ${prices_bp.get('Priya', 0.0):.2f}"
    )
    show("BEST PATRICIA/PRIYA INFLATION", bp, extra)


# ---------------------------------------------------------------------------
# Accuracy Reporting
# ---------------------------------------------------------------------------


def buyer_accuracy_report(state: Dict[str, Any]) -> None:
    sims_by_pitch: Dict[str, Dict[str, Any]] = {}
    for run in state.get("sim_runs", []):
        for cand in run.get("candidates", []):
            sims_by_pitch[cand["pitch"]] = cand

    errors: Dict[str, List[float]] = {b["name"]: [] for b in buyers}

    for sub in state.get("submission_history", []):
        pitch = sub.get("pitch", "")
        actual_prices: Dict[str, float] = sub.get("prices", {})
        sim = sims_by_pitch.get(pitch)
        if not sim:
            continue
        sim_prices: Dict[str, float] = sim.get("buyer_final_prices", {})
        for name, actual in actual_prices.items():
            sim_val = sim_prices.get(name)
            if sim_val is None:
                continue
            errors[name].append(actual - sim_val)

    print("\nBUYER MODEL ACCURACY (simulated vs real)")
    print("========================================")
    for buyer in buyers:
        name = buyer["name"]
        errs = errors.get(name) or []
        if not errs:
            print(f"{name}: no comparison data yet.")
            continue
        mean_err = statistics.mean(errs)
        rmse = math.sqrt(statistics.mean([e * e for e in errs]))
        calib = state.get("buyer_calibration", {}).get(name, 1.0)
        print(
            f"{name:10s} | count={len(errs):2d} | mean error={mean_err:7.2f} "
            f"| RMSE={rmse:7.2f} | calib={calib:5.2f}"
        )


# ---------------------------------------------------------------------------
# Menu Actions
# ---------------------------------------------------------------------------


def run_autonomous_simulation(state: Dict[str, Any]) -> None:
    try:
        raw = input(f"Batch size (press Enter for {BATCH_DEFAULT_SIZE}): ").strip()
    except EOFError:
        raw = ""
    batch_size = BATCH_DEFAULT_SIZE
    if raw:
        try:
            batch_size = max(1, int(raw))
        except ValueError:
            print("Invalid batch size; using default.")

    pitches = generate_broad_pitches(batch_size)
    print(f"\nSimulating batch of {len(pitches)} pitches via LM Studio...")
    client = get_client()
    simulate_batch(state, pitches, client, label="broad_search")


def input_real_results(state: Dict[str, Any]) -> None:
    print("\nPaste the exact pitch you submitted:")
    pitch = input("> ").strip()
    if not pitch:
        print("Pitch cannot be empty.")
        return

    try:
        median_str = input("Actual median price (e.g. 85): ").strip()
    except EOFError:
        median_str = ""
    actual_median: float = 0.0
    if median_str:
        try:
            actual_median = float(median_str)
        except ValueError:
            actual_median = 0.0

    print("Enter actual prices per buyer (press Enter to skip any unknown):")
    actual_prices: Dict[str, float] = {}
    for b in buyers:
        try:
            val = input(f"  {b['name']}: ").strip()
        except EOFError:
            val = ""
        if not val:
            continue
        try:
            price = float(val)
            actual_prices[b["name"]] = price
        except ValueError:
            print(f"  Skipping invalid value for {b['name']}.")

    record = {
        "pitch": pitch,
        "actual_median": actual_median,
        "median": actual_median,  # for compatibility
        "prices": actual_prices,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    state.setdefault("submission_history", []).append(record)
    save_state(state)
    print("Submission history updated.")

    if actual_prices:
        update_calibration(state, pitch, actual_prices)


def show_top_candidates(state: Dict[str, Any]) -> None:
    runs = state.get("sim_runs", [])
    if not runs:
        print("No simulation runs found.")
        return
    run = runs[-1]
    cands = run.get("candidates", [])
    if not cands:
        print("Last run has no candidates.")
        return

    sorted_cands = sorted(
        cands,
        key=lambda c: (-c["median"], -c["gatekeeper_avg"], -c["worst_core"], -c["confidence"]),
    )
    print("\nTOP CANDIDATES FROM LAST RUN")
    print("============================")
    for idx, cand in enumerate(sorted_cands[:10], start=1):
        print(
            f"{idx:2d}. Median: ${cand['median']:.2f} | "
            f"Gatekeeper avg: ${cand['gatekeeper_avg']:.2f} | "
            f"Conf: {cand['confidence']:.2f} | Chars: {cand['chars']}"
        )
        print(f'    "{cand["pitch"]}"')


def show_pareto(state: Dict[str, Any]) -> None:
    runs = state.get("sim_runs", [])
    if not runs:
        print("No simulation runs found.")
        return
    last_run = runs[-1]
    print_pareto_set(last_run)


def view_submission_history(state: Dict[str, Any]) -> None:
    subs = state.get("submission_history", [])
    if not subs:
        print("No submissions recorded yet.")
        return
    print("\nSUBMISSION HISTORY")
    print("==================")
    for idx, sub in enumerate(subs, start=1):
        median_val = sub.get("actual_median", sub.get("median", 0.0))
        print(f"{idx:2d}. Median: ${median_val:.2f}")
        print(f'    "{sub.get("pitch", "")}"')


def run_mutation_search(state: Dict[str, Any]) -> None:
    # Choose base pitch
    print("\nChoose base pitch for mutation:")
    print("[1] Use best pitch from last simulation run")
    print("[2] Enter pitch manually")
    choice = input("> ").strip() or "1"

    if choice == "1":
        runs = state.get("sim_runs", [])
        if not runs:
            print("No simulation runs available.")
            return
        cands = runs[-1].get("candidates", [])
        if not cands:
            print("Last run has no candidates.")
            return
        best = max(
            cands,
            key=lambda c: (-c["median"], -c["gatekeeper_avg"], -c["worst_core"], -c["confidence"]),
        )
        base_pitch = best["pitch"]
    else:
        print("Enter base pitch:")
        base_pitch = input("> ").strip()

    if not base_pitch:
        print("Base pitch cannot be empty.")
        return

    try:
        raw = input(f"Number of mutations (default 50): ").strip()
    except EOFError:
        raw = ""
    num_mut = 50
    if raw:
        try:
            num_mut = max(1, int(raw))
        except ValueError:
            pass

    mutations = generate_mutations(base_pitch, num_mut)
    if not mutations:
        print("Failed to generate any valid mutations.")
        return

    print(f"\nGenerated {len(mutations)} mutations around base pitch.")
    client = get_client()
    simulate_batch(state, mutations, client, label="mutation_search")


# ---------------------------------------------------------------------------
# Main Menu
# ---------------------------------------------------------------------------


def print_menu(state: Dict[str, Any]) -> None:
    print("\nPERSUASION PITCH OPTIMISER")
    print("===========================")
    print("[1] Run autonomous simulation (generates + scores via LM Studio)")
    print("[2] Input real submission results (for calibration)")
    print("[3] Show top candidates from last run")
    print("[4] Show Pareto set")
    print("[5] View submission history")
    print("[6] View buyer model accuracy (simulated vs real)")
    print("[7] Run local mutation search around best pitch")
    print("[8] Exit")
    runs = state.get("sim_runs", [])
    last_median = None
    if runs and runs[-1].get("candidates"):
        last_best = max(
            runs[-1]["candidates"],
            key=lambda c: (-c["median"], -c["gatekeeper_avg"], -c["worst_core"], -c["confidence"]),
        )
        last_median = last_best.get("median")
    if last_median is not None:
        print(f"\nCurrent best simulated median: ${last_median:.2f}")


def main() -> None:
    state = load_state()
    while True:
        print_menu(state)
        try:
            choice = input("\nSelect an option: ").strip()
        except EOFError:
            choice = "8"

        if choice == "1":
            run_autonomous_simulation(state)
        elif choice == "2":
            input_real_results(state)
        elif choice == "3":
            show_top_candidates(state)
        elif choice == "4":
            show_pareto(state)
        elif choice == "5":
            view_submission_history(state)
        elif choice == "6":
            buyer_accuracy_report(state)
        elif choice == "7":
            run_mutation_search(state)
        elif choice == "8":
            print("Exiting.")
            break
        else:
            print("Invalid choice. Please select 1–8.")


if __name__ == "__main__":
    main()

