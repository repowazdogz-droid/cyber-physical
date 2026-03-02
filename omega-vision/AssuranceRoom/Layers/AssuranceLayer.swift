import Foundation
import RealityKit

struct AssuranceLayer: LayerProtocol {
    let layerName: String = "Assurances"
    var isVisible: Bool = true
    let rootEntity: Entity = {
        let e = Entity()
        e.name = "Layer_Assurances"
        return e
    }()
    
    init() {
        // Placeholder: empty layer
    }
}

