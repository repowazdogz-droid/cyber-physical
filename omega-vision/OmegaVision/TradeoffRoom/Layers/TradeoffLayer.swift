import Foundation
import RealityKit

struct TradeoffLayer: LayerProtocol {
    let layerName: String = "Tradeoffs"
    var isVisible: Bool = true
    let rootEntity: Entity = {
        let e = Entity()
        e.name = "Layer_Tradeoffs"
        return e
    }()
    
    init() {
        // Placeholder: empty layer
    }
}

