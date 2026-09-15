#!/usr/bin/env python3
"""
Compute the site's Total Videos outside the visitor's browser.

Phase 1 deliberately keeps the verified playlist subtotal (740) as the fallback.
Direct videos are always counted dynamically from data/games.json.

When a reliable server-side playlist source is enabled later, only this script
needs to change; the website continues reading data/stats.json.
"""
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GAMES = ROOT / "data" / "games.json"
STATS = ROOT / "data" / "stats.json"

# Verified current checkpoint. Keep as-is until the live +1 Mario validation.
PLAYLIST_TOTAL = 740

def main():
    raw = json.loads(GAMES.read_text(encoding="utf-8"))

    direct_ids = {
        row.get("v")
        for row in raw
        if isinstance(row, dict) and row.get("v")
    }
    direct_total = len(direct_ids)
    total_videos = direct_total + PLAYLIST_TOTAL

    payload = {
        "totalVideos": total_videos,
        "directVideos": direct_total,
        "playlistVideos": PLAYLIST_TOTAL,
        "updated": datetime.now(timezone.utc).isoformat(),
        "playlistMode": "verified-checkpoint"
    }

    STATS.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8"
    )
    print(
        f"Wrote stats.json: {direct_total} direct + "
        f"{PLAYLIST_TOTAL} playlist = {total_videos} total"
    )

if __name__ == "__main__":
    main()
