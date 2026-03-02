package main

import (
	"fmt"
	"path/filepath"
)

func runLocks(args []string) {
	f := parseCommonFlags(args)
	r := checkLocks(f.Root)
	r.print("locks")
	code := 0
	if len(r.Failures) > 0 {
		code = 1
	} else if f.Strict && len(r.Warnings) > 0 {
		code = 2
	}
	panicExit(code)
}

func checkLocks(root string) Report {
	var r Report

	rooms := []string{"ConstraintRoom", "CausalRoom", "AssumptionRoom", "TradeoffRoom", "AssuranceRoom"}
	required := []string{"CORE_LOCK.md", "INTERACTION_LOCK.md", "SAFETY_LOCK.md", "V1_LOCK.md"}

	for _, room := range rooms {
		lockDir := filepath.Join(root, "omega-vision", room, "LOCKED")
		if !exists(lockDir) {
			r.fail(fmt.Sprintf("missing LOCKED dir for %s: %s", room, lockDir))
			continue
		}
		for _, f := range required {
			p := filepath.Join(lockDir, f)
			if !exists(p) {
				r.fail(fmt.Sprintf("missing %s lock file: %s", room, p))
			}
		}
	}

	// Gallery lock
	galleryLock := filepath.Join(root, "omega-vision", "OmegaGallery", "LOCKED", "V1_LOCK.md")
	if !exists(galleryLock) {
		r.fail("missing gallery V1 lock: " + galleryLock)
	}

	return r
}

































