package main

import (
	"fmt"
	"os"
)

func main() {
	if len(os.Args) < 2 {
		printUsage()
		os.Exit(1)
	}

	cmd := os.Args[1]
	args := os.Args[2:]

	switch cmd {
	case "doctor":
		runDoctor(args)
	case "packs":
		runPacks(args)
	case "locks":
		runLocks(args)
	case "trust":
		runTrust(args)
	case "version":
		runVersion(args)
	case "-h", "--help", "help":
		printUsage()
		os.Exit(0)
	default:
		fmt.Printf("Unknown command: %s\n\n", cmd)
		printUsage()
		os.Exit(1)
	}
}

func printUsage() {
	fmt.Println("omega-cli")
	fmt.Println("")
	fmt.Println("Usage:")
	fmt.Println("  go run . doctor [--strict] [--root <path>]")
	fmt.Println("  go run . packs  [--root <path>]")
	fmt.Println("  go run . locks  [--root <path>]")
	fmt.Println("  go run . trust  [--root <path>]")
	fmt.Println("  go run . version [--root <path>]")
	fmt.Println("")
}

































