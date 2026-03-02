"""
Test Harness for Seventh Omega Expression: Protocol Graph Validator

This file provides explicit test cases to make Omega's protocol graph validation
logic visible and auditable. No test frameworks, no mocks, no automation.

Each test case:
- Prints the test name
- Prints the input
- Prints the output

No assertions. No optimization. No helpers.
"""

from seventh_expression_protocol_graph_validator import protocol_graph_validator


# Test 1: Valid protocol graph -> accept
print("=" * 60)
print("Test 1: Valid protocol graph -> accept")
print("=" * 60)
test_1_input = {
    'version': '0.1',
    'nodes': [
        {
            'id': 'start',
            'type': 'decision',
            'label': 'Initial decision point',
            'required_facts': ['patient_age', 'symptom_severity'],
            'produces_facts': ['initial_assessment'],
            'uncertainty_sources': ['symptom_severity']
        },
        {
            'id': 'check_vitals',
            'type': 'check',
            'label': 'Check vital signs',
            'required_facts': ['initial_assessment'],
            'produces_facts': ['vitals_data'],
            'uncertainty_sources': []
        },
        {
            'id': 'end',
            'type': 'terminal',
            'label': 'Protocol complete',
            'required_facts': ['vitals_data'],
            'produces_facts': [],
            'uncertainty_sources': []
        }
    ],
    'edges': [
        {
            'from': 'start',
            'to': 'check_vitals',
            'condition': 'initial_assessment == "proceed"',
            'missing_info_behavior': 'halt',
            'risk_hint': 0.2
        },
        {
            'from': 'check_vitals',
            'to': 'end',
            'condition': 'vitals_data != null',
            'missing_info_behavior': 'escalate',
            'risk_hint': 0.1
        }
    ],
    'assumptions': [
        'Patient is conscious',
        'Vital signs equipment is available'
    ],
    'required_inputs': ['patient_age', 'symptom_severity'],
    'invariants': [
        'No node may produce a fact that is already required by that node',
        'All edges must connect valid node ids'
    ]
}
print("Input:")
print(test_1_input)
test_1_output = protocol_graph_validator(test_1_input)
print("Output:")
print(test_1_output)
print()


# Test 2: protocol_graph not a dict -> refuse
print("=" * 60)
print("Test 2: protocol_graph not a dict -> refuse")
print("=" * 60)
test_2_input = "not a dictionary"
print("Input:")
print(test_2_input)
test_2_output = protocol_graph_validator(test_2_input)
print("Output:")
print(test_2_output)
print()


# Test 3: Missing required top-level key -> refuse
print("=" * 60)
print("Test 3: Missing required top-level key -> refuse")
print("=" * 60)
test_3_input = {
    'version': '0.1',
    'nodes': [],
    'edges': [],
    'assumptions': [],
    'required_inputs': []
    # missing 'invariants'
}
print("Input:")
print(test_3_input)
test_3_output = protocol_graph_validator(test_3_input)
print("Output:")
print(test_3_output)
print()


# Test 4: Duplicate node id -> refuse
print("=" * 60)
print("Test 4: Duplicate node id -> refuse")
print("=" * 60)
test_4_input = {
    'version': '0.1',
    'nodes': [
        {
            'id': 'start',
            'type': 'decision',
            'label': 'Start',
            'required_facts': [],
            'produces_facts': [],
            'uncertainty_sources': []
        },
        {
            'id': 'start',  # duplicate
            'type': 'action',
            'label': 'Another start',
            'required_facts': [],
            'produces_facts': [],
            'uncertainty_sources': []
        }
    ],
    'edges': [],
    'assumptions': [],
    'required_inputs': [],
    'invariants': []
}
print("Input:")
print(test_4_input)
test_4_output = protocol_graph_validator(test_4_input)
print("Output:")
print(test_4_output)
print()


# Test 5: Invalid node type -> refuse
print("=" * 60)
print("Test 5: Invalid node type -> refuse")
print("=" * 60)
test_5_input = {
    'version': '0.1',
    'nodes': [
        {
            'id': 'start',
            'type': 'invalid_type',  # not in allowed set
            'label': 'Start',
            'required_facts': [],
            'produces_facts': [],
            'uncertainty_sources': []
        }
    ],
    'edges': [],
    'assumptions': [],
    'required_inputs': [],
    'invariants': []
}
print("Input:")
print(test_5_input)
test_5_output = protocol_graph_validator(test_5_input)
print("Output:")
print(test_5_output)
print()


