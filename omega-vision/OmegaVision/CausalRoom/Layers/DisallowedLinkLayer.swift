import Foundation
import RealityKit
import UIKit

struct DisallowedLinkSpec {
    let id: String
    let fromNodeId: String
    let toNodeId: String
    let title: String
    let reason: String
}

struct DisallowedLinkLayer: LayerProtocol {
    let layerName: String = "DisallowedLinks"
    var isVisible: Bool = true
    let rootEntity: Entity = {
        let e = Entity()
        e.name = "Layer_DisallowedLinks"
        return e
    }()
    
    // Explicit boundaries: links we do NOT allow as direct claims in this model
    private static let disallowedSpecs: [DisallowedLinkSpec] = [
        DisallowedLinkSpec(
            id: "D1",
            fromNodeId: "N1",
            toNodeId: "N6",
            title: "Direct: Sensor quality → landing outcome",
            reason: "Disallowed as a direct causal claim here: skips intermediate mechanisms (estimation → authority → outcome class)."
        ),
        DisallowedLinkSpec(
            id: "D2",
            fromNodeId: "N2",
            toNodeId: "N6",
            title: "Direct: Estimator drift → landing outcome",
            reason: "Disallowed as direct: confounded and typically mediated by control authority and time pressure."
        ),
        DisallowedLinkSpec(
            id: "D3",
            fromNodeId: "N4",
            toNodeId: "N3",
            title: "Direct: Environment → control authority",
            reason: "Disallowed as direct: environment can constrain sensing and planning, but does not directly create actuation authority."
        )
    ]
    
    init(nodePositions: [String: SIMD3<Float>]) {
        let disallowedGroup = Entity()
        disallowedGroup.name = "DisallowedLinks"
        
        for spec in Self.disallowedSpecs {
            guard let fromPos = nodePositions[spec.fromNodeId],
                  let toPos = nodePositions[spec.toNodeId] else { continue }
            
            let dashed = makeDashedLine(from: fromPos, to: toPos, segmentCount: 10, radius: 0.006)
            dashed.name = "DISALLOWED:\(spec.id)"
            
            // Store metadata for inspector lookup
            DisallowedLinkMetadataStore.shared.store(spec)
            
            disallowedGroup.addChild(dashed)
        }
        
        rootEntity.addChild(disallowedGroup)
    }
    
    private func makeDashedLine(from: SIMD3<Float>, to: SIMD3<Float>, segmentCount: Int, radius: Float) -> Entity {
        let root = Entity()
        let dir = to - from
        let totalLen = max(0.0001, simd_length(dir))
        let unit = dir / totalLen
        
        // Create short cylinders with gaps
        let dashLen = totalLen / Float(max(1, segmentCount * 2))
        let gapLen = dashLen
        
        var cursor = from
        for i in 0..<segmentCount {
            let start = cursor
            let end = start + unit * dashLen
            let mid = (start + end) * 0.5
            let segLen = max(0.0001, simd_length(end - start))
            
            let mesh = MeshResource.generateCylinder(height: segLen, radius: radius)
            let mat = SimpleMaterial(color: UIColor(red: 0.9, green: 0.3, blue: 0.3, alpha: 0.45), roughness: 0.9, isMetallic: false)
            
            let e = ModelEntity(mesh: mesh, materials: [mat])
            e.position = mid
            
            // Align to direction
            let up = SIMD3<Float>(0, 1, 0)
            let axis = simd_normalize(simd_cross(up, dir))
            let angle = acos(simd_clamp(simd_dot(simd_normalize(dir), up), -1, 1))
            if simd_length(axis) > 0.0001 && !angle.isNaN {
                e.orientation = simd_quatf(angle: angle, axis: axis)
            }
            
            e.name = "DASH:\(i)"
            root.addChild(e)
            
            cursor = end + unit * gapLen
        }
        
        return root
    }
}

// Store disallowed link metadata for inspector lookup
class DisallowedLinkMetadataStore {
    static let shared = DisallowedLinkMetadataStore()
    private var links: [String: DisallowedLinkSpec] = [:]
    
    private init() {}
    
    func store(_ spec: DisallowedLinkSpec) {
        links[spec.id] = spec
    }
    
    func get(_ id: String) -> DisallowedLinkSpec? {
        return links[id]
    }
}





