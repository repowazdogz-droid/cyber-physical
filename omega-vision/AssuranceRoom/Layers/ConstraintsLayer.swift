import Foundation
import RealityKit
import UIKit

struct ConstraintsLayer: LayerProtocol {
    let layerName: String = "Constraints"
    var isVisible: Bool = true
    let rootEntity: Entity = {
        let e = Entity()
        e.name = "Layer_Constraints"
        return e
    }()
    
    init() {
        // Create "Constraints" group entity
        let constraintsGroup = Entity()
        constraintsGroup.name = "Constraints"
        
        // Constraint material: translucent, low opacity
        let constraintMat = SimpleMaterial(
            color: UIColor(red: 0.95, green: 0.80, blue: 0.25, alpha: 0.18),
            roughness: 0.9,
            isMetallic: false
        )
        
        let yPos: Float = 1.2
        let height: Float = 1.8
        
        // K1: Vertical slab/wall on one side
        let k1 = ModelEntity(
            mesh: .generateBox(width: 0.08, height: height, depth: 2.0),
            materials: [constraintMat]
        )
        k1.name = "K1"
        k1.position = .init(-1.5, yPos, 0)
        constraintsGroup.addChild(k1)
        
        // K2: Vertical slab/wall on another side
        let k2 = ModelEntity(
            mesh: .generateBox(width: 2.0, height: height, depth: 0.08),
            materials: [constraintMat]
        )
        k2.name = "K2"
        k2.position = .init(0, yPos, 1.5)
        constraintsGroup.addChild(k2)
        
        // K3: Vertical slab/wall at an angle
        let k3 = ModelEntity(
            mesh: .generateBox(width: 0.08, height: height, depth: 1.8),
            materials: [constraintMat]
        )
        k3.name = "K3"
        k3.position = .init(1.2, yPos, -0.8)
        k3.orientation = simd_quatf(angle: Float.pi / 6, axis: [0, 1, 0])
        constraintsGroup.addChild(k3)
        
        rootEntity.addChild(constraintsGroup)
    }
}

