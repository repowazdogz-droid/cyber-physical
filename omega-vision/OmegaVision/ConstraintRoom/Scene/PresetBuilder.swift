import Foundation
import RealityKit
import UIKit

enum PresetBuilder {

    static func build(preset: ScenePreset) -> (structure: StructureLayer, constraints: ConstraintLayer, assumptions: AssumptionLayer, uncertainty: UncertaintyLayer) {
        switch preset {
        case .t2CausalMap:
            return buildT2()
        case .t3AssumptionSurface:
            return buildT3()
        case .t4TradeoffAtlas:
            return buildT4()
        case .t5AssuranceLadder:
            return buildT5()
        }
    }

    // MARK: - T2
    private static func buildT2() -> (StructureLayer, ConstraintLayer, AssumptionLayer, UncertaintyLayer) {
        var s = StructureLayer()
        var c = ConstraintLayer()
        var a = AssumptionLayer()
        var u = UncertaintyLayer()

        // Minimal T2 feel: "nodes" = small spheres (Structure), "links" = thin boxes (Constraints as "disallowed/limited"),
        // "assumptions" = soft planes, "uncertainty" = faint fog already exists.

        let nodeMat = SimpleMaterial(color: UIColor(white: 0.85, alpha: 1.0), roughness: 0.6, isMetallic: false)
        for (i, pos) in [SIMD3<Float>(-0.9, 1.0, -0.2), SIMD3<Float>(0.0, 1.3, -0.6), SIMD3<Float>(0.9, 1.1, 0.2)].enumerated() {
            let n = ModelEntity(mesh: .generateSphere(radius: 0.12), materials: [nodeMat])
            n.name = "T2_Node_\(i)"
            n.position = pos
            s.rootEntity.addChild(n)
        }

        let linkMat = SimpleMaterial(color: UIColor(red: 0.95, green: 0.80, blue: 0.25, alpha: 0.25), roughness: 0.9, isMetallic: false)
        let link = ModelEntity(mesh: .generateBox(width: 1.8, height: 0.03, depth: 0.03), materials: [linkMat])
        link.name = "T2_Link_0"
        link.position = .init(0.0, 1.15, -0.3)
        link.orientation = simd_quatf(angle: 0.25, axis: [0,1,0])
        c.rootEntity.addChild(link)

        // Assumption: "map is partial"
        let softMat = SimpleMaterial(color: UIColor(red: 0.70, green: 0.85, blue: 0.95, alpha: 0.14), roughness: 1.0, isMetallic: false)
        let plane = ModelEntity(mesh: .generatePlane(width: 2.4, depth: 1.6), materials: [softMat])
        plane.name = "T2_AssumptionPlane"
        plane.position = .init(0, 1.6, 0.9)
        plane.orientation = simd_quatf(angle: .pi/2, axis: [1,0,0])
        a.rootEntity.addChild(plane)

        return (s, c, a, u)
    }

    // MARK: - T3
    private static func buildT3() -> (StructureLayer, ConstraintLayer, AssumptionLayer, UncertaintyLayer) {
        // Use the default layers (already "assumption-heavy").
        return (StructureLayer(), ConstraintLayer(), AssumptionLayer(), UncertaintyLayer())
    }

    // MARK: - T4
    private static func buildT4() -> (StructureLayer, ConstraintLayer, AssumptionLayer, UncertaintyLayer) {
        var s = StructureLayer()
        var c = ConstraintLayer()
        var a = AssumptionLayer()
        var u = UncertaintyLayer()

        // Feasible region feel: a translucent "feasible block" (Constraints) + two objective markers (Structure).
        let objMat = SimpleMaterial(color: UIColor(white: 0.90, alpha: 1.0), roughness: 0.5, isMetallic: false)
        let o1 = ModelEntity(mesh: .generateSphere(radius: 0.12), materials: [objMat])
        o1.name = "T4_Objective_A"
        o1.position = .init(-0.8, 1.2, -0.4)
        s.rootEntity.addChild(o1)

        let o2 = ModelEntity(mesh: .generateSphere(radius: 0.12), materials: [objMat])
        o2.name = "T4_Objective_B"
        o2.position = .init(0.8, 1.4, -0.2)
        s.rootEntity.addChild(o2)

        let feasMat = SimpleMaterial(color: UIColor(red: 0.95, green: 0.80, blue: 0.25, alpha: 0.18), roughness: 0.95, isMetallic: false)
        let feas = ModelEntity(mesh: .generateBox(width: 1.6, height: 0.9, depth: 1.0), materials: [feasMat])
        feas.name = "T4_FeasibleRegion"
        feas.position = .init(0, 1.0, 0.6)
        c.rootEntity.addChild(feas)

        // Assumption: "tradeoff front is approximate"
        let softMat = SimpleMaterial(color: UIColor(red: 0.70, green: 0.85, blue: 0.95, alpha: 0.14), roughness: 1.0, isMetallic: false)
        let approx = ModelEntity(mesh: .generatePlane(width: 1.8, depth: 1.0), materials: [softMat])
        approx.name = "T4_AssumptionApproxFront"
        approx.position = .init(0, 1.7, -0.8)
        approx.orientation = simd_quatf(angle: .pi/2, axis: [1,0,0])
        a.rootEntity.addChild(approx)

        return (s, c, a, u)
    }

    // MARK: - T5
    private static func buildT5() -> (StructureLayer, ConstraintLayer, AssumptionLayer, UncertaintyLayer) {
        var s = StructureLayer()
        var c = ConstraintLayer()
        var a = AssumptionLayer()
        var u = UncertaintyLayer()

        // Ladder feel: four "outcomes" stacked (Structure) + an "override bar" (Constraints).
        let boxMat = SimpleMaterial(color: UIColor(white: 0.85, alpha: 1.0), roughness: 0.65, isMetallic: false)
        for i in 0..<4 {
            let b = ModelEntity(mesh: .generateBox(width: 0.9, height: 0.18, depth: 0.25), materials: [boxMat])
            b.name = "T5_Outcome_S\(i+1)"
            b.position = .init(-0.7, 0.7 + Float(i) * 0.28, -0.6)
            s.rootEntity.addChild(b)
        }

        let barMat = SimpleMaterial(color: UIColor(red: 0.95, green: 0.80, blue: 0.25, alpha: 0.22), roughness: 0.9, isMetallic: false)
        let overrideBar = ModelEntity(mesh: .generateBox(width: 2.2, height: 0.08, depth: 0.08), materials: [barMat])
        overrideBar.name = "T5_Override"
        overrideBar.position = .init(0.2, 1.6, -0.1)
        c.rootEntity.addChild(overrideBar)

        // Assumption: "assurance class is bounded"
        let softMat = SimpleMaterial(color: UIColor(red: 0.70, green: 0.85, blue: 0.95, alpha: 0.14), roughness: 1.0, isMetallic: false)
        let labelPlane = ModelEntity(mesh: .generatePlane(width: 1.6, depth: 0.9), materials: [softMat])
        labelPlane.name = "T5_AssumptionBound"
        labelPlane.position = .init(0.9, 1.1, 0.9)
        labelPlane.orientation = simd_quatf(angle: .pi/2, axis: [1,0,0])
        a.rootEntity.addChild(labelPlane)

        return (s, c, a, u)
    }
}





