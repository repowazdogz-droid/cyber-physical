import Foundation
import RealityKit
import UIKit

struct TraceLayer: LayerProtocol {
    let layerName: String = "Trace"
    var isVisible: Bool = true
    let rootEntity: Entity = {
        let e = Entity()
        e.name = "Layer_Trace"
        return e
    }()
    
    init() {
        // Create "Trace" group entity
        let traceGroup = Entity()
        traceGroup.name = "Trace"
        
        // Trace material: faint, non-selectable
        let traceMat = SimpleMaterial(
            color: UIColor(white: 0.70, alpha: 0.15),
            roughness: 1.0,
            isMetallic: false
        )
        
        let yPos: Float = 1.2
        
        // Create a faint path/line showing trace surface
        // TR1: Trace marker near inputs
        let tr1 = ModelEntity(
            mesh: .generateSphere(radius: 0.06),
            materials: [traceMat]
        )
        tr1.name = "TR1"
        tr1.userData.set(true, forKey: "nonSelectable")
        tr1.position = .init(-0.75, yPos, -0.8)
        traceGroup.addChild(tr1)
        
        // TR2: Trace marker near authority
        let tr2 = ModelEntity(
            mesh: .generateSphere(radius: 0.06),
            materials: [traceMat]
        )
        tr2.name = "TR2"
        tr2.userData.set(true, forKey: "nonSelectable")
        tr2.position = .init(-0.75, yPos, 0)
        traceGroup.addChild(tr2)
        
        // TR3: Trace marker near outcomes
        let tr3 = ModelEntity(
            mesh: .generateSphere(radius: 0.06),
            materials: [traceMat]
        )
        tr3.name = "TR3"
        tr3.userData.set(true, forKey: "nonSelectable")
        tr3.position = .init(-0.75, yPos, 0.8)
        traceGroup.addChild(tr3)
        
        // Create a faint connecting line (as a thin box)
        let traceLine = ModelEntity(
            mesh: .generateBox(width: 0.02, height: 0.02, depth: 1.6),
            materials: [traceMat]
        )
        traceLine.name = "TR_Line"
        traceLine.userData.set(true, forKey: "nonSelectable")
        traceLine.position = .init(-0.75, yPos, 0)
        traceGroup.addChild(traceLine)
        
        rootEntity.addChild(traceGroup)
    }
}





