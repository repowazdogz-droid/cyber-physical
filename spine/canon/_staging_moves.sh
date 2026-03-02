#!/usr/bin/env bash
set -euo pipefail
OMEGA_ROOT="${HOME}/Omega"
CANON_DIR="${OMEGA_ROOT}/spine/canon"
INCOMING_DIR="${CANON_DIR}/_incoming"

# REVIEW THIS FILE BEFORE RUNNING.
# It will MOVE files out of _incoming into canon folders.
# If you prefer COPY, replace mv with cp.

mkdir -p "${CANON_DIR}/docs" "${CANON_DIR}/programme" "${CANON_DIR}/ops" "${CANON_DIR}/prompts" "${CANON_DIR}/demos"

move_if_exists () {
  local src="$1"
  local dest="$2"
  if [ -f "${INCOMING_DIR}/${src}" ]; then
    mv "${INCOMING_DIR}/${src}" "${dest}/${src}"
    echo "moved: ${src} -> ${dest}"
  fi
}

# Programme files
move_if_exists "BLOCK_1_SCOPE.md" "${CANON_DIR}/programme"
move_if_exists "BLOCK_3_PILOT_DESIGN.md" "${CANON_DIR}/programme"
move_if_exists "BLOCK_6_FACILITATOR_TRAINING.md" "${CANON_DIR}/programme"
move_if_exists "BLOCK_7_PUBLIC_FACING.md" "${CANON_DIR}/programme"
move_if_exists "BLOCK_8_WEBSITE_MATERIALS.md" "${CANON_DIR}/programme"

# Ops files
move_if_exists "BUILD_LOG.md" "${CANON_DIR}/ops"
move_if_exists "BUILD_PLAN.md" "${CANON_DIR}/ops"
move_if_exists "CONTRIBUTING.md" "${CANON_DIR}/ops"

# Demo files
move_if_exists "CONTRACT.md" "${CANON_DIR}/demos"
move_if_exists "FIRST_DEMO_SPEC.md" "${CANON_DIR}/demos"
move_if_exists "PROJECT_STRUCTURE.md" "${CANON_DIR}/demos"
move_if_exists "V1_DEMO_CONTENT.md" "${CANON_DIR}/demos"

# F (prompts) files
move_if_exists "OMEGA_FREEZE_LINE.md" "${CANON_DIR}/prompts"
move_if_exists "OMEGA_SYSTEM_SUMMARY.md" "${CANON_DIR}/prompts"
move_if_exists "SPINE_COMPLETE_MAP.md" "${CANON_DIR}/prompts"

# Docs files
move_if_exists "OMEGA_CAPABILITY_LEDGER.md" "${CANON_DIR}/docs"
move_if_exists "OMEGA_MODE_GUIDE.md" "${CANON_DIR}/docs"
move_if_exists "OMEGA_README.md" "${CANON_DIR}/docs"
