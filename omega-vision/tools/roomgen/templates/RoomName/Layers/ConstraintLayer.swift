import Foundation
import RealityKit

struct ConstraintLayer: LayerProtocol {
    let layerName: String = "Constraints"
    var isVisible: Bool = true
    let rootEntity: Entity = {
        let e = Entity()
        e.name = "Layer_Constraints"
        return e
    }()
    
    init() {
        // Placeholder: empty layer
    }
}

































