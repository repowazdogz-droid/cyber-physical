package main

import (
	"os"
	"path/filepath"
)

type CommonFlags struct {
	Root   string
	Strict bool
}

func parseCommonFlags(args []string) CommonFlags {
	var f CommonFlags
	f.Root = "" // auto
	f.Strict = false

	for i := 0; i < len(args); i++ {
		switch args[i] {
		case "--root":
			if i+1 < len(args) {
				f.Root = args[i+1]
				i++
			}
		case "--strict":
			f.Strict = true
		}
	}

	if f.Root == "" {
		// default: assume we're run from repo root OR inside tools dir; normalize upwards safely
		cwd, _ := os.Getwd()
		f.Root = findRepoRoot(cwd)
	}
	return f
}

func findRepoRoot(start string) string {
	// Heuristic: look for omega-vision/ and omega-spatial/ or package.json near top.
	cur := start
	for depth := 0; depth < 8; depth++ {
		if exists(filepath.Join(cur, "omega-vision")) && exists(filepath.Join(cur, "omega-spatial")) {
			return cur
		}
		if exists(filepath.Join(cur, "package.json")) && exists(filepath.Join(cur, "omega-vision")) {
			return cur
		}
		parent := filepath.Dir(cur)
		if parent == cur {
			break
		}
		cur = parent
	}
	// fallback to start
	return start
}

































