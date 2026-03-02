import Foundation
import RealityKit
import UIKit

struct UncertaintyLayer: LayerProtocol {
    let layerName: String = "Uncertainty"
    var isVisible: Bool = true
    let rootEntity: Entity = {
        let e = Entity()
        e.name = "Layer_Uncertainty"
        return e
    }()

    init() {
        // Uncertainty should feel like "fog" or "unknown region", not danger.
        let mat = SimpleMaterial(
            color: UIColor(red: 0.55, green: 0.65, blue: 1.0, alpha: 0.10),
            roughness: 1.0,
            isMetallic: false
        )

        let fog1 = ModelEntity(mesh: .generateSphere(radius: 0.65), materials: [mat])
        fog1.name = "Uncertainty_FogSphere"
        fog1.position = .init(-1.0, 1.7, -0.4)

        let fog2 = ModelEntity(mesh: .generateBox(width: 1.1, height: 0.7, depth: 0.9), materials: [mat])
        fog2.name = "Uncertainty_FogBox"
        fog2.position = .init(0.6, 1.9, -0.9)

        rootEntity.addChild(fog1)
        rootEntity.addChild(fog2)
    }
}
