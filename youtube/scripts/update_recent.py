#!/usr/bin/env python3
import json, re, urllib.request, xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

HANDLE = "marklynx8829"
CHANNEL_URL = f"https://www.youtube.com/@{HANDLE}"
OUT = Path(__file__).resolve().parents[1] / "data" / "recent.json"
UA = "Mozilla/5.0 (compatible; MarkLynxRecentUploads/1.0)"

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language":"en-US,en;q=0.9"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()

def resolve_channel_id():
    html = get(CHANNEL_URL).decode("utf-8", "replace")
    patterns = [
        r'"channelId":"(UC[0-9A-Za-z_-]{22})"',
        r'"externalId":"(UC[0-9A-Za-z_-]{22})"',
        r'youtube\.com/channel/(UC[0-9A-Za-z_-]{22})'
    ]
    for pat in patterns:
        m = re.search(pat, html)
        if m: return m.group(1)
    raise RuntimeError("Could not resolve YouTube channel ID from handle page")

def main():
    channel_id = resolve_channel_id()
    xml = get(f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}")
    root = ET.fromstring(xml)
    ns = {"atom":"http://www.w3.org/2005/Atom", "yt":"http://www.youtube.com/xml/schemas/2015", "media":"http://search.yahoo.com/mrss/"}
    videos=[]
    for entry in root.findall("atom:entry", ns):
        vid = entry.findtext("yt:videoId", default="", namespaces=ns)
        title = entry.findtext("atom:title", default="", namespaces=ns)
        published = entry.findtext("atom:published", default="", namespaces=ns)
        if not vid or not title: continue
        thumb = f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"
        videos.append({"id":vid, "title":title, "published":published, "thumbnail":thumb})
        if len(videos) == 8: break
    if not videos:
        raise RuntimeError("YouTube feed returned no public uploads")
    payload={"updated":datetime.now(timezone.utc).isoformat(), "channelId":channel_id, "videos":videos}
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False)+"\n", encoding="utf-8")
    print(f"Wrote {len(videos)} recent uploads for {channel_id}")

if __name__ == "__main__": main()