# Test 6: Edge references non-existent node -> refuse
print("=" * 60)
print("Test 6: Edge references non-existent node -> refuse")
print("=" * 60)
test_6_input = {
    'version': '0.1',
    'nodes': [
        {
            'id': 'start',
            'type': 'decision',
            'label': 'Start',
            'required_facts': [],
            'produces_facts': [],
            'uncertainty_sources': []
        }
    ],
    'edges': [
        {
            'from': 'start',
            'to': 'nonexistent',  # node id doesn't exist
            'condition': 'true',
            'missing_info_behavior': 'halt',
            'risk_hint': 0.5
        }
    ],
    'assumptions': [],
    'required_inputs': [],
    'invariants': []
}
print("Input:")
print(test_6_input)
test_6_output = protocol_graph_validator(test_6_input)
print("Output:")
print(test_6_output)
print()


# Test 7: Invalid missing_info_behavior -> refuse
print("=" * 60)
print("Test 7: Invalid missing_info_behavior -> refuse")
print("=" * 60)
test_7_input = {
    'version': '0.1',
    'nodes': [
        {
            'id': 'start',
            'type': 'decision',
            'label': 'Start',
            'required_facts': [],
            'produces_facts': [],
            'uncertainty_sources': []
        },
        {
            'id': 'end',
            'type': 'terminal',
            'label': 'End',
            'required_facts': [],
            'produces_facts': [],
            'uncertainty_sources': []
        }
    ],
    'edges': [
        {
            'from': 'start',
            'to': 'end',
            'condition': 'true',
            'missing_info_behavior': 'invalid_behavior',  # not in allowed set
            'risk_hint': 0.5
        }
    ],
    'assumptions': [],
    'required_inputs': [],
    'invariants': []
}
print("Input:")
print(test_7_input)
test_7_output = protocol_graph_validator(test_7_input)
print("Output:")
print(test_7_output)
print()


# Test 8: risk_hint out of range -> refuse
print("=" * 60)
print("Test 8: risk_hint out of range -> refuse")
print("=" * 60)
test_8_input = {
    'version': '0.1',
    'nodes': [
        {
            'id': 'start',
            'type': 'decision',
            'label': 'Start',
            'required_facts': [],
            'produces_facts': [],
            'uncertainty_sources': []
        },
        {
            'id': 'end',
            'type': 'terminal',
            'label': 'End',
            'required_facts': [],
            'produces_facts': [],
            'uncertainty_sources': []
        }
    ],
    'edges': [
        {
            'from': 'start',
            'to': 'end',
            'condition': 'true',
            'missing_info_behavior': 'halt',
            'risk_hint': 1.5  # out of range [0.0, 1.0]
        }
    ],
    'assumptions': [],
    'required_inputs': [],
    'invariants': []
}
print("Input:")
print(test_8_input)
test_8_output = protocol_graph_validator(test_8_input)
print("Output:")
print(test_8_output)
print()


# Test 9: Node missing required key -> refuse
print("=" * 60)
print("Test 9: Node missing required key -> refuse")
print("=" * 60)
test_9_input = {
    'version': '0.1',
    'nodes': [
        {
            'id': 'start',
            'type': 'decision',
            'label': 'Start',
            'required_facts': [],
            'produces_facts': []
            # missing 'uncertainty_sources'
        }
    ],
    'edges': [],
    'assumptions': [],
    'required_inputs': [],
    'invariants': []
}
print("Input:")
print(test_9_input)
test_9_output = protocol_graph_validator(test_9_input)
print("Output:")
print(test_9_output)
print()


# Test 10: All node types represented -> accept
print("=" * 60)
print("Test 10: All node types represented -> accept")
print("=" * 60)
test_10_input = {
    'version': '0.1',
    'nodes': [
        {
            'id': 'decision_node',
            'type': 'decision',
            'label': 'Decision',
            'required_facts': [],
            'produces_facts': [],
            'uncertainty_sources': []
        },
        {
            'id': 'action_node',
            'type': 'action',
            'label': 'Action',
            'required_facts': [],
            'produces_facts': [],
            'uncertainty_sources': []
        },
        {
            'id': 'handover_node',
            'type': 'handover',
            'label': 'Handover',
            'required_facts': [],
            'produces_facts': [],
            'uncertainty_sources': []
        },
        {
            'id': 'check_node',
            'type': 'check',
            'label': 'Check',
            'required_facts': [],
            'produces_facts': [],
            'uncertainty_sources': []
        },
        {
            'id': 'terminal_node',
            'type': 'terminal',
            'label': 'Terminal',
            'required_facts': [],
            'produces_facts': [],
            'uncertainty_sources': []
        }
    ],
    'edges': [],
    'assumptions': [],
    'required_inputs': [],
    'invariants': []
}
print("Input:")
print(test_10_input)
test_10_output = protocol_graph_validator(test_10_input)
print("Output:")
print(test_10_output)
print()





















































