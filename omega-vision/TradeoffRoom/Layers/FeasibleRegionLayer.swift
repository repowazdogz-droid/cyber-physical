import Foundation
import RealityKit
import UIKit

struct FeasibleRegionLayer: LayerProtocol {
    let layerName: String = "Feasible Region"
    var isVisible: Bool = true
    let rootEntity: Entity = {
        let e = Entity()
        e.name = "Layer_FeasibleRegion"
        return e
    }()
    
    init() {
        // Create "FeasibleRegion" group entity
        let feasibleRegionGroup = Entity()
        feasibleRegionGroup.name = "FeasibleRegion"
        
        // Feasible region material: translucent, very low opacity
        let feasibleMat = SimpleMaterial(
            color: UIColor(red: 0.70, green: 0.85, blue: 0.95, alpha: 0.10),
            roughness: 0.95,
            isMetallic: false
        )
        
        // Create 1 translucent volume representing the feasible region
        let feasibleVolume = ModelEntity(
            mesh: .generateBox(width: 1.8, height: 0.8, depth: 1.6, cornerRadius: 0.2),
            materials: [feasibleMat]
        )
        feasibleVolume.name = "F1"
        feasibleVolume.userData.set(true, forKey: "nonSelectable")
        feasibleVolume.position = .init(0, 1.2, 0)
        
        feasibleRegionGroup.addChild(feasibleVolume)
        
        rootEntity.addChild(feasibleRegionGroup)
    }
}

