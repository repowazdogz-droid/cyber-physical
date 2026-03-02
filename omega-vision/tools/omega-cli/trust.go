package main

import (
	"fmt"
	"path/filepath"
)

func runTrust(args []string) {
	f := parseCommonFlags(args)
	r := checkTrust(f.Root)
	r.print("trust")
	code := 0
	if len(r.Failures) > 0 {
		code = 1
	} else if f.Strict && len(r.Warnings) > 0 {
		code = 2
	}
	panicExit(code)
}

func checkTrust(root string) Report {
	var r Report

	canonical := filepath.Join(root, "omega-vision", "OmegaGallery", "Docs", "CANONICAL_TRUST_COPY.md")
	if !exists(canonical) {
		r.fail("missing canonical trust doc: " + canonical)
	}

	trustCopy := filepath.Join(root, "omega-vision", "OmegaGallery", "SharedUI", "TrustCopy.swift")
	if !exists(trustCopy) {
		r.fail("missing TrustCopy.swift: " + trustCopy)
	}

	// Soft check: rooms have TrustFooter.swift
	rooms := []string{"ConstraintRoom", "CausalRoom", "AssumptionRoom", "TradeoffRoom", "AssuranceRoom"}
	for _, room := range rooms {
		tf := filepath.Join(root, "omega-vision", room, "Trust", "TrustFooter.swift")
		if !exists(tf) {
			r.warn(fmt.Sprintf("missing TrustFooter.swift for %s (expected): %s", room, tf))
		}
	}
	return r
}

































