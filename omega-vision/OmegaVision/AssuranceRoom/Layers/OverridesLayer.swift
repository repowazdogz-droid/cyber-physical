import Foundation
import RealityKit
import UIKit

struct OverridesLayer: LayerProtocol {
    let layerName: String = "Overrides"
    var isVisible: Bool = true
    let rootEntity: Entity = {
        let e = Entity()
        e.name = "Layer_Overrides"
        return e
    }()
    
    init() {
        // Create "Overrides" group entity
        let overridesGroup = Entity()
        overridesGroup.name = "Overrides"
        
        // Override gate material: translucent red, neutral
        let overrideMat = SimpleMaterial(
            color: UIColor(red: 0.95, green: 0.35, blue: 0.35, alpha: 0.25),
            roughness: 0.9,
            isMetallic: false
        )
        
        let yPos: Float = 1.2
        
        // OVR1: Override gate
        let ovr1 = ModelEntity(
            mesh: .generateBox(width: 0.08, height: 1.2, depth: 1.5),
            materials: [overrideMat]
        )
        ovr1.name = "OVR1"
        ovr1.position = .init(-1.2, yPos, 0.4)
        overridesGroup.addChild(ovr1)
        
        // OVR2: Override gate
        let ovr2 = ModelEntity(
            mesh: .generateBox(width: 0.08, height: 1.2, depth: 1.5),
            materials: [overrideMat]
        )
        ovr2.name = "OVR2"
        ovr2.position = .init(0, yPos, 0.4)
        overridesGroup.addChild(ovr2)
        
        // OVR3: Override gate
        let ovr3 = ModelEntity(
            mesh: .generateBox(width: 0.08, height: 1.2, depth: 1.5),
            materials: [overrideMat]
        )
        ovr3.name = "OVR3"
        ovr3.position = .init(1.2, yPos, 0.4)
        overridesGroup.addChild(ovr3)
        
        rootEntity.addChild(overridesGroup)
    }
}





