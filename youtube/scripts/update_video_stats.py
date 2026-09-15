#!/usr/bin/env python3
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GAMES = ROOT / "data" / "games.json"
STATS = ROOT / "data" / "stats.json"
API_KEY = os.environ.get("YOUTUBE_API_KEY", "").strip()
API_URL = "https://www.googleapis.com/youtube/v3/playlistItems"
UA = "Mozilla/5.0 (compatible; MarkLynxVideoStats/2.0)"

# Safety rails: never replace a known-good stats.json with a suspicious result.
MIN_EXPECTED_PLAYLISTS = 40
MIN_EXPECTED_PLAYLIST_VIDEOS = 650

def playlist_id(value):
    if not isinstance(value, str) or not value.strip():
        return None
    value = value.strip()
    if re.fullmatch(r"[A-Za-z0-9_-]{10,}", value) and "youtube" not in value:
        return value
    try:
        parsed = urllib.parse.urlparse(value)
        qs = urllib.parse.parse_qs(parsed.query)
        if qs.get("list"):
            return qs["list"][0]
    except Exception:
        pass
    m = re.search(r"(?:[?&]list=)([A-Za-z0-9_-]+)", value)
    return m.group(1) if m else None

def api_get(params):
    params = dict(params)
    params["key"] = API_KEY
    url = API_URL + "?" + urllib.parse.urlencode(params)

    # Retry temporary transport/server failures without weakening any count
    # safety checks. Genuine API/client errors still fail immediately.
    max_attempts = 3
    for attempt in range(1, max_attempts + 1):
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                return json.load(response)
        except urllib.error.HTTPError as exc:
            # Retry only transient server/rate-limit responses.
            if exc.code not in (429, 500, 502, 503, 504) or attempt == max_attempts:
                raise
        except (urllib.error.URLError, ConnectionResetError, TimeoutError):
            if attempt == max_attempts:
                raise

        wait_seconds = attempt * 2
        print(
            f"Temporary YouTube API failure; retrying in {wait_seconds}s "
            f"(attempt {attempt + 1}/{max_attempts})...",
            file=sys.stderr,
        )
        time.sleep(wait_seconds)

def fetch_playlist_video_ids(pid):
    ids = []
    token = None
    while True:
        params = {
            "part": "contentDetails",
            "playlistId": pid,
            "maxResults": 50,
        }
        if token:
            params["pageToken"] = token
        data = api_get(params)
        for item in data.get("items", []):
            vid = item.get("contentDetails", {}).get("videoId")
            if vid:
                ids.append(vid)
        token = data.get("nextPageToken")
        if not token:
            return ids

def main():
    if not API_KEY:
        raise RuntimeError("YOUTUBE_API_KEY is missing from GitHub Actions secrets")

    raw = json.loads(GAMES.read_text(encoding="utf-8"))

    direct_ids = {
        row.get("v").strip()
        for row in raw
        if isinstance(row, dict) and isinstance(row.get("v"), str) and row.get("v").strip()
    }

    playlist_ids = set()
    for row in raw:
        if not isinstance(row, dict):
            continue
        # games.json uses "pl" for the YouTube playlist ID.
        # "p" is the platform field and must never be treated as a playlist.
        pid = playlist_id(row.get("pl"))
        if pid:
            playlist_ids.add(pid)

    if len(playlist_ids) < MIN_EXPECTED_PLAYLISTS:
        raise RuntimeError(
            f"Safety stop: found only {len(playlist_ids)} playlists; "
            f"expected at least {MIN_EXPECTED_PLAYLISTS}. stats.json was NOT changed."
        )

    all_playlist_video_ids = set()
    failures = []

    for index, pid in enumerate(sorted(playlist_ids), 1):
        try:
            ids = fetch_playlist_video_ids(pid)
            if not ids:
                failures.append(f"{pid}: returned 0 items")
                print(f"[{index}/{len(playlist_ids)}] {pid}: 0 items")
                continue
            all_playlist_video_ids.update(ids)
            print(
                f"[{index}/{len(playlist_ids)}] {pid}: "
                f"{len(ids)} items; {len(all_playlist_video_ids)} unique so far"
            )
        except Exception as exc:
            failures.append(f"{pid}: {exc}")
            print(f"[{index}/{len(playlist_ids)}] {pid}: FAILED: {exc}", file=sys.stderr)

    if failures:
        print("\nPlaylist failures:", file=sys.stderr)
        for failure in failures:
            print(" - " + failure, file=sys.stderr)
        raise RuntimeError(
            f"Safety stop: {len(failures)} playlist(s) could not be counted. "
            "stats.json was NOT changed."
        )

    playlist_total = len(all_playlist_video_ids)
    if playlist_total < MIN_EXPECTED_PLAYLIST_VIDEOS:
        raise RuntimeError(
            f"Safety stop: only {playlist_total} unique playlist videos found; "
            f"expected at least {MIN_EXPECTED_PLAYLIST_VIDEOS}. stats.json was NOT changed."
        )

    # Match the site's historical definition: direct-video entries plus unique
    # videos found across all playlists. We deliberately do not deduplicate
    # direct IDs against playlist IDs because the existing 1014 checkpoint did not.
    direct_total = len(direct_ids)
    total_videos = direct_total + playlist_total

    payload = {
        "totalVideos": total_videos,
        "directVideos": direct_total,
        "playlistVideos": playlist_total,
        "playlistCount": len(playlist_ids),
        "updated": datetime.now(timezone.utc).isoformat(),
        "playlistMode": "youtube-data-api"
    }

    # Write only after every playlist has succeeded and sanity checks have passed.
    temp = STATS.with_suffix(".json.tmp")
    temp.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    temp.replace(STATS)

    print(
        f"\nPASS: {direct_total} direct + {playlist_total} playlist "
        f"= {total_videos} total across {len(playlist_ids)} playlists"
    )

if __name__ == "__main__":
    main()
