package main

import (
	"path/filepath"
)

func runVersion(args []string) {
	f := parseCommonFlags(args)
	r := checkVersion(f.Root)
	r.print("version")
	code := 0
	if len(r.Failures) > 0 {
		code = 1
	} else if f.Strict && len(r.Warnings) > 0 {
		code = 2
	}
	panicExit(code)
}

func checkVersion(root string) Report {
	var r Report

	v := filepath.Join(root, "omega-spatial", "spine", "VERSIONING.md")
	if !exists(v) {
		r.fail("missing VERSIONING.md: " + v)
	}

	fm := filepath.Join(root, "omega-spatial", "spine", "FREEZE_MANIFEST.md")
	if !exists(fm) {
		r.fail("missing FREEZE_MANIFEST.md: " + fm)
	}

	return r
}

































