import Foundation
import RealityKit
import UIKit

struct UnsupportedLayer: LayerProtocol {
    let layerName: String = "Unsupported"
    var isVisible: Bool = true
    let rootEntity: Entity = {
        let e = Entity()
        e.name = "Layer_Unsupported"
        return e
    }()
    
    init() {
        // Create "Unsupported" group entity
        let unsupportedGroup = Entity()
        unsupportedGroup.name = "Unsupported"
        
        // Unsupported region material: translucent gray/blue, low opacity
        let unsupportedRegionMat = SimpleMaterial(
            color: UIColor(red: 0.5, green: 0.6, blue: 0.7, alpha: 0.12),
            roughness: 0.95,
            isMetallic: false
        )
        
        // Marker material: slightly more visible (selectable)
        let markerMat = SimpleMaterial(
            color: UIColor(red: 0.5, green: 0.6, blue: 0.7, alpha: 0.7),
            roughness: 0.8,
            isMetallic: false
        )
        
        let yPos: Float = 1.2
        
        // U1: Unsupported region (non-selectable background)
        let unsupported1Region = ModelEntity(
            mesh: .generateBox(width: 0.6, height: 0.3, depth: 0.6),
            materials: [unsupportedRegionMat]
        )
        unsupported1Region.name = "U1_Region"
        unsupported1Region.userData.set(true, forKey: "nonSelectable")
        unsupported1Region.position = .init(-1.2, yPos, -0.8)
        unsupportedGroup.addChild(unsupported1Region)
        
        // U1 marker (selectable)
        let marker1 = ModelEntity(
            mesh: .generateSphere(radius: 0.08),
            materials: [markerMat]
        )
        marker1.name = "U1"
        marker1.position = .init(-1.2, yPos, -0.8)
        unsupportedGroup.addChild(marker1)
        
        // U2: Unsupported region (non-selectable background)
        let unsupported2Region = ModelEntity(
            mesh: .generateBox(width: 0.6, height: 0.3, depth: 0.6),
            materials: [unsupportedRegionMat]
        )
        unsupported2Region.name = "U2_Region"
        unsupported2Region.userData.set(true, forKey: "nonSelectable")
        unsupported2Region.position = .init(1.2, yPos, 0.8)
        unsupportedGroup.addChild(unsupported2Region)
        
        // U2 marker (selectable)
        let marker2 = ModelEntity(
            mesh: .generateSphere(radius: 0.08),
            materials: [markerMat]
        )
        marker2.name = "U2"
        marker2.position = .init(1.2, yPos, 0.8)
        unsupportedGroup.addChild(marker2)
        
        rootEntity.addChild(unsupportedGroup)
    }
}

