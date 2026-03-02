import Foundation
import RealityKit
import UIKit

struct InputsLayer: LayerProtocol {
    let layerName: String = "Inputs"
    var isVisible: Bool = true
    let rootEntity: Entity = {
        let e = Entity()
        e.name = "Layer_Inputs"
        return e
    }()
    
    init() {
        // Create "Inputs" group entity
        let inputsGroup = Entity()
        inputsGroup.name = "Inputs"
        
        // Input tile material: neutral, selectable
        let inputMat = SimpleMaterial(
            color: UIColor(white: 0.80, alpha: 0.9),
            roughness: 0.7,
            isMetallic: false
        )
        
        // Arrange 4 input tiles in a row/arc at y ~ 1.2
        let yPos: Float = 1.2
        let spacing: Float = 0.5
        let startX: Float = -0.75
        
        let inputDefs: [(String, Float)] = [
            ("I1", startX),
            ("I2", startX + spacing),
            ("I3", startX + 2 * spacing),
            ("I4", startX + 3 * spacing)
        ]
        
        for (id, x) in inputDefs {
            // Create input tile as flattened box
            let tile = ModelEntity(
                mesh: .generateBox(width: 0.35, height: 0.12, depth: 0.25, cornerRadius: 0.04),
                materials: [inputMat]
            )
            tile.name = id
            tile.position = .init(x, yPos, -0.8)
            
            inputsGroup.addChild(tile)
        }
        
        rootEntity.addChild(inputsGroup)
    }
}


































