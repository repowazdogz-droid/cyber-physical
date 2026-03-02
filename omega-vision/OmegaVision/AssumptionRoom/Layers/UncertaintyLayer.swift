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
        
        // Halo material: translucent, soft, faint
        let haloMat = SimpleMaterial(
            color: UIColor(red: 0.55, green: 0.65, blue: 1.0, alpha: 0.10),
            roughness: 1.0,
            isMetallic: false
        )
        
        // H1: Halo around A2 (Sensor data is representative)
        // A2 is at angle: startAngle + angleStep = -pi/3 + pi/4 = -pi/12
        let assumptionRadius: Float = 1.6
        let startAngle: Float = -Float.pi / 3
        let angleStep: Float = Float.pi / 4
        let angleA2 = startAngle + angleStep
        let xA2 = assumptionRadius * cos(angleA2)
        let zA2 = assumptionRadius * sin(angleA2)
        let yPos: Float = 1.2
        
        let halo1 = ModelEntity(mesh: .generateSphere(radius: 0.4), materials: [haloMat])
        halo1.name = "H1"
        halo1.userData.set(true, forKey: "nonSelectable")
        halo1.position = .init(xA2, yPos, zA2)
        uncertaintyGroup.addChild(halo1)
        
        // H2: Halo around A6 (Time pressure is manageable)
        // A6 is at angle: startAngle + 5*angleStep = -pi/3 + 5*pi/4 = 11*pi/12
        let angleA6 = startAngle + 5 * angleStep
        let xA6 = assumptionRadius * cos(angleA6)
        let zA6 = assumptionRadius * sin(angleA6)
        
        let halo2 = ModelEntity(mesh: .generateSphere(radius: 0.4), materials: [haloMat])
        halo2.name = "H2"
        halo2.userData.set(true, forKey: "nonSelectable")
        halo2.position = .init(xA6, yPos, zA6)
        uncertaintyGroup.addChild(halo2)
        
        rootEntity.addChild(uncertaintyGroup)
    }
}

