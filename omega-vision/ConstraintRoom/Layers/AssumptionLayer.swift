import Foundation
import RealityKit
import UIKit

struct AssumptionLayer: LayerProtocol {
    let layerName: String = "Assumptions"
    var isVisible: Bool = true
    let rootEntity: Entity = {
        let e = Entity()
        e.name = "Layer_Assumptions"
        return e
    }()

    init() {
        // Assumptions should feel provisional (softer, more translucent).
        let mat = SimpleMaterial(
            color: UIColor(red: 0.70, green: 0.85, blue: 0.95, alpha: 0.16),
            roughness: 1.0,
            isMetallic: false
        )

        // A "support surface" behind the anchor.
        let surface = ModelEntity(mesh: .generatePlane(width: 2.2, depth: 2.2), materials: [mat])
        surface.name = "Assumption_Surface"
        surface.position = .init(-0.9, 1.2, 0.9)
        surface.orientation = simd_quatf(angle: .pi/2, axis: [0,1,0]) // rotate to be a side plane

        // An "assumption shell" around the structure (soft cylinder).
        let shell = ModelEntity(mesh: .generateCylinder(radius: 0.7, height: 1.4), materials: [mat])
        shell.name = "Assumption_Shell"
        shell.position = .init(0, 0.95, 0)

        rootEntity.addChild(surface)
        rootEntity.addChild(shell)
    }
}
