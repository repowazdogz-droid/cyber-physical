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
        
        // Halo material: translucent, soft
        let haloMat = SimpleMaterial(
            color: UIColor(red: 0.55, green: 0.65, blue: 1.0, alpha: 0.15),
            roughness: 1.0,
            isMetallic: false
        )
        
        // Halo around N2 (Estimator Drift) at angle pi/3
        let radius: Float = 1.8
        let angleN2 = Float.pi / 3
        let xN2 = radius * cos(angleN2)
        let zN2 = radius * sin(angleN2)
        let yPos: Float = 1.2
        
        let haloN2 = ModelEntity(mesh: .generateSphere(radius: 0.35), materials: [haloMat])
        haloN2.name = "Uncertainty_Halo_N2"
        haloN2.position = .init(xN2, yPos, zN2)
        uncertaintyGroup.addChild(haloN2)
        
        // Halo around N5 (Time Pressure) at angle 4*pi/3
        let angleN5 = 4 * Float.pi / 3
        let xN5 = radius * cos(angleN5)
        let zN5 = radius * sin(angleN5)
        
        let haloN5 = ModelEntity(mesh: .generateSphere(radius: 0.35), materials: [haloMat])
        haloN5.name = "Uncertainty_Halo_N5"
        haloN5.position = .init(xN5, yPos, zN5)
        uncertaintyGroup.addChild(haloN5)
        
        rootEntity.addChild(uncertaintyGroup)
    }
}

