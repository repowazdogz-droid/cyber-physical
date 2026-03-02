package main

import (
	"encoding/json"
	"fmt"
	"os"
)

func exists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func readFile(path string) ([]byte, error) {
	return os.ReadFile(path)
}

func mustJSON(path string, v any) error {
	b, err := readFile(path)
	if err != nil {
		return err
	}
	if err := json.Unmarshal(b, v); err != nil {
		return fmt.Errorf("invalid json in %s: %w", path, err)
	}
	return nil
}

type Report struct {
	Failures []string
	Warnings []string
}

func (r *Report) fail(msg string) { r.Failures = append(r.Failures, msg) }
func (r *Report) warn(msg string) { r.Warnings = append(r.Warnings, msg) }

func (r Report) exitCode(strict bool) int {
	if len(r.Failures) > 0 {
		return 1
	}
	if strict && len(r.Warnings) > 0 {
		return 2
	}
	return 0
}

func (r Report) print(title string) {
	fmt.Println("")
	fmt.Println("==", title, "==")
	if len(r.Failures) == 0 && len(r.Warnings) == 0 {
		fmt.Println("OK")
		return
	}
	if len(r.Failures) > 0 {
		fmt.Println("FAILURES:")
		for _, f := range r.Failures {
			fmt.Println(" -", f)
		}
	}
	if len(r.Warnings) > 0 {
		fmt.Println("WARNINGS:")
		for _, w := range r.Warnings {
			fmt.Println(" -", w)
		}
	}
}

































