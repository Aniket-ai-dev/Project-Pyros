import urllib.request
import json

def get(url):
    resp = urllib.request.urlopen(url)
    return json.loads(resp.read())

def post(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read())

BASE = "http://localhost:8000"

# 1. Health
d = get(f"{BASE}/")
print("=== HEALTH ===")
print(json.dumps(d, indent=2))

# 2. Detection investigations
d = get(f"{BASE}/investigations?pillar=DETECTION")
print(f"\n=== DETECTION INVESTIGATIONS ({d['count']}) ===")
for inv in d["investigations"]:
    print(f"  {inv['acronym']}: {inv['name']}")

# 3. Single investigation
d = get(f"{BASE}/investigations/bass")
print(f"\n=== BASS DETAIL ===")
print(f"  Name: {d['name']}")
print(f"  Fuels: {[f['material_name'] for f in d['fuels']]}")

# 4. Related investigations
d = get(f"{BASE}/investigations/bre/related")
print(f"\n=== BRE RELATIONSHIPS ===")
print(f"  Edges: {len(d['relationships'])}")
print(f"  Hardware group: {d['hardware_group']}")

# 5. Physics bounds for Moon
d = post(f"{BASE}/physics/bounds", {"gravity_g": 0.16, "o2_pct": 34.0, "pressure_psi": 10.2})
print(f"\n=== MOON PHYSICS BOUNDS ===")
for k, v in d["bounds"].items():
    print(f"  {k}: {v}")

# 6. Graph summary
d = get(f"{BASE}/graph/summary")
print(f"\n=== GRAPH ===")
print(f"  Nodes: {d['nodes']}, Edges: {d['edges']}")

# 7. Relationship explanation
d = get(f"{BASE}/investigations/same/compare/daft")
print(f"\n=== SAME vs DAFT ===")
print(f"  {d['explanation']}")

print("\n=== ALL API ENDPOINTS VERIFIED ===")

