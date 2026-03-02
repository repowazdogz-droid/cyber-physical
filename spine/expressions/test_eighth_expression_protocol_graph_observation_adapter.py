"""
Test Harness for Eighth Omega Expression: Protocol Graph → Observation Adapter

This file provides explicit test cases to make Omega's protocol graph observation
adapter logic visible and auditable. No test frameworks, no mocks, no automation.

Each test case:
- Prints the test name
- Prints the input
- Prints the output

No assertions. No optimization. No helpers.
"""

from eighth_expression_protocol_graph_observation_adapter import (
    protocol_graph_to_observation
)


# Test 1: Golden path -> valid observation
print("=" * 60)
print("Test 1: Golden path -> valid observation")
print("=" * 60)
test_1_protocol_graph = {
    "version": "0.1",
    "nodes": [],
    "edges": [],
    "assumptions": [],
    "required_inputs": ["age", "severity"],
    "invariants": []
}
test_1_known_facts = {"age": 45, "severity": "high"}
test_1_uncertainty = {"age": False, "severity": False}

test_1_output = protocol_graph_to_observation(
    test_1_protocol_graph, test_1_known_facts, test_1_uncertainty
)
print("Input:")
print(f"  protocol_graph: {test_1_protocol_graph}")
print(f"  known_facts: {test_1_known_facts}")
print(f"  uncertainty: {test_1_uncertainty}")
print("Output:")
print(test_1_output)
print()


# Test 2: Missing uncertainty entry -> defaults to True
print("=" * 60)
print("Test 2: Missing uncertainty entry -> defaults to True")
print("=" * 60)
test_2_protocol_graph = {
    "version": "0.1",
    "nodes": [],
    "edges": [],
    "assumptions": [],
    "required_inputs": ["age", "severity"],
    "invariants": []
}
test_2_known_facts = {"age": 45, "severity": "high"}
test_2_uncertainty = {"age": False}

test_2_output = protocol_graph_to_observation(
    test_2_protocol_graph, test_2_known_facts, test_2_uncertainty
)
print("Input:")
print(f"  protocol_graph: {test_2_protocol_graph}")
print(f"  known_facts: {test_2_known_facts}")
print(f"  uncertainty: {test_2_uncertainty}")
print("Output:")
print(test_2_output)
print()


# Test 3: protocol_graph not dict -> empty observation
print("=" * 60)
print("Test 3: protocol_graph not dict -> empty observation")
print("=" * 60)
test_3_input = "not a dict"
test_3_known_facts = {"age": 45, "severity": "high"}
test_3_uncertainty = {"age": False}

test_3_output = protocol_graph_to_observation(
    test_3_input, test_3_known_facts, test_3_uncertainty
)
print("Input:")
print(f"  protocol_graph: not a dict")
print(f"  known_facts: {test_3_known_facts}")
print(f"  uncertainty: {test_3_uncertainty}")
print("Output:")
print(test_3_output)
print()


# Test 4: known_facts not dict -> empty observation
print("=" * 60)
print("Test 4: known_facts not dict -> empty observation")
print("=" * 60)
test_4_protocol_graph = {
    "version": "0.1",
    "nodes": [],
    "edges": [],
    "assumptions": [],
    "required_inputs": ["age", "severity"],
    "invariants": []
}
test_4_input = "not a dict"
test_4_uncertainty = {"age": False}

test_4_output = protocol_graph_to_observation(
    test_4_protocol_graph, test_4_input, test_4_uncertainty
)
print("Input:")
print(f"  protocol_graph: {test_4_protocol_graph}")
print(f"  known_facts: not a dict")
print(f"  uncertainty: {test_4_uncertainty}")
print("Output:")
print(test_4_output)
print()


# Test 5: required_inputs missing -> empty observation
print("=" * 60)
print("Test 5: required_inputs missing -> empty observation")
print("=" * 60)
test_5_protocol_graph = {
    "version": "0.1",
    "nodes": [],
    "edges": [],
    "assumptions": [],
    "invariants": []
}
test_5_known_facts = {"age": 45, "severity": "high"}
test_5_uncertainty = {"age": False}

test_5_output = protocol_graph_to_observation(
    test_5_protocol_graph, test_5_known_facts, test_5_uncertainty
)
print("Input:")
print(f"  protocol_graph: {test_5_protocol_graph}")
print(f"  known_facts: {test_5_known_facts}")
print(f"  uncertainty: {test_5_uncertainty}")
print("Output:")
print(test_5_output)
print()


# Test 6: required_inputs contains non-string -> empty observation
print("=" * 60)
print("Test 6: required_inputs contains non-string -> empty observation")
print("=" * 60)
test_6_protocol_graph = {
    "version": "0.1",
    "nodes": [],
    "edges": [],
    "assumptions": [],
    "required_inputs": ["age", 123],
    "invariants": []
}
test_6_known_facts = {"age": 45, "severity": "high"}
test_6_uncertainty = {"age": False}

test_6_output = protocol_graph_to_observation(
    test_6_protocol_graph, test_6_known_facts, test_6_uncertainty
)
print("Input:")
print(f"  protocol_graph: {test_6_protocol_graph}")
print(f"  known_facts: {test_6_known_facts}")
print(f"  uncertainty: {test_6_uncertainty}")
print("Output:")
print(test_6_output)
print()


# Test 7: required_inputs contains empty string -> empty observation
print("=" * 60)
print("Test 7: required_inputs contains empty string -> empty observation")
print("=" * 60)
test_7_protocol_graph = {
    "version": "0.1",
    "nodes": [],
    "edges": [],
    "assumptions": [],
    "required_inputs": ["age", ""],
    "invariants": []
}
test_7_known_facts = {"age": 45, "severity": "high"}
test_7_uncertainty = {"age": False}

test_7_output = protocol_graph_to_observation(
    test_7_protocol_graph, test_7_known_facts, test_7_uncertainty
)
print("Input:")
print(f"  protocol_graph: {test_7_protocol_graph}")
print(f"  known_facts: {test_7_known_facts}")
print(f"  uncertainty: {test_7_uncertainty}")
print("Output:")
print(test_7_output)
print()

