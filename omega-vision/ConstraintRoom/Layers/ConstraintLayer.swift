import Foundation
import RealityKit
import UIKit

struct ConstraintLayer: LayerProtocol {
    let layerName: String = "Constraints"
    var isVisible: Bool = true
    let rootEntity: Entity = {
        let e = Entity()
        e.name = "Layer_Constraints"
        return e
    }()

    init() {
        // Constraints should feel "firm" but not alarming.
        let mat = SimpleMaterial(
            color: UIColor(red: 0.95, green: 0.80, blue: 0.25, alpha: 0.22),
            roughness: 0.9,
            isMetallic: false
        )

        // A "boundary plane" in front of the anchor.
        let plane = ModelEntity(mesh: .generatePlane(width: 3.5, depth: 2.0), materials: [mat])
        plane.name = "Constraint_BoundaryPlane"
        plane.position = .init(0, 1.1, -1.2)
        plane.orientation = simd_quatf(angle: -.pi/2, axis: [1,0,0]) // stand it up vertically

        // A "keep-out volume" off to one side.
        let volume = ModelEntity(mesh: .generateBox(width: 0.8, height: 0.9, depth: 0.8), materials: [mat])
        volume.name = "Constraint_KeepOut"
        volume.position = .init(1.2, 0.75, 0.6)

        rootEntity.addChild(plane)
        rootEntity.addChild(volume)
    }
}
