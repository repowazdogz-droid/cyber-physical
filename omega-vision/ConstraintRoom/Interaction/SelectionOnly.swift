import Foundation
import RealityKit

enum SelectionOnly {

    static func metadata(preset: ScenePreset, for entityName: String) -> (kind: String, meaning: String, dependsOn: String)? {

        // Global (shared) objects: keep neutral.
        switch entityName {
        case "Floor", "WallNorth", "WallSouth", "WallEast", "WallWest":
            return ("Environment", "A neutral room surface for orientation only.", "—")
        case "KeyLight", "AmbientFill":
            return ("Environment", "Lighting for visibility only.", "—")
        default:
            break
        }

        // Preset-specific mappings
        switch preset {

        case .t2CausalMap:
            return t2(entityName)

        case .t3AssumptionSurface:
            return t3(entityName)

        case .t4TradeoffAtlas:
            return t4(entityName)

        case .t5AssuranceLadder:
            return t5(entityName)
        }
    }

    // MARK: - T2
    private static func t2(_ name: String) -> (String, String, String)? {
        switch name {
        case "T2_Node_0", "T2_Node_1", "T2_Node_2":
            return ("Node", "A concept/node in a causal framing. It does not imply measurement or certainty.", "User-defined variable set")
        case "T2_Link_0":
            return ("Link", "A conceptual influence link. This is not a forecast or simulation.", "Stated assumptions about influence")
        case "T2_AssumptionPlane":
            return ("Assumption", "A surface representing partial coverage: the map may omit relevant variables or links.", "Scope boundary")
        default:
            // Also allow the base layers if visible
            return sharedFallback(name)
        }
    }

    // MARK: - T3
    private static func t3(_ name: String) -> (String, String, String)? {
        switch name {
        case "Assumption_Surface":
            return ("Assumption", "A supporting assumption surface: reasoning leans on this being true.", "Assumption set")
        case "Assumption_Shell":
            return ("Assumption", "A soft enclosure of assumed validity. Represents 'works if these conditions hold'.", "Assumption set")
        case "Uncertainty_FogSphere", "Uncertainty_FogBox":
            return ("Uncertainty", "A region of incomplete support or unknowns. Not a hazard label.", "Evidence gaps / observability limits")
        case "Constraint_BoundaryPlane", "Constraint_KeepOut":
            return ("Constraint", "A constraint region: disallowed or limited space within the framing.", "Constraint set")
        default:
            return sharedFallback(name)
        }
    }

    // MARK: - T4
    private static func t4(_ name: String) -> (String, String, String)? {
        switch name {
        case "T4_Objective_A":
            return ("Objective", "A conceptual objective marker. It does not rank outcomes or pick 'best'.", "Objective definition")
        case "T4_Objective_B":
            return ("Objective", "A conceptual objective marker. It does not rank outcomes or pick 'best'.", "Objective definition")
        case "T4_FeasibleRegion":
            return ("Feasible region", "A region representing what is possible under constraints (conceptual).", "Constraint set")
        case "T4_AssumptionApproxFront":
            return ("Assumption", "A note that the tradeoff front is approximate/partial (not exhaustive).", "Model simplification")
        default:
            return sharedFallback(name)
        }
    }

    // MARK: - T5
    private static func t5(_ name: String) -> (String, String, String)? {
        switch name {
        case "T5_Outcome_S1":
            return ("Outcome class", "S1: Stabilize & assess (bounded intent). Not a procedure.", "Authority + confidence + time")
        case "T5_Outcome_S2":
            return ("Outcome class", "S2: Controlled descent (bounded). Not a command.", "Authority + confidence + environment")
        case "T5_Outcome_S3":
            return ("Outcome class", "S3: Degraded landing (assurance-first).", "Authority margin")
        case "T5_Outcome_S4":
            return ("Outcome class", "S4: Impact mitigation only (when control is minimal).", "Loss of control authority")
        case "T5_Override":
            return ("Override", "A hard constraint that can disallow actions regardless of capability.", "Ethical or safety boundary")
        case "T5_AssumptionBound":
            return ("Assumption", "Assurance classes are bounded: they state guarantees, not promises of success.", "Assurance framing")
        default:
            return sharedFallback(name)
        }
    }

    // MARK: - Shared fallback (base layers)
    private static func sharedFallback(_ name: String) -> (String, String, String)? {
        switch name {
        case "Structure_Base":
            return ("Structure", "A structural anchor element (conceptual).", "—")
        case "Structure_Pillar":
            return ("Structure", "A structural support element (conceptual).", "—")
        case "Structure_Cap":
            return ("Structure", "A structural cap element (conceptual).", "—")

        case "Constraint_BoundaryPlane":
            return ("Constraint", "A firm boundary: represents a limit inside the framing.", "External constraint set")
        case "Constraint_KeepOut":
            return ("Constraint", "A keep-out volume: represents disallowed space in this framing.", "External constraint set")

        case "Assumption_Surface":
            return ("Assumption", "A provisional supporting surface: represents a condition the reasoning leans on.", "Assumption set")
        case "Assumption_Shell":
            return ("Assumption", "A provisional shell: a soft enclosure of assumed validity.", "Assumption set")

        case "Uncertainty_FogSphere":
            return ("Uncertainty", "A region of incomplete knowledge (not danger).", "Data coverage / observability limits")
        case "Uncertainty_FogBox":
            return ("Uncertainty", "A region where support is weak or missing (not a command).", "Evidence gaps / unknowns")

        default:
            return nil
        }
    }
}
