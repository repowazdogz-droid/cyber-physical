import Foundation
import RealityKit

protocol LayerProtocol {
    var layerName: String { get }
    var isVisible: Bool { get set }
    var rootEntity: Entity { get }
    mutating func setVisible(_ visible: Bool)
}

extension LayerProtocol {
    mutating func setVisible(_ visible: Bool) {
        isVisible = visible
        rootEntity.isEnabled = visible
    }
}


































