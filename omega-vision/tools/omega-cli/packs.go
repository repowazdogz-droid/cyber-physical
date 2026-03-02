package main

import (
	"fmt"
	"path/filepath"
)

type PackRooms struct {
	CausalRoom struct {
		NodeTitles   map[string]string `json:"nodeTitles"`
		NodeMeanings map[string]string `json:"nodeMeanings"`
	} `json:"causalRoom"`

	AssumptionRoom struct {
		AssumptionTitles   map[string]string `json:"assumptionTitles"`
		AssumptionMeanings map[string]string `json:"assumptionMeanings"`
	} `json:"assumptionRoom"`

	TradeoffRoom struct {
		ObjectiveTitles    map[string]string `json:"objectiveTitles"`
		ObjectiveMeanings  map[string]string `json:"objectiveMeanings"`
		ConstraintTitles   map[string]string `json:"constraintTitles"`
		ConstraintMeanings map[string]string `json:"constraintMeanings"`
		FrontTitles        map[string]string `json:"frontTitles"`
		FrontMeanings      map[string]string `json:"frontMeanings"`
	} `json:"tradeoffRoom"`

	AssuranceRoom struct {
		InputTitles      map[string]string `json:"inputTitles"`
		InputMeanings    map[string]string `json:"inputMeanings"`
		AuthorityTitles map[string]string `json:"authorityTitles"`
		AuthorityMeanings map[string]string `json:"authorityMeanings"`
		OutcomeTitles    map[string]string `json:"outcomeTitles"`
		OutcomeMeanings  map[string]string `json:"outcomeMeanings"`
		OverrideTitles   map[string]string `json:"overrideTitles"`
		OverrideMeanings map[string]string `json:"overrideMeanings"`
	} `json:"assuranceRoom"`
}

type PresetPack struct {
	ID    string    `json:"id"`
	Name  string    `json:"name"`
	Rooms PackRooms `json:"rooms"`
}

func runPacks(args []string) {
	f := parseCommonFlags(args)
	r := checkPacks(f.Root)
	r.print("packs")
	code := 0
	if len(r.Failures) > 0 {
		code = 1
	} else if f.Strict && len(r.Warnings) > 0 {
		code = 2
	}
	panicExit(code)
}

func checkPacks(root string) Report {
	var r Report

	packsDir := filepath.Join(root, "omega-vision", "OmegaGallery", "Packs", "packs")
	if !exists(packsDir) {
		r.fail(fmt.Sprintf("missing packs dir: %s", packsDir))
		return r
	}

	packs := []string{"robotics.json", "clinical.json", "research.json"}
	for _, p := range packs {
		path := filepath.Join(packsDir, p)
		if !exists(path) {
			r.fail("missing pack file: " + path)
			continue
		}
		var pack PresetPack
		if err := mustJSON(path, &pack); err != nil {
			r.fail(err.Error())
			continue
		}

		// required IDs
		requireKeys(&r, path, "causalRoom.nodeTitles", pack.Rooms.CausalRoom.NodeTitles, requiredRange("N", 1, 6))
		requireKeys(&r, path, "causalRoom.nodeMeanings", pack.Rooms.CausalRoom.NodeMeanings, requiredRange("N", 1, 6))

		requireKeys(&r, path, "assumptionRoom.assumptionTitles", pack.Rooms.AssumptionRoom.AssumptionTitles, requiredRange("A", 1, 6))
		requireKeys(&r, path, "assumptionRoom.assumptionMeanings", pack.Rooms.AssumptionRoom.AssumptionMeanings, requiredRange("A", 1, 6))

		requireKeys(&r, path, "tradeoffRoom.objectiveTitles", pack.Rooms.TradeoffRoom.ObjectiveTitles, requiredRange("O", 1, 3))
		requireKeys(&r, path, "tradeoffRoom.objectiveMeanings", pack.Rooms.TradeoffRoom.ObjectiveMeanings, requiredRange("O", 1, 3))
		requireKeys(&r, path, "tradeoffRoom.constraintTitles", pack.Rooms.TradeoffRoom.ConstraintTitles, requiredRange("K", 1, 3))
		requireKeys(&r, path, "tradeoffRoom.constraintMeanings", pack.Rooms.TradeoffRoom.ConstraintMeanings, requiredRange("K", 1, 3))
		requireKeys(&r, path, "tradeoffRoom.frontTitles", pack.Rooms.TradeoffRoom.FrontTitles, requiredRange("T", 1, 7))
		requireKeys(&r, path, "tradeoffRoom.frontMeanings", pack.Rooms.TradeoffRoom.FrontMeanings, requiredRange("T", 1, 7))

		requireKeys(&r, path, "assuranceRoom.inputTitles", pack.Rooms.AssuranceRoom.InputTitles, requiredRange("I", 1, 4))
		requireKeys(&r, path, "assuranceRoom.inputMeanings", pack.Rooms.AssuranceRoom.InputMeanings, requiredRange("I", 1, 4))
		requireKeys(&r, path, "assuranceRoom.authorityTitles", pack.Rooms.AssuranceRoom.AuthorityTitles, requiredRange("A", 1, 4))
		requireKeys(&r, path, "assuranceRoom.authorityMeanings", pack.Rooms.AssuranceRoom.AuthorityMeanings, requiredRange("A", 1, 4))
		requireKeys(&r, path, "assuranceRoom.outcomeTitles", pack.Rooms.AssuranceRoom.OutcomeTitles, requiredRange("S", 1, 4))
		requireKeys(&r, path, "assuranceRoom.outcomeMeanings", pack.Rooms.AssuranceRoom.OutcomeMeanings, requiredRange("S", 1, 4))
		requireKeys(&r, path, "assuranceRoom.overrideTitles", pack.Rooms.AssuranceRoom.OverrideTitles, requiredRange("OVR", 1, 3))
		requireKeys(&r, path, "assuranceRoom.overrideMeanings", pack.Rooms.AssuranceRoom.OverrideMeanings, requiredRange("OVR", 1, 3))
	}

	return r
}

func requiredRange(prefix string, start, end int) []string {
	out := make([]string, 0, end-start+1)
	for i := start; i <= end; i++ {
		out = append(out, fmt.Sprintf("%s%d", prefix, i))
	}
	return out
}

func requireKeys(r *Report, filePath, section string, m map[string]string, required []string) {
	if m == nil {
		r.fail(fmt.Sprintf("%s: missing section %s", filePath, section))
		return
	}
	for _, k := range required {
		v, ok := m[k]
		if !ok || v == "" {
			r.fail(fmt.Sprintf("%s: missing %s[%s]", filePath, section, k))
		}
	}
}

