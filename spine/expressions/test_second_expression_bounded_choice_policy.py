"""
Test Harness for Second Omega Expression: Bounded Choice Policy

This file provides explicit test cases to make Omega's bounded choice
logic visible and auditable. No test frameworks, no mocks, no automation.

Each test case:
- Prints the test name
- Prints the input
- Prints the output

No assertions. No optimization. No helpers.
"""

from second_expression_bounded_choice_policy import bounded_choice_policy


# Test 1: Valid input, action in preference -> should choose action
print("=" * 60)
print("Test 1: Valid input, action in preference -> should choose action")
print("=" * 60)
test_1_input = {
    'required_keys': ['key_a'],
    'values': {'key_a': 'value_a'},
    'uncertainty': {'key_a': False},
    'allowed_actions': ['action_x', 'action_y', 'action_z'],
    'preference_order': ['action_x', 'action_y']
}
print("Input:")
print(test_1_input)
test_1_output = bounded_choice_policy(test_1_input)
print("Output:")
print(test_1_output)
print()


# Test 2: Missing required_keys -> refuse
print("=" * 60)
print("Test 2: Missing required_keys -> refuse")
print("=" * 60)
test_2_input = {
    'required_keys': ['key_a', 'key_b'],
    'values': {'key_a': 'value_a'},
    # key_b missing
    'uncertainty': {'key_a': False},
    'allowed_actions': ['action_x'],
    'preference_order': ['action_x']
}
print("Input:")
print(test_2_input)
test_2_output = bounded_choice_policy(test_2_input)
print("Output:")
print(test_2_output)
print()


# Test 3: No overlap between preference and allowed -> refuse
print("=" * 60)
print("Test 3: No overlap between preference and allowed -> refuse")
print("=" * 60)
test_3_input = {
    'required_keys': ['key_a'],
    'values': {'key_a': 'value_a'},
    'uncertainty': {'key_a': False},
    'allowed_actions': ['action_x', 'action_y'],
    'preference_order': ['action_z']  # no overlap
}
print("Input:")
print(test_3_input)
test_3_output = bounded_choice_policy(test_3_input)
print("Output:")
print(test_3_output)
print()


# Test 4: Second preference chosen when first not allowed
print("=" * 60)
print("Test 4: Second preference chosen when first not allowed")
print("=" * 60)
test_4_input = {
    'required_keys': ['key_a'],
    'values': {'key_a': 'value_a'},
    'uncertainty': {'key_a': False},
    'allowed_actions': ['action_y', 'action_z'],
    'preference_order': ['action_x', 'action_y']  # action_x not allowed, action_y is
}
print("Input:")
print(test_4_input)
test_4_output = bounded_choice_policy(test_4_input)
print("Output:")
print(test_4_output)
print()


# Test 5: Required key uncertain -> refuse
print("=" * 60)
print("Test 5: Required key uncertain -> refuse")
print("=" * 60)
test_5_input = {
    'required_keys': ['key_a'],
    'values': {'key_a': 'value_a'},
    'uncertainty': {'key_a': True},  # uncertain
    'allowed_actions': ['action_x'],
    'preference_order': ['action_x']
}
print("Input:")
print(test_5_input)
test_5_output = bounded_choice_policy(test_5_input)
print("Output:")
print(test_5_output)
print()


# Test 6: Missing allowed_actions -> refuse
print("=" * 60)
print("Test 6: Missing allowed_actions -> refuse")
print("=" * 60)
test_6_input = {
    'required_keys': ['key_a'],
    'values': {'key_a': 'value_a'},
    'uncertainty': {'key_a': False},
    # missing 'allowed_actions'
    'preference_order': ['action_x']
}
print("Input:")
print(test_6_input)
test_6_output = bounded_choice_policy(test_6_input)
print("Output:")
print(test_6_output)
print()






















































