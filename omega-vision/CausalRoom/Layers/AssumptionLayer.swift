import Foundation
import RealityKit

struct AssumptionLayer: LayerProtocol {
    let layerName: String = "Assumptions"
    var isVisible: Bool = true
    let rootEntity: Entity = {
        let e = Entity()
        e.name = "Layer_Assumptions"
        return e
    }()
    
    init() {
        // Placeholder: empty layer
    }
}


































