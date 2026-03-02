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
        // Create "Uncertainty" group entity
        let uncertaintyGroup = Entity()
        uncertaintyGroup.name = "Uncertainty"
        
        // Uncertainty halo material: faint, translucent
        let haloMat = SimpleMaterial(
            color: UIColor(red: 0.55, green: 0.65, blue: 1.0, alpha: 0.08),
            roughness: 1.0,
            isMetallic: false
        )
        
        let yPos: Float = 1.2
        
        // U1: Halo near Objectives (around O2)
        let u1 = ModelEntity(mesh: .generateSphere(radius: 0.5), materials: [haloMat])
        u1.name = "U1"
        u1.userData.set(true, forKey: "nonSelectable")
        u1.position = .init(0.7, yPos, 0.7)  // Near O2 position
        uncertaintyGroup.addChild(u1)
        
        // U2: Halo near Assurance Front (around T4)
        let u2 = ModelEntity(mesh: .generateSphere(radius: 0.4), materials: [haloMat])
        u2.name = "U2"
        u2.userData.set(true, forKey: "nonSelectable")
        u2.position = .init(0, yPos, 0)  // Near center of assurance front
        uncertaintyGroup.addChild(u2)
        
        rootEntity.addChild(uncertaintyGroup)
    }
}

