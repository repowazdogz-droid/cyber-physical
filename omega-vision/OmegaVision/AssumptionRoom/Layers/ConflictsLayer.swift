import Foundation
import RealityKit
import UIKit

struct ConflictsLayer: LayerProtocol {
    let layerName: String = "Conflicts"
    var isVisible: Bool = true
    let rootEntity: Entity = {
        let e = Entity()
        e.name = "Layer_Conflicts"
        return e
    }()
    
    init() {
        // Create "Conflicts" group entity
        let conflictsGroup = Entity()
        conflictsGroup.name = "Conflicts"
        
        // Conflict volume material: translucent red, low opacity
        let conflictVolumeMat = SimpleMaterial(
            color: UIColor(red: 0.95, green: 0.35, blue: 0.35, alpha: 0.18),
            roughness: 0.9,
            isMetallic: false
        )
        
        // Conflict outline material: slightly more visible outline (non-selectable)
        let conflictOutlineMat = SimpleMaterial(
            color: UIColor(red: 0.95, green: 0.35, blue: 0.35, alpha: 0.35),
            roughness: 0.9,
            isMetallic: false
        )
        
        let yPos: Float = 1.2
        
        // C1: Conflict volume (selectable)
        let conflict1Volume = ModelEntity(
            mesh: .generateBox(width: 0.5, height: 0.4, depth: 0.5),
            materials: [conflictVolumeMat]
        )
        conflict1Volume.name = "C1"
        conflict1Volume.position = .init(-0.8, yPos, 0.3)
        conflictsGroup.addChild(conflict1Volume)
        
        // C1 outline (non-selectable)
        let conflict1Outline = ModelEntity(
            mesh: .generateBox(width: 0.52, height: 0.42, depth: 0.52),
            materials: [conflictOutlineMat]
        )
        conflict1Outline.name = "C1_Outline"
        conflict1Outline.userData.set(true, forKey: "nonSelectable")
        conflict1Outline.position = .init(-0.8, yPos, 0.3)
        conflictsGroup.addChild(conflict1Outline)
        
        // C2: Conflict volume (selectable)
        let conflict2Volume = ModelEntity(
            mesh: .generateBox(width: 0.5, height: 0.4, depth: 0.5),
            materials: [conflictVolumeMat]
        )
        conflict2Volume.name = "C2"
        conflict2Volume.position = .init(0.8, yPos, -0.3)
        conflictsGroup.addChild(conflict2Volume)
        
        // C2 outline (non-selectable)
        let conflict2Outline = ModelEntity(
            mesh: .generateBox(width: 0.52, height: 0.42, depth: 0.52),
            materials: [conflictOutlineMat]
        )
        conflict2Outline.name = "C2_Outline"
        conflict2Outline.userData.set(true, forKey: "nonSelectable")
        conflict2Outline.position = .init(0.8, yPos, -0.3)
        conflictsGroup.addChild(conflict2Outline)
        
        rootEntity.addChild(conflictsGroup)
    }
}





