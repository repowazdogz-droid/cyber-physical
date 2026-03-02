"""
Seventh Omega Expression: Protocol Graph Validator

Purpose:
Validate ProtocolGraph v0.1 structure without making recommendations or diagnoses.
This function only checks schema, uniqueness, and reference integrity.

Assumptions:
- protocol_graph is a dict
- Nodes have unique ids
- Edges reference valid node ids
- All required fields are present

Failure Modes:
- protocol_graph is not a dict -> refuse
- Missing required top-level keys -> refuse
- Invalid types -> refuse
- Duplicate node ids -> refuse
- Edges reference non-existent nodes -> refuse
- Invalid node types -> refuse
- Invalid edge missing_info_behavior -> refuse
- Invalid risk_hint range -> refuse

Stop Conditions:
- Any validation failure -> refuse with violations list
- Otherwise -> accept

This function does not learn, optimize, or predict. It only validates structure.
"""


def protocol_graph_validator(protocol_graph: dict) -> dict:
    """
    Validate ProtocolGraph v0.1 structure.

    Args:
        protocol_graph: dict with keys:
            - version: str
            - nodes: list[dict] (each with id, type, label, required_facts, produces_facts, uncertainty_sources)
            - edges: list[dict] (each with from, to, condition, missing_info_behavior, risk_hint)
            - assumptions: list[str]
            - required_inputs: list[str]
            - invariants: list[str]

    Returns:
        dict with keys:
            - action: "refuse" | "accept"
            - reason: str
            - violations: list[str]
    """
    violations = []

    # Validate protocol_graph is a dict
    if not isinstance(protocol_graph, dict):
        return {
            'action': 'refuse',
            'reason': 'protocol_graph is not a dict',
            'violations': ['protocol_graph is not a dict']
        }

    # Check for required top-level keys
    required_keys = ['version', 'nodes', 'edges', 'assumptions', 'required_inputs', 'invariants']
    missing_keys = [key for key in required_keys if key not in protocol_graph]
    if missing_keys:
        return {
            'action': 'refuse',
            'reason': f'missing required keys: {missing_keys}',
            'violations': [f'missing required key: {key}' for key in missing_keys]
        }

    version = protocol_graph.get('version')
    nodes = protocol_graph.get('nodes')
    edges = protocol_graph.get('edges')
    assumptions = protocol_graph.get('assumptions')
    required_inputs = protocol_graph.get('required_inputs')
    invariants = protocol_graph.get('invariants')

    # Validate version
    if not isinstance(version, str):
        violations.append('version is not a string')

    # Validate nodes is a list
    if not isinstance(nodes, list):
        violations.append('nodes is not a list')
    else:
        # Validate each node
        node_ids = set()
        valid_node_types = {'decision', 'action', 'handover', 'check', 'terminal'}
        required_node_keys = ['id', 'type', 'label', 'required_facts', 'produces_facts', 'uncertainty_sources']

        for i, node in enumerate(nodes):
            if not isinstance(node, dict):
                violations.append(f'node[{i}] is not a dict')
                continue

            # Check required node keys
            missing_node_keys = [key for key in required_node_keys if key not in node]
            if missing_node_keys:
                violations.append(f'node[{i}] missing keys: {missing_node_keys}')
                continue

            node_id = node.get('id')
            node_type = node.get('type')
            label = node.get('label')
            required_facts = node.get('required_facts')
            produces_facts = node.get('produces_facts')
            uncertainty_sources = node.get('uncertainty_sources')

            # Validate node id
            if not isinstance(node_id, str):
                violations.append(f'node[{i}].id is not a string')
            elif node_id in node_ids:
                violations.append(f'node[{i}].id "{node_id}" is duplicate')
            else:
                node_ids.add(node_id)

            # Validate node type
            if not isinstance(node_type, str):
                violations.append(f'node[{i}].type is not a string')
            elif node_type not in valid_node_types:
                violations.append(f'node[{i}].type "{node_type}" not in allowed set: {valid_node_types}')

            # Validate label
            if not isinstance(label, str):
                violations.append(f'node[{i}].label is not a string')

            # Validate required_facts
            if not isinstance(required_facts, list):
                violations.append(f'node[{i}].required_facts is not a list')
            else:
                for j, fact in enumerate(required_facts):
                    if not isinstance(fact, str):
                        violations.append(f'node[{i}].required_facts[{j}] is not a string')

            # Validate produces_facts
            if not isinstance(produces_facts, list):
                violations.append(f'node[{i}].produces_facts is not a list')
            else:
                for j, fact in enumerate(produces_facts):
                    if not isinstance(fact, str):
                        violations.append(f'node[{i}].produces_facts[{j}] is not a string')

            # Validate uncertainty_sources
            if not isinstance(uncertainty_sources, list):
                violations.append(f'node[{i}].uncertainty_sources is not a list')
            else:
                for j, source in enumerate(uncertainty_sources):
                    if not isinstance(source, str):
                        violations.append(f'node[{i}].uncertainty_sources[{j}] is not a string')

    # Validate edges is a list
    if not isinstance(edges, list):
        violations.append('edges is not a list')
    else:
        # Validate each edge
        required_edge_keys = ['from', 'to', 'condition', 'missing_info_behavior', 'risk_hint']
        valid_missing_info_behaviors = {'halt', 'escalate', 'defer'}

        for i, edge in enumerate(edges):
            if not isinstance(edge, dict):
                violations.append(f'edge[{i}] is not a dict')
                continue

            # Check required edge keys
            missing_edge_keys = [key for key in required_edge_keys if key not in edge]
            if missing_edge_keys:
                violations.append(f'edge[{i}] missing keys: {missing_edge_keys}')
                continue

            edge_from = edge.get('from')
            edge_to = edge.get('to')
            condition = edge.get('condition')
            missing_info_behavior = edge.get('missing_info_behavior')
            risk_hint = edge.get('risk_hint')

            # Validate from/to reference valid node ids
            if not isinstance(edge_from, str):
                violations.append(f'edge[{i}].from is not a string')
            elif 'node_ids' in locals() and edge_from not in node_ids:
                violations.append(f'edge[{i}].from "{edge_from}" does not reference a valid node id')

            if not isinstance(edge_to, str):
                violations.append(f'edge[{i}].to is not a string')
            elif 'node_ids' in locals() and edge_to not in node_ids:
                violations.append(f'edge[{i}].to "{edge_to}" does not reference a valid node id')

            # Validate condition
            if not isinstance(condition, str):
                violations.append(f'edge[{i}].condition is not a string')

            # Validate missing_info_behavior
            if not isinstance(missing_info_behavior, str):
                violations.append(f'edge[{i}].missing_info_behavior is not a string')
            elif missing_info_behavior not in valid_missing_info_behaviors:
                violations.append(f'edge[{i}].missing_info_behavior "{missing_info_behavior}" not in allowed set: {valid_missing_info_behaviors}')

            # Validate risk_hint
            if not isinstance(risk_hint, (int, float)):
                violations.append(f'edge[{i}].risk_hint is not a number')
            else:
                risk_hint_float = float(risk_hint)
                if risk_hint_float < 0.0 or risk_hint_float > 1.0:
                    violations.append(f'edge[{i}].risk_hint {risk_hint_float} outside [0.0, 1.0]')

    # Validate assumptions
    if not isinstance(assumptions, list):
        violations.append('assumptions is not a list')
    else:
        for i, assumption in enumerate(assumptions):
            if not isinstance(assumption, str):
                violations.append(f'assumptions[{i}] is not a string')

    # Validate required_inputs
    if not isinstance(required_inputs, list):
        violations.append('required_inputs is not a list')
    else:
        for i, input_key in enumerate(required_inputs):
            if not isinstance(input_key, str):
                violations.append(f'required_inputs[{i}] is not a string')

    # Validate invariants
    if not isinstance(invariants, list):
        violations.append('invariants is not a list')
    else:
        for i, invariant in enumerate(invariants):
            if not isinstance(invariant, str):
                violations.append(f'invariants[{i}] is not a string')

    # Return result
    if violations:
        return {
            'action': 'refuse',
            'reason': 'protocol graph validation failed',
            'violations': violations
        }

    return {
        'action': 'accept',
        'reason': 'protocol graph structure valid',
        'violations': []
    }





















































