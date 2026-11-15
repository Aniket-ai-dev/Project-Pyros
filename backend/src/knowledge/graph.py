"""Investigation relationship graph using NetworkX.

Builds a directed graph where nodes are PSI investigations and edges
capture relationships such as shared hardware, shared project membership,
continuation links, shared instruments, and complementary fire-safety
pillars.  This allows structured traversal that pure vector search misses.
"""

from __future__ import annotations

from typing import Any

import networkx as nx

from src.data.models import Investigation


# ── Edge-type constants ──────────────────────────────────────────────────

SHARES_HARDWARE = "SHARES_HARDWARE"
SHARES_FUEL_TYPE = "SHARES_FUEL_TYPE"
SAME_PROJECT = "SAME_PROJECT"
SHARED_INSTRUMENT = "SHARED_INSTRUMENT"
CONTINUATION_OF = "CONTINUATION_OF"
COMPLEMENTARY_PILLAR = "COMPLEMENTARY_PILLAR"


class InvestigationGraph:
    """Directed graph of PSI investigation relationships.

    Once :meth:`build` has been called the graph can be queried for
    related investigations, shared-hardware groups, and natural-language
    relationship explanations.
    """

    def __init__(self) -> None:
        self._graph: nx.MultiDiGraph = nx.MultiDiGraph()
        self._investigations: dict[str, Investigation] = {}

    # ------------------------------------------------------------------ #
    #  Graph construction
    # ------------------------------------------------------------------ #

    def build(self, investigations: list[Investigation]) -> None:
        """Populate the graph from a list of ``Investigation`` records.

        All rule-based edges are derived deterministically from the
        structured fields plus challenge-description domain knowledge.

        Args:
            investigations: Full list of investigations.
        """
        self._graph.clear()
        self._investigations = {inv.id: inv for inv in investigations}

        # Add nodes
        for inv in investigations:
            self._graph.add_node(
                inv.id,
                name=inv.name,
                acronym=inv.acronym,
                project=inv.project,
                hardware=inv.hardware_facility,
                pillar=inv.fire_safety_pillar.value,
                gravity=inv.gravity.value,
            )

        inv_list = list(investigations)

        # Rule-based edge generation
        self._add_project_edges(inv_list)
        self._add_hardware_edges(inv_list)
        self._add_fuel_type_edges(inv_list)
        self._add_continuation_edges()
        self._add_shared_instrument_edges()
        self._add_complementary_pillar_edges(inv_list)

    # ── Rule-based edge generators ───────────────────────────────────

    def _add_project_edges(self, investigations: list[Investigation]) -> None:
        """Investigations in the same parent project get SAME_PROJECT edges."""
        from collections import defaultdict

        project_groups: dict[str, list[str]] = defaultdict(list)
        for inv in investigations:
            if inv.project:
                project_groups[inv.project].append(inv.id)

        for project, ids in project_groups.items():
            for i, a in enumerate(ids):
                for b in ids[i + 1 :]:
                    self._graph.add_edge(
                        a, b,
                        type=SAME_PROJECT,
                        detail=f"Both part of {project} project",
                    )
                    self._graph.add_edge(
                        b, a,
                        type=SAME_PROJECT,
                        detail=f"Both part of {project} project",
                    )

    @staticmethod
    def _facility_family(hardware: str) -> str:
        """Extract the parent facility from a hardware string.

        ``'CIR (MDCA)'`` → ``'CIR'``, ``'MSG (SPICE flow duct)'`` → ``'MSG'``.
        Strings without parentheses are returned as-is.
        """
        paren = hardware.find("(")
        if paren > 0:
            return hardware[:paren].strip()
        return hardware.strip()

    def _add_hardware_edges(self, investigations: list[Investigation]) -> None:
        """Investigations sharing hardware/facility get SHARES_HARDWARE edges.

        Groups by *both* exact hardware string and parent facility family
        (e.g. all CIR-based investigations share the CIR rack even if
        they use different internal apparatus like MDCA).
        """
        from collections import defaultdict

        # Exact hardware match
        hw_groups: dict[str, list[str]] = defaultdict(list)
        for inv in investigations:
            hw_groups[inv.hardware_facility].append(inv.id)

        for hw, ids in hw_groups.items():
            if len(ids) < 2:
                continue
            for i, a in enumerate(ids):
                for b in ids[i + 1 :]:
                    self._graph.add_edge(
                        a, b,
                        type=SHARES_HARDWARE,
                        detail=f"Both use {hw} hardware",
                    )
                    self._graph.add_edge(
                        b, a,
                        type=SHARES_HARDWARE,
                        detail=f"Both use {hw} hardware",
                    )

        # Parent-facility family match (CIR family, MSG family, etc.)
        family_groups: dict[str, list[str]] = defaultdict(list)
        for inv in investigations:
            family = self._facility_family(inv.hardware_facility)
            family_groups[family].append(inv.id)

        for family, ids in family_groups.items():
            unique_ids = list(dict.fromkeys(ids))
            if len(unique_ids) < 2:
                continue
            for i, a in enumerate(unique_ids):
                for b in unique_ids[i + 1 :]:
                    # Check if any SHARES_HARDWARE edge already exists
                    has_hw = False
                    if self._graph.has_edge(a, b):
                        for _k, d in self._graph[a][b].items():
                            if d.get("type") == SHARES_HARDWARE:
                                has_hw = True
                                break
                    if not has_hw:
                        self._graph.add_edge(
                            a, b,
                            type=SHARES_HARDWARE,
                            detail=f"Both use {family} facility family",
                        )
                    has_hw_rev = False
                    if self._graph.has_edge(b, a):
                        for _k, d in self._graph[b][a].items():
                            if d.get("type") == SHARES_HARDWARE:
                                has_hw_rev = True
                                break
                    if not has_hw_rev:
                        self._graph.add_edge(
                            b, a,
                            type=SHARES_HARDWARE,
                            detail=f"Both use {family} facility family",
                        )

    def _add_fuel_type_edges(self, investigations: list[Investigation]) -> None:
        """Investigations sharing fuel types get SHARES_FUEL_TYPE edges."""
        from collections import defaultdict

        fuel_groups: dict[str, list[str]] = defaultdict(list)
        for inv in investigations:
            for fuel in inv.fuels:
                fuel_groups[fuel.fuel_type.value].append(inv.id)

        for ft, ids in fuel_groups.items():
            unique_ids = list(dict.fromkeys(ids))  # preserve order, dedupe
            if len(unique_ids) < 2:
                continue
            for i, a in enumerate(unique_ids):
                for b in unique_ids[i + 1 :]:
                    # Check if a SHARES_FUEL_TYPE edge already exists
                    has_ft_edge = False
                    if self._graph.has_edge(a, b):
                        for _k, d in self._graph[a][b].items():
                            if d.get("type") == SHARES_FUEL_TYPE:
                                has_ft_edge = True
                                break
                    if not has_ft_edge:
                        self._graph.add_edge(
                            a, b,
                            type=SHARES_FUEL_TYPE,
                            detail=f"Both study {ft} fuels",
                        )
                        self._graph.add_edge(
                            b, a,
                            type=SHARES_FUEL_TYPE,
                            detail=f"Both study {ft} fuels",
                        )

    def _add_continuation_edges(self) -> None:
        """Hard-coded continuation relationships from challenge description."""
        continuations = [
            # Saffire series
            ("saffire1", "saffire2", "Saffire-II continues Saffire-I large-scale fire testing"),
            ("saffire2", "saffire3", "Saffire-III continues Saffire-II large-scale fire testing"),
            # FLEX series
            ("flex", "flex2", "FLEX-2 is a continuation of the FLEX droplet combustion study"),
            # BASS series
            ("bass", "bass2", "BASS-II continues BASS solid material burning experiments"),
            # SAME series
            ("same", "samer", "SAME-R is a repeat of the SAME smoke detection study"),
            # DAFT series
            ("daft", "daft2", "DAFT-2 is a continuation of the DAFT dust detection study"),
        ]
        for source, target, detail in continuations:
            if source in self._investigations and target in self._investigations:
                self._graph.add_edge(
                    source, target,
                    type=CONTINUATION_OF,
                    detail=detail,
                )

    def _add_shared_instrument_edges(self) -> None:
        """Shared instrument links from challenge description."""
        # SAME/SAME-R shared instrument with DAFT/DAFT-2
        same_ids = [
            iid for iid in ["same", "samer"]
            if iid in self._investigations
        ]
        daft_ids = [
            iid for iid in ["daft", "daft2"]
            if iid in self._investigations
        ]
        for s in same_ids:
            for d in daft_ids:
                self._graph.add_edge(
                    s, d,
                    type=SHARED_INSTRUMENT,
                    detail=(
                        "Smoke/aerosol detection instrument from SAME was "
                        "repurposed for dust detection in DAFT"
                    ),
                )
                self._graph.add_edge(
                    d, s,
                    type=SHARED_INSTRUMENT,
                    detail=(
                        "DAFT used the same instrument as SAME for dust "
                        "instead of smoke detection"
                    ),
                )

        # BRE (ACME) connects to BASS — both study material flammability
        if "bre" in self._investigations and "bass" in self._investigations:
            self._graph.add_edge(
                "bre", "bass",
                type=SHARED_INSTRUMENT,
                detail=(
                    "BRE uses gaseous fuels to emulate solid material "
                    "flammability studied directly in BASS"
                ),
            )
            self._graph.add_edge(
                "bass", "bre",
                type=SHARED_INSTRUMENT,
                detail=(
                    "BASS studies solid material flammability that BRE "
                    "emulates with gaseous fuels"
                ),
            )

    def _add_complementary_pillar_edges(
        self, investigations: list[Investigation]
    ) -> None:
        """Link investigations from different fire-safety pillars that
        study the same fuel type, creating cross-pillar insight paths."""
        for i, a in enumerate(investigations):
            for b in investigations[i + 1 :]:
                if a.fire_safety_pillar == b.fire_safety_pillar:
                    continue
                # Check for fuel-type overlap
                a_fuels = {f.fuel_type for f in a.fuels}
                b_fuels = {f.fuel_type for f in b.fuels}
                overlap = a_fuels & b_fuels
                if overlap:
                    fuel_str = ", ".join(ft.value for ft in overlap)
                    self._graph.add_edge(
                        a.id, b.id,
                        type=COMPLEMENTARY_PILLAR,
                        detail=(
                            f"{a.fire_safety_pillar.value} ({a.acronym}) ↔ "
                            f"{b.fire_safety_pillar.value} ({b.acronym}): "
                            f"both address {fuel_str} fuels"
                        ),
                    )

    # ------------------------------------------------------------------ #
    #  Query methods
    # ------------------------------------------------------------------ #

    def get_related(
        self,
        investigation_id: str,
        max_hops: int = 2,
    ) -> list[tuple[str, str, dict[str, Any]]]:
        """Return edges reachable within *max_hops* of *investigation_id*.

        Args:
            investigation_id: Starting node.
            max_hops: Maximum traversal depth.

        Returns:
            List of ``(source, target, edge_data)`` tuples.
        """
        if investigation_id not in self._graph:
            return []

        visited: set[str] = set()
        frontier: set[str] = {investigation_id}
        edges: list[tuple[str, str, dict[str, Any]]] = []

        for _ in range(max_hops):
            next_frontier: set[str] = set()
            for node in frontier:
                if node in visited:
                    continue
                visited.add(node)
                for _, target, data in self._graph.edges(node, data=True):
                    edges.append((node, target, dict(data)))
                    if target not in visited:
                        next_frontier.add(target)
            frontier = next_frontier

        return edges

    def get_shared_hardware_group(self, investigation_id: str) -> list[str]:
        """Return IDs of investigations sharing hardware with *investigation_id*.

        Args:
            investigation_id: Investigation to look up.

        Returns:
            List of investigation IDs (excluding the input).
        """
        if investigation_id not in self._graph:
            return []

        shared: set[str] = set()
        for _, target, data in self._graph.edges(investigation_id, data=True):
            if data.get("type") == SHARES_HARDWARE:
                shared.add(target)
        for source, _, data in self._graph.in_edges(investigation_id, data=True):
            if data.get("type") == SHARES_HARDWARE:
                shared.add(source)

        shared.discard(investigation_id)
        return sorted(shared)

    def explain_relationship(self, inv1: str, inv2: str) -> str:
        """Generate a natural-language explanation of how two investigations
        are related.

        Args:
            inv1: First investigation ID.
            inv2: Second investigation ID.

        Returns:
            Human-readable explanation string, or a "no relationship" message.
        """
        if inv1 not in self._graph or inv2 not in self._graph:
            return (
                f"One or both investigations ('{inv1}', '{inv2}') not found "
                f"in the graph."
            )

        # Collect all direct edges between the two nodes
        explanations: list[str] = []

        if self._graph.has_edge(inv1, inv2):
            # MultiDiGraph: inv1→inv2 may have multiple edges
            for _key, data in self._graph[inv1][inv2].items():
                explanations.append(
                    f"[{data.get('type', '?')}] {data.get('detail', 'Related')}"
                )
        if self._graph.has_edge(inv2, inv1):
            for _key, data in self._graph[inv2][inv1].items():
                detail = data.get("detail", "Related")
                candidate = f"[{data.get('type', '?')}] {detail}"
                if candidate not in explanations:
                    explanations.append(candidate)

        if not explanations:
            # Check for indirect path (up to 3 hops)
            try:
                path = nx.shortest_path(self._graph, inv1, inv2)
                if len(path) <= 4:
                    step_details: list[str] = []
                    for i in range(len(path) - 1):
                        edge_dict = self._graph[path[i]][path[i + 1]]
                        # Take the first edge's data from the MultiDiGraph
                        first_data = next(iter(edge_dict.values()))
                        step_details.append(
                            f"{path[i]} → {path[i+1]}: "
                            f"{first_data.get('detail', first_data.get('type', '?'))}"
                        )
                    return (
                        f"Indirect relationship via {len(path)-1} hop(s):\n"
                        + "\n".join(f"  {s}" for s in step_details)
                    )
            except nx.NetworkXNoPath:
                pass
            return (
                f"No direct or short-path relationship found between "
                f"'{inv1}' and '{inv2}'."
            )

        name1 = self._investigations.get(inv1)
        name2 = self._investigations.get(inv2)
        label1 = name1.acronym if name1 else inv1
        label2 = name2.acronym if name2 else inv2

        header = f"Relationship between {label1} and {label2}:\n"
        return header + "\n".join(f"  • {e}" for e in explanations)

