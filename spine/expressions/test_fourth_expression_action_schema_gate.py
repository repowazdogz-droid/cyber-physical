"""
Test Harness for Fourth Omega Expression: Action Schema Gate

This file provides explicit test cases to make Omega's action schema validation
logic visible and auditable. No test frameworks, no mocks, no automation.

Each test case:
- Prints the test name
- Prints the input
- Prints the output

No assertions. No optimization. No helpers.
"""

from fourth_expression_action_schema_gate import action_schema_gate


# Test 1: valid action -> accept
print("=" * 60)
print("Test 1: valid action -> accept")
print("=" * 60)
test_1_input = {
    'required_keys': ['key_a'],
    'values': {'key_a': 'value_a'},
    'uncertainty': {'key_a': False},
    'proposed_action': {
        'type': 'action_x',
        'target': 'target_1',
        'priority': 5
    },
    'allowed_action_keys': ['type', 'target', 'priority'],
    'required_action_keys': ['type', 'target'],
    'action_key_types': {
        'type': 'str',
        'target': 'str',
        'priority': 'int'
    },
    'action_value_ranges': {
        'priority': [1, 10]
    }
}
print("Input:")
print(test_1_input)
test_1_output = action_schema_gate(test_1_input)
print("Output:")
print(test_1_output)
print()


# Test 2: observation not dict -> refuse
print("=" * 60)
print("Test 2: observation not dict -> refuse")
print("=" * 60)
test_2_input = "not a dictionary"
print("Input:")
print(test_2_input)
test_2_output = action_schema_gate(test_2_input)
print("Output:")
print(test_2_output)
print()


# Test 3: missing top-level key -> refuse
print("=" * 60)
print("Test 3: missing top-level key -> refuse")
print("=" * 60)
test_3_input = {
    'required_keys': ['key_a'],
    'values': {'key_a': 'value_a'},
    'uncertainty': {'key_a': False},
    'proposed_action': {'type': 'action_x'},
    # missing 'allowed_action_keys'
    'required_action_keys': ['type'],
    'action_key_types': {'type': 'str'},
    'action_value_ranges': {}
}
print("Input:")
print(test_3_input)
test_3_output = action_schema_gate(test_3_input)
print("Output:")
print(test_3_output)
print()


# Test 4: proposed_action missing required_action_key -> refuse
print("=" * 60)
print("Test 4: proposed_action missing required_action_key -> refuse")
print("=" * 60)
test_4_input = {
    'required_keys': ['key_a'],
    'values': {'key_a': 'value_a'},
    'uncertainty': {'key_a': False},
    'proposed_action': {
        'type': 'action_x'
        # missing 'target' (required)
    },
    'allowed_action_keys': ['type', 'target'],
    'required_action_keys': ['type', 'target'],
    'action_key_types': {'type': 'str', 'target': 'str'},
    'action_value_ranges': {}
}
print("Input:")
print(test_4_input)
test_4_output = action_schema_gate(test_4_input)
print("Output:")
print(test_4_output)
print()


# Test 5: proposed_action contains disallowed key -> refuse
print("=" * 60)
print("Test 5: proposed_action contains disallowed key -> refuse")
print("=" * 60)
test_5_input = {
    'required_keys': ['key_a'],
    'values': {'key_a': 'value_a'},
    'uncertainty': {'key_a': False},
    'proposed_action': {
        'type': 'action_x',
        'target': 'target_1',
        'forbidden_key': 'value'  # disallowed
    },
    'allowed_action_keys': ['type', 'target'],
    'required_action_keys': ['type', 'target'],
    'action_key_types': {'type': 'str', 'target': 'str'},
    'action_value_ranges': {}
}
print("Input:")
print(test_5_input)
test_5_output = action_schema_gate(test_5_input)
print("Output:")
print(test_5_output)
print()


# Test 6: wrong type for a typed key -> refuse
print("=" * 60)
print("Test 6: wrong type for a typed key -> refuse")
print("=" * 60)
test_6_input = {
    'required_keys': ['key_a'],
    'values': {'key_a': 'value_a'},
    'uncertainty': {'key_a': False},
    'proposed_action': {
        'type': 'action_x',
        'target': 123  # should be str
    },
    'allowed_action_keys': ['type', 'target'],
    'required_action_keys': ['type', 'target'],
    'action_key_types': {
        'type': 'str',
        'target': 'str'
    },
    'action_value_ranges': {}
}
print("Input:")
print(test_6_input)
test_6_output = action_schema_gate(test_6_input)
print("Output:")
print(test_6_output)
print()


# Test 7: out-of-range value -> refuse
print("=" * 60)
print("Test 7: out-of-range value -> refuse")
print("=" * 60)
test_7_input = {
    'required_keys': ['key_a'],
    'values': {'key_a': 'value_a'},
    'uncertainty': {'key_a': False},
    'proposed_action': {
        'type': 'action_x',
        'target': 'target_1',
        'priority': 15  # out of range [1, 10]
    },
    'allowed_action_keys': ['type', 'target', 'priority'],
    'required_action_keys': ['type', 'target'],
    'action_key_types': {
        'type': 'str',
        'target': 'str',
        'priority': 'int'
    },
    'action_value_ranges': {
        'priority': [1, 10]
    }
}
print("Input:")
print(test_7_input)
test_7_output = action_schema_gate(test_7_input)
print("Output:")
print(test_7_output)
print()


# Test 8: missing required observation key OR uncertain required key -> refuse
print("=" * 60)
print("Test 8: missing required observation key OR uncertain required key -> refuse")
print("=" * 60)
test_8_input = {
    'required_keys': ['key_a', 'key_b'],
    'values': {'key_a': 'value_a'},
    # key_b missing
    'uncertainty': {'key_a': False},
    'proposed_action': {
        'type': 'action_x',
        'target': 'target_1'
    },
    'allowed_action_keys': ['type', 'target'],
    'required_action_keys': ['type', 'target'],
    'action_key_types': {'type': 'str', 'target': 'str'},
    'action_value_ranges': {}
}
print("Input:")
print(test_8_input)
test_8_output = action_schema_gate(test_8_input)
print("Output:")
print(test_8_output)
print()






















































