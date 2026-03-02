package main

import (
	"fmt"
)

func runDoctor(args []string) {
	f := parseCommonFlags(args)
	fmt.Println("omega-cli doctor")
	fmt.Println("root:", f.Root)
	fmt.Println("strict:", f.Strict)

	var all Report

	// Packs
	r1 := checkPacks(f.Root)
	r1.print("packs")
	all.Failures = append(all.Failures, r1.Failures...)
	all.Warnings = append(all.Warnings, r1.Warnings...)

	// Locks
	r2 := checkLocks(f.Root)
	r2.print("locks")
	all.Failures = append(all.Failures, r2.Failures...)
	all.Warnings = append(all.Warnings, r2.Warnings...)

	// Trust
	r3 := checkTrust(f.Root)
	r3.print("trust")
	all.Failures = append(all.Failures, r3.Failures...)
	all.Warnings = append(all.Warnings, r3.Warnings...)

	// Versioning
	r4 := checkVersion(f.Root)
	r4.print("version")
	all.Failures = append(all.Failures, r4.Failures...)
	all.Warnings = append(all.Warnings, r4.Warnings...)

	// Final
	fmt.Println("")
	if len(all.Failures) == 0 && len(all.Warnings) == 0 {
		fmt.Println("✅ DOCTOR: OK")
	} else if len(all.Failures) == 0 {
		fmt.Println("⚠️ DOCTOR: WARNINGS")
	} else {
		fmt.Println("❌ DOCTOR: FAIL")
	}

	code := 0
	if len(all.Failures) > 0 {
		code = 1
	} else if f.Strict && len(all.Warnings) > 0 {
		code = 2
	}
	panicExit(code)
}

































