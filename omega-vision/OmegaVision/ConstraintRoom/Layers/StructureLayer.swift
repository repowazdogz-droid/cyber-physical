import Foundation
import RealityKit
import UIKit

struct StructureLayer: LayerProtocol {
    let layerName: String = "Structure"
    var isVisible: Bool = true
    let rootEntity: Entity = {
        let e = Entity()
        e.name = "Layer_Structure"
        return e
    }()

    init() {
        // Abstract "anchor" — a neutral frame that implies structure without realism.
        let mat = SimpleMaterial(color: UIColor(white: 0.75, alpha: 1.0), roughness: 0.65, isMetallic: false)

        let base = ModelEntity(mesh: .generateBox(size: 0.35), materials: [mat])
        base.name = "Structure_Base"
        base.position = .init(0, 0.18, 0)

        let pillar = ModelEntity(mesh: .generateBox(width: 0.18, height: 1.2, depth: 0.18), materials: [mat])
        pillar.name = "Structure_Pillar"
        pillar.position = .init(0, 0.85, 0)

        let cap = ModelEntity(mesh: .generateBox(width: 0.35, height: 0.12, depth: 0.35), materials: [mat])
        cap.name = "Structure_Cap"
        cap.position = .init(0, 1.45, 0)

        rootEntity.addChild(base)
        rootEntity.addChild(pillar)
        rootEntity.addChild(cap)
    }
}
