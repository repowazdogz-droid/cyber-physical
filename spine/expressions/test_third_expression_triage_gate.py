"""
Test Harness for Third Omega Expression: Triage Gate

This file provides explicit test cases to make Omega's triage logic
visible and auditable. No test frameworks, no mocks, no automation.

Each test case:
- Prints the test name
- Prints the input
- Prints the output

No assertions. No optimization. No helpers.
"""

from third_expression_triage_gate import triage_gate


# Test 1: Valid input, low risk (0.2), high confidence (0.9) -> proceed
print("=" * 60)
print("Test 1: Valid input, low risk (0.2), high confidence (0.9) -> proceed")
print("=" * 60)
test_1_input = {
    'required_keys': ['key_a'],
    'values': {'key_a': 'value_a'},
    'uncertainty': {'key_a': False},
    'risk_score': 0.2,
    'confidence': 0.9
}
print("Input:")
print(test_1_input)
test_1_output = triage_gate(test_1_input)
print("Output:")
print(test_1_output)
print()


# Test 2: Valid input, high risk (0.7) -> safe_mode
print("=" * 60)
print("Test 2: Valid input, high risk (0.7) -> safe_mode")
print("=" * 60)
test_2_input = {
    'required_keys': ['key_a'],
    'values': {'key_a': 'value_a'},
    'uncertainty': {'key_a': False},
    'risk_score': 0.7,
    'confidence': 0.9
}
print("Input:")
print(test_2_input)
test_2_output = triage_gate(test_2_input)
print("Output:")
print(test_2_output)
print()


# Test 3: Valid input, confidence low (0.59) -> safe_mode
print("=" * 60)
print("Test 3: Valid input, confidence low (0.59) -> safe_mode")
print("=" * 60)
test_3_input = {
    'required_keys': ['key_a'],
    'values': {'key_a': 'value_a'},
    'uncertainty': {'key_a': False},
    'risk_score': 0.2,
    'confidence': 0.59
}
print("Input:")
print(test_3_input)
test_3_output = triage_gate(test_3_input)
print("Output:")
print(test_3_output)
print()


# Test 4: Missing required_keys -> refuse
print("=" * 60)
print("Test 4: Missing required_keys -> refuse")
print("=" * 60)
test_4_input = {
    'required_keys': ['key_a', 'key_b'],
    'values': {'key_a': 'value_a'},
    # key_b missing
    'uncertainty': {'key_a': False},
    'risk_score': 0.2,
    'confidence': 0.9
}
print("Input:")
print(test_4_input)
test_4_output = triage_gate(test_4_input)
print("Output:")
print(test_4_output)
print()


# Test 5: Missing one required key in values -> refuse
print("=" * 60)
print("Test 5: Missing one required key in values -> refuse")
print("=" * 60)
test_5_input = {
    'required_keys': ['key_a', 'key_b'],
    'values': {'key_a': 'value_a'},
    # key_b missing
    'uncertainty': {'key_a': False},
    'risk_score': 0.2,
    'confidence': 0.9
}
print("Input:")
print(test_5_input)
test_5_output = triage_gate(test_5_input)
print("Output:")
print(test_5_output)
print()


# Test 6: Required key uncertain -> refuse
print("=" * 60)
print("Test 6: Required key uncertain -> refuse")
print("=" * 60)
test_6_input = {
    'required_keys': ['key_a'],
    'values': {'key_a': 'value_a'},
    'uncertainty': {'key_a': True},  # uncertain
    'risk_score': 0.2,
    'confidence': 0.9
}
print("Input:")
print(test_6_input)
test_6_output = triage_gate(test_6_input)
print("Output:")
print(test_6_output)
print()


# Test 7: risk_score out of range (1.2) -> refuse
print("=" * 60)
print("Test 7: risk_score out of range (1.2) -> refuse")
print("=" * 60)
test_7_input = {
    'required_keys': ['key_a'],
    'values': {'key_a': 'value_a'},
    'uncertainty': {'key_a': False},
    'risk_score': 1.2,  # out of range
    'confidence': 0.9
}
print("Input:")
print(test_7_input)
test_7_output = triage_gate(test_7_input)
print("Output:")
print(test_7_output)
print()






















































