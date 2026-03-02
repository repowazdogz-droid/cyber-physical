import Foundation
import RealityKit
import UIKit

struct ObjectivesLayer: LayerProtocol {
    let layerName: String = "Objectives"
    var isVisible: Bool = true
    let rootEntity: Entity = {
        let e = Entity()
        e.name = "Layer_Objectives"
        return e
    }()
    
    init() {
        // Create "Objectives" group entity
        let objectivesGroup = Entity()
        objectivesGroup.name = "Objectives"
        
        // Objective material: subtle distinct colors (not traffic light)
        let obj1Mat = SimpleMaterial(
            color: UIColor(red: 0.75, green: 0.85, blue: 0.95, alpha: 0.9),
            roughness: 0.6,
            isMetallic: false
        )
        let obj2Mat = SimpleMaterial(
            color: UIColor(red: 0.85, green: 0.75, blue: 0.90, alpha: 0.9),
            roughness: 0.6,
            isMetallic: false
        )
        let obj3Mat = SimpleMaterial(
            color: UIColor(red: 0.90, green: 0.85, blue: 0.75, alpha: 0.9),
            roughness: 0.6,
            isMetallic: false
        )
        
        // Arrange 3 pillars in a shallow arc at y ~ 1.2
        let radius: Float = 1.4
        let yPos: Float = 1.2
        let startAngle: Float = -Float.pi / 4  // Start at -45 degrees
        let angleStep: Float = Float.pi / 4   // 45 degrees between objectives
        
        let objectiveDefs: [(String, Float, SimpleMaterial)] = [
            ("O1", startAngle, obj1Mat),
            ("O2", startAngle + angleStep, obj2Mat),
            ("O3", startAngle + 2 * angleStep, obj3Mat)
        ]
        
        for (id, angle, mat) in objectiveDefs {
            let x = radius * cos(angle)
            let z = radius * sin(angle)
            
            // Create upright rounded box/pillar
            let pillar = ModelEntity(
                mesh: .generateBox(width: 0.2, height: 1.0, depth: 0.2, cornerRadius: 0.05),
                materials: [mat]
            )
            pillar.name = id
            pillar.position = .init(x, yPos, z)
            
            objectivesGroup.addChild(pillar)
        }
        
        rootEntity.addChild(objectivesGroup)
    }
}

