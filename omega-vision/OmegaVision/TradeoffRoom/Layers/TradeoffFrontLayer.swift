import Foundation
import RealityKit
import UIKit

struct TradeoffFrontLayer: LayerProtocol {
    let layerName: String = "Tradeoff Front"
    var isVisible: Bool = true
    let rootEntity: Entity = {
        let e = Entity()
        e.name = "Layer_TradeoffFront"
        return e
    }()
    
    init() {
        // Create "TradeoffFront" group entity
        let tradeoffFrontGroup = Entity()
        tradeoffFrontGroup.name = "TradeoffFront"
        
        // Tradeoff front marker material: small, visible spheres
        let frontMat = SimpleMaterial(
            color: UIColor(white: 0.85, alpha: 0.9),
            roughness: 0.5,
            isMetallic: false
        )
        
        // Create 7 small spheres/markers forming a gentle curve
        let yPos: Float = 1.2
        let startX: Float = -1.0
        let endX: Float = 1.0
        let startZ: Float = -0.6
        let endZ: Float = 0.6
        
        for i in 0..<7 {
            let t = Float(i) / Float(6)  // 0.0 to 1.0
            let x = startX + (endX - startX) * t
            // Create a gentle curve (parabolic)
            let z = startZ + (endZ - startZ) * t + 0.3 * sin(t * Float.pi)
            
            let marker = ModelEntity(
                mesh: .generateSphere(radius: 0.08),
                materials: [frontMat]
            )
            marker.name = "T\(i + 1)"
            marker.position = .init(x, yPos, z)
            
            tradeoffFrontGroup.addChild(marker)
        }
        
        rootEntity.addChild(tradeoffFrontGroup)
    }
}

