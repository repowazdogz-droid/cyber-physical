import Foundation
import RealityKit
import UIKit

struct OutcomesLayer: LayerProtocol {
    let layerName: String = "Outcomes"
    var isVisible: Bool = true
    let rootEntity: Entity = {
        let e = Entity()
        e.name = "Layer_Outcomes"
        return e
    }()
    
    init() {
        // Create "Outcomes" group entity
        let outcomesGroup = Entity()
        outcomesGroup.name = "Outcomes"
        
        // Outcome block material: neutral, selectable
        let outcomeMat = SimpleMaterial(
            color: UIColor(white: 0.85, alpha: 0.9),
            roughness: 0.65,
            isMetallic: false
        )
        
        // Arrange 4 larger blocks
        let yPos: Float = 1.2
        let spacing: Float = 0.5
        let startX: Float = -0.75
        
        let outcomeDefs: [(String, Float)] = [
            ("S1", startX),
            ("S2", startX + spacing),
            ("S3", startX + 2 * spacing),
            ("S4", startX + 3 * spacing)
        ]
        
        for (id, x) in outcomeDefs {
            // Create larger block
            let block = ModelEntity(
                mesh: .generateBox(width: 0.35, height: 0.4, depth: 0.3, cornerRadius: 0.06),
                materials: [outcomeMat]
            )
            block.name = id
            block.position = .init(x, yPos, 0.8)
            
            outcomesGroup.addChild(block)
        }
        
        rootEntity.addChild(outcomesGroup)
    }
}





