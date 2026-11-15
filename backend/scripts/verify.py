"""Verify knowledge base against NASA challenge description — line by line."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.data.psi_knowledge_base import PSIKnowledgeBase
kb = PSIKnowledgeBase()

fails = []
def check(name, condition, detail=""):
    status = "PASS" if condition else "FAIL"
    if not condition:
        fails.append(name)
    print(f"  [{status}] {name}")
    if detail:
        print(f"         {detail}")

print("=" * 60)
print("  VERIFICATION AGAINST CHALLENGE DESCRIPTION")
print("=" * 60)

# 1. ACME project: "six experiments"
acme = [i for i in kb.get_all() if i.project == "ACME"]
acme_names = [a.acronym for a in acme]
check("ACME has 6 experiments", len(acme) == 6,
      f"Found {len(acme)}: {acme_names}")

# 2. ACME experiments all use CIR
acme_cir = all("CIR" in i.hardware_facility for i in acme)
check("All ACME experiments use CIR", acme_cir)

# 3. ACME experiments use gaseous fuels
acme_gas = all(any(f.fuel_type.value == "gas" for f in i.fuels) for i in acme)
check("All ACME experiments use gaseous fuels", acme_gas)

# 4. FLEX uses CO2 AND helium for suppression
flex = kb.get_by_id("flex")
diluents = [a.diluent for a in flex.atmosphere]
has_co2 = any("CO2" in d for d in diluents)
has_he = any("He" in d for d in diluents)
check("FLEX suppression uses CO2 and He", has_co2 and has_he,
      f"Diluents: {diluents}")

# 5. FLEX/FLEX-2/CFI use MDCA in CIR
flex2 = kb.get_by_id("flex2")
cfi = kb.get_by_id("cfi")
mdca_ok = all("MDCA" in i.hardware_facility and "CIR" in i.hardware_facility
              for i in [flex, flex2, cfi])
check("FLEX/FLEX-2/CFI use MDCA in CIR", mdca_ok)

# 6. FLEX/FLEX-2/CFI use liquid fuel droplets
liq_ok = all(any(f.fuel_type.value == "liquid" for f in i.fuels) for i in [flex, flex2, cfi])
check("FLEX/FLEX-2/CFI use liquid fuel droplets", liq_ok)

# 7. BASS/BASS-II/SPICE/SLICE use MSG with SPICE flow duct
bass = kb.get_by_id("bass")
bass2 = kb.get_by_id("bass2")
spice = kb.get_by_id("spice")
slice_inv = kb.get_by_id("slice")
msg_ok = all("MSG" in i.hardware_facility for i in [bass, bass2, spice, slice_inv])
check("BASS/BASS-II/SPICE/SLICE use MSG", msg_ok)
spice_duct = all("SPICE" in i.hardware_facility for i in [bass, bass2, spice, slice_inv])
check("BASS/BASS-II/SPICE/SLICE use SPICE flow duct", spice_duct)

# 8. BASS/BASS-II study solid materials (fabrics, plastics)
bass_solid = any(f.fuel_type.value == "solid" for f in bass.fuels)
check("BASS studies solid materials", bass_solid,
      f"Fuels: {[f.material_name for f in bass.fuels]}")

# 9. Saffire in Cygnus
for sid in ["saffire1", "saffire2", "saffire3"]:
    s = kb.get_by_id(sid)
    check(f"{s.acronym} uses Cygnus", "Cygnus" in s.hardware_facility)

# 10. SAME/SAME-R for smoke detection
same = kb.get_by_id("same")
samer = kb.get_by_id("samer")
check("SAME is DETECTION pillar", same.fire_safety_pillar.value == "DETECTION")
check("SAME-R is DETECTION pillar", samer.fire_safety_pillar.value == "DETECTION")

# 11. DAFT/DAFT-2 share instrument with SAME
daft = kb.get_by_id("daft")
daft2 = kb.get_by_id("daft2")
check("DAFT references SAME", "same" in daft.related_investigations)
check("SAME references DAFT", "daft" in same.related_investigations)

# 12. BRE: gaseous fuels, still atmospheres, material flammability
bre = kb.get_by_id("bre")
bre_still = all(a.flow_velocity_cm_s is None for a in bre.atmosphere)
check("BRE uses still/quiescent atmospheres", bre_still)
check("BRE uses gaseous fuels", all(f.fuel_type.value == "gas" for f in bre.fuels))
check("BRE is ACME project", bre.project == "ACME")

# 13. E-FIELD Flames: simulated partial gravity via electric field
efield = kb.get_by_id("efield")
check("E-FIELD simulates partial gravity", efield.gravity.value == "SIMULATED_PARTIAL")
check("E-FIELD is ACME project", efield.project == "ACME")

# 14. CFI-G: highest O2 up to 85%
cfig = kb.get_by_id("cfig")
max_o2 = max(a.oxygen_pct for a in cfig.atmosphere)
check("CFI-G has O2 up to 85%", max_o2 >= 85,
      f"Max O2: {max_o2}%")

# 15. CFI-G: propane is mentioned as example fuel
cfig_fuels = [f.material_name.lower() for f in cfig.fuels]
has_propane = any("propane" in f for f in cfig_fuels)
check("CFI-G includes propane as fuel", has_propane,
      f"Fuels: {cfig_fuels}")

# 16. CFI-G: N2+flammable gas in chamber, O2-N2 mixture from spherical burner
cfig_burner = any("spherical burner" in (f.shape or "") for f in cfig.fuels)
check("CFI-G uses spherical burner", cfig_burner)

# 17. LUCI and FM2 are future/planned
luci = kb.get_by_id("luci")
fm2 = kb.get_by_id("fm2")
check("LUCI is partial-lunar gravity", luci.gravity.value == "PARTIAL_LUNAR")
check("FM2 is partial-lunar gravity", fm2.gravity.value == "PARTIAL_LUNAR")

# 18. Three pillars present
pillars = set(i.fire_safety_pillar.value for i in kb.get_all())
check("All 3 pillars present", pillars == {"PREVENTION", "DETECTION", "SUPPRESSION"},
      f"Pillars: {pillars}")

# 19. Moon base: 30%+ O2, 10.2 psi or less
# Check if any investigation tests near these conditions
lunar_relevant = []
for inv in kb.get_all():
    for a in inv.atmosphere:
        if a.oxygen_pct >= 30:
            lunar_relevant.append((inv.acronym, a.oxygen_pct, a.pressure_psi))
check("Investigations with >=30% O2 exist", len(lunar_relevant) > 0,
      f"Found: {lunar_relevant}")

# 20. Earth applications mentioned
has_earth_apps = all(len(i.earth_applications) > 0 for i in kb.get_all() 
                     if i.gravity.value != "PARTIAL_LUNAR")
check("All current investigations have Earth applications", has_earth_apps)

print()
print("=" * 60)
if fails:
    print(f"  FAILED CHECKS ({len(fails)}):")
    for f in fails:
        print(f"    - {f}")
else:
    print("  ALL CHECKS PASSED")
print("=" * 60)
