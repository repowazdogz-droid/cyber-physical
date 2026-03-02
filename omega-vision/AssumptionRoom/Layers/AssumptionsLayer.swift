import Foundation
import RealityKit
import UIKit

struct AssumptionsLayer: LayerProtocol {
    let layerName: String = "Assumptions"
    var isVisible: Bool = true
    let rootEntity: Entity = {
        let e = Entity()
        e.name = "Layer_Assumptions"
        return e
    }()
    
    init() {
        // Create "Assumptions" group entity
        let assumptionsGroup = Entity()
        assumptionsGroup.name = "Assumptions"
        
        // Assumption material: soft, neutral, selectable
        let assumptionMat = SimpleMaterial(
            color: UIColor(red: 0.70, green: 0.85, blue: 0.95, alpha: 0.9),
            roughness: 0.7,
            isMetallic: false
        )
        
        // Arrange assumptions in a gentle arc at y ~ 1.2
        let radius: Float = 1.6
        let yPos: Float = 1.2
        let startAngle: Float = -Float.pi / 3  // Start at -60 degrees
        let angleStep: Float = Float.pi / 4   // ~45 degrees between assumptions
        
        // A1-A6 assumptions
        let assumptionDefs: [(String, Float)] = [
            ("A1", startAngle),
            ("A2", startAngle + angleStep),
            ("A3", startAngle + 2 * angleStep),
            ("A4", startAngle + 3 * angleStep),
            ("A5", startAngle + 4 * angleStep),
            ("A6", startAngle + 5 * angleStep)
        ]
        
        for (id, angle) in assumptionDefs {
            let x = radius * cos(angle)
            let z = radius * sin(angle)
            
            // Create assumption as rounded box (slightly flattened sphere)
            let assumption = ModelEntity(
                mesh: .generateBox(width: 0.18, height: 0.18, depth: 0.18, cornerRadius: 0.04),
                materials: [assumptionMat]
            )
            assumption.name = id
            assumption.position = .init(x, yPos, z)
            
            assumptionsGroup.addChild(assumption)
        }
        
        rootEntity.addChild(assumptionsGroup)
    }
}


































