"""
Test Harness for Fifth Omega Expression: Decision Trace Builder

This file provides explicit test cases to make Omega's decision trace building
logic visible and auditable. No test frameworks, no mocks, no automation.

Each test case:
- Prints the test name
- Prints the input
- Prints the output

No assertions. No optimization. No helpers.
"""

from fifth_expression_decision_trace_builder import decision_trace_builder


# Test 1: valid trace builds (with Legibility & Trust fields)
print("=" * 60)
print("Test 1: valid trace builds (with Legibility & Trust fields)")
print("=" * 60)
test_1_input = {
    'observation': {
        'key_a': 'value_a',
        'key_b': 'value_b'
    },
    'gate_results': {
        'gate_1': {
            'action': 'proceed',
            'reason': 'all required keys present and certain'
        },
        'gate_2': {
            'action': 'action_x',
            'reason': 'chose first preferred action: action_x'
        },
        'gate_3': {
            'action': 'safe_mode',
            'reason': 'risk_score 0.8 >= 0.7'
        },
        'gate_4': {
            'action': 'accept',
            'reason': 'action schema valid'
        }
    },
    'final_disposition': 'proceed',
    'timestamp_utc': '2024-01-15T10:30:00Z',
    'spine_version': 'abc123',
    'modules_used': ['first_expression_decision_policy', 'second_expression_bounded_choice_policy']
}
print("Input:")
print(test_1_input)
test_1_output = decision_trace_builder(test_1_input)
print("Output:")
print(test_1_output)
print()
print("Legibility & Trust fields check:")
print(f"  trace_version: {test_1_output.get('trace_version')}")
print(f"  spine_version: {test_1_output.get('spine_version')}")
print(f"  policy_limits: {test_1_output.get('policy_limits')}")
print(f"  audience_summary keys: {list(test_1_output.get('audience_summary', {}).keys())}")
print(f"  provenance keys: {list(test_1_output.get('provenance', {}).keys())}")
print()


# Test 2: observation not dict -> error trace
print("=" * 60)
print("Test 2: observation not dict -> error trace")
print("=" * 60)
test_2_input = "not a dictionary"
print("Input:")
print(test_2_input)
test_2_output = decision_trace_builder(test_2_input)
print("Output:")
print(test_2_output)
print()


# Test 3: missing top-level key -> error trace
print("=" * 60)
print("Test 3: missing top-level key -> error trace")
print("=" * 60)
test_3_input = {
    'observation': {
        'key_a': 'value_a'
    },
    'gate_results': {
        'gate_1': {'action': 'proceed', 'reason': 'reason'},
        'gate_2': {'action': 'action_x', 'reason': 'reason'},
        'gate_3': {'action': 'safe_mode', 'reason': 'reason'},
        'gate_4': {'action': 'accept', 'reason': 'reason'}
    },
    'final_disposition': 'proceed'
    # missing 'timestamp_utc'
}
print("Input:")
print(test_3_input)
test_3_output = decision_trace_builder(test_3_input)
print("Output:")
print(test_3_output)
print()


# Test 4: missing gate_3 -> error trace
print("=" * 60)
print("Test 4: missing gate_3 -> error trace")
print("=" * 60)
test_4_input = {
    'observation': {
        'key_a': 'value_a'
    },
    'gate_results': {
        'gate_1': {'action': 'proceed', 'reason': 'reason'},
        'gate_2': {'action': 'action_x', 'reason': 'reason'},
        # missing gate_3
        'gate_4': {'action': 'accept', 'reason': 'reason'}
    },
    'final_disposition': 'proceed',
    'timestamp_utc': '2024-01-15T10:30:00Z'
}
print("Input:")
print(test_4_input)
test_4_output = decision_trace_builder(test_4_input)
print("Output:")
print(test_4_output)
print()


# Test 5: gate_2 missing "reason" -> error trace
print("=" * 60)
print("Test 5: gate_2 missing \"reason\" -> error trace")
print("=" * 60)
test_5_input = {
    'observation': {
        'key_a': 'value_a'
    },
    'gate_results': {
        'gate_1': {'action': 'proceed', 'reason': 'reason'},
        'gate_2': {
            'action': 'action_x'
            # missing 'reason'
        },
        'gate_3': {'action': 'safe_mode', 'reason': 'reason'},
        'gate_4': {'action': 'accept', 'reason': 'reason'}
    },
    'final_disposition': 'proceed',
    'timestamp_utc': '2024-01-15T10:30:00Z'
}
print("Input:")
print(test_5_input)
test_5_output = decision_trace_builder(test_5_input)
print("Output:")
print(test_5_output)
print()


# Test 6: invalid final_disposition -> error trace
print("=" * 60)
print("Test 6: invalid final_disposition -> error trace")
print("=" * 60)
test_6_input = {
    'observation': {
        'key_a': 'value_a'
    },
    'gate_results': {
        'gate_1': {'action': 'proceed', 'reason': 'reason'},
        'gate_2': {'action': 'action_x', 'reason': 'reason'},
        'gate_3': {'action': 'safe_mode', 'reason': 'reason'},
        'gate_4': {'action': 'accept', 'reason': 'reason'}
    },
    'final_disposition': 'invalid_value',  # not in allowed set
    'timestamp_utc': '2024-01-15T10:30:00Z'
}
print("Input:")
print(test_6_input)
test_6_output = decision_trace_builder(test_6_input)
print("Output:")
print(test_6_output)
print()


