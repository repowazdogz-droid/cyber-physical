# ProtocolGraph v0.1 Specification

## Overview

ProtocolGraph v0.1 is a JSON-serializable structure that represents decision protocols as directed graphs. It plugs into the Omega spine without changing gate behavior. The structure is deterministic, conservative, and makes no recommendations.

## Schema

```json
{
  "version": "0.1",
  "nodes": [
    {
      "id": "string (unique)",
      "type": "decision" | "action" | "handover" | "check" | "terminal",
      "label": "string",
      "required_facts": ["string"],
      "produces_facts": ["string"],
      "uncertainty_sources": ["string"]
    }
  ],
  "edges": [
    {
      "from": "string (node id)",
      "to": "string (node id)",
      "condition": "string",
      "missing_info_behavior": "halt" | "escalate" | "defer",
      "risk_hint": 0.0-1.0
    }
  ],
  "assumptions": ["string"],
  "required_inputs": ["string"],
  "invariants": ["string"]
}
```

## Field Definitions

### Top-Level Fields

- **version**: String identifying the ProtocolGraph spec version (currently "0.1")
- **nodes**: List of node objects defining protocol steps
- **edges**: List of edge objects defining transitions between nodes
- **assumptions**: List of strings describing assumptions made by the protocol
- **required_inputs**: List of strings identifying required input facts
- **invariants**: List of strings describing protocol invariants

### Node Fields

- **id**: Unique string identifier for the node (must be unique across all nodes)
- **type**: One of:
  - `decision`: A decision point requiring judgment
  - `action`: An action to be taken
  - `handover`: A handover to another system or human
  - `check`: A verification or validation step
  - `terminal`: An end state
- **label**: Human-readable label for the node
- **required_facts**: List of fact identifiers that must be present before this node can execute
- **produces_facts**: List of fact identifiers that this node produces
- **uncertainty_sources**: List of fact identifiers that may be uncertain when this node executes

### Edge Fields

- **from**: Node id of the source node (must reference a valid node id)
- **to**: Node id of the target node (must reference a valid node id)
- **condition**: String expression describing when this edge is taken (not evaluated by validator)
- **missing_info_behavior**: Behavior when required information is missing:
  - `halt`: Stop execution
  - `escalate`: Escalate to human or higher authority
  - `defer`: Defer decision until information is available
- **risk_hint**: Float in [0.0, 1.0] indicating relative risk level for this transition

## Validation Rules

Expression 7 (`protocol_graph_validator`) enforces:

1. **Top-level structure**: protocol_graph must be a dict with all required keys
2. **Version**: Must be a string
3. **Nodes**: Must be a list of node dicts, each with all required fields
4. **Node uniqueness**: All node ids must be unique
5. **Node types**: Must be one of the allowed types
6. **Edges**: Must be a list of edge dicts, each with all required fields
7. **Edge references**: All `from` and `to` fields must reference valid node ids
8. **Missing info behavior**: Must be one of the allowed values
9. **Risk hint**: Must be a float in [0.0, 1.0]
10. **Lists**: assumptions, required_inputs, invariants, and all fact lists must be lists of strings

## Design Principles

- **No recommendations**: The graph structure does not recommend actions
- **No diagnoses**: The graph does not diagnose conditions
- **No "next best action"**: The graph only structures constraints and transitions
- **Deterministic**: Validation is deterministic and conservative
- **Conservative**: Invalid structures are refused, not corrected

## Integration with Spine

ProtocolGraph v0.1 integrates with the Omega spine via Expression 7:

- Expression 7 validates the graph structure
- No gate behavior is changed
- The graph can be used by future expressions for:
  - Simulation generation
  - Stress testing
  - Protocol analysis
  - But never for autonomous decision-making

## Example

See `test_seventh_expression_protocol_graph_validator.py` Test 1 for a complete example.





















































