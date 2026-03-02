import Foundation
import RealityKit
import UIKit

struct AuthorityLayer: LayerProtocol {
    let layerName: String = "Authority"
    var isVisible: Bool = true
    let rootEntity: Entity = {
        let e = Entity()
        e.name = "Layer_Authority"
        return e
    }()
    
    init() {
        // Create "Authority" group entity
        let authorityGroup = Entity()
        authorityGroup.name = "Authority"
        
        // Authority pillar material: distinct but neutral colors
        let a1Mat = SimpleMaterial(
            color: UIColor(red: 0.75, green: 0.90, blue: 0.75, alpha: 0.9),
            roughness: 0.6,
            isMetallic: false
        )
        let a2Mat = SimpleMaterial(
            color: UIColor(red: 0.90, green: 0.85, blue: 0.70, alpha: 0.9),
            roughness: 0.6,
            isMetallic: false
        )
        let a3Mat = SimpleMaterial(
            color: UIColor(red: 0.90, green: 0.75, blue: 0.70, alpha: 0.9),
            roughness: 0.6,
            isMetallic: false
        )
        let a4Mat = SimpleMaterial(
            color: UIColor(red: 0.85, green: 0.70, blue: 0.70, alpha: 0.9),
            roughness: 0.6,
            isMetallic: false
        )
        
        // Arrange 4 vertical pillars
        let yPos: Float = 1.2
        let spacing: Float = 0.5
        let startX: Float = -0.75
        
        let authorityDefs: [(String, Float, SimpleMaterial)] = [
            ("A1", startX, a1Mat),
            ("A2", startX + spacing, a2Mat),
            ("A3", startX + 2 * spacing, a3Mat),
            ("A4", startX + 3 * spacing, a4Mat)
        ]
        
        for (id, x, mat) in authorityDefs {
            // Create vertical pillar
            let pillar = ModelEntity(
                mesh: .generateBox(width: 0.2, height: 1.0, depth: 0.2, cornerRadius: 0.05),
                materials: [mat]
            )
            pillar.name = id
            pillar.position = .init(x, yPos, 0)
            
            authorityGroup.addChild(pillar)
        }
        
        rootEntity.addChild(authorityGroup)
    }
}





