import Foundation
import RealityKit
import UIKit

struct AssuranceLinkSpec {
    let id: String
    let fromNodeId: String
    let toNodeId: String
    let title: String
    let meaning: String
    let boundary: String
}

struct LinkLayer: LayerProtocol {
    let layerName: String = "Links"
    var isVisible: Bool = true
    let rootEntity: Entity = {
        let e = Entity()
        e.name = "Layer_Links"
        return e
    }()
    
    // Neutral "allowed influence" links (illustrative, not asserted truth)
    private static let linkSpecs: [AssuranceLinkSpec] = [
        AssuranceLinkSpec(
            id: "L1",
            fromNodeId: "N1",
            toNodeId: "N2",
            title: "Signal quality → estimator stability",
            meaning: "Represents a hypothesised influence where lower-quality sensing can increase estimation drift or inconsistency.",
            boundary: "No magnitude, certainty, or inevitability is implied."
        ),
        AssuranceLinkSpec(
            id: "L2",
            fromNodeId: "N2",
            toNodeId: "N3",
            title: "Estimator drift → control authority",
            meaning: "Represents a mediated influence where degraded state estimation can reduce effective control authority.",
            boundary: "This is a conceptual dependency label, not a measurement."
        ),
        AssuranceLinkSpec(
            id: "L3",
            fromNodeId: "N5",
            toNodeId: "N6",
            title: "Time pressure → outcome class selection",
            meaning: "Represents a framing constraint where time-to-criticality can dominate which bounded outcome class remains feasible.",
            boundary: "This does not predict an outcome; it marks a planning constraint."
        ),
        AssuranceLinkSpec(
            id: "L4",
            fromNodeId: "N4",
            toNodeId: "N6",
            title: "Environment → landing constraints",
            meaning: "Represents a constraint influence where environment validity can restrict which outcomes are allowed (e.g., crowd override).",
            boundary: "Not a policy; a conceptual boundary used for safe reasoning."
        )
    ]
    
    init(nodePositions: [String: SIMD3<Float>]) {
        let linksGroup = Entity()
        linksGroup.name = "Links"
        
        for spec in Self.linkSpecs {
            guard let fromPos = nodePositions[spec.fromNodeId],
                  let toPos = nodePositions[spec.toNodeId] else { continue }
            
            let line = makeLine(from: fromPos, to: toPos, radius: 0.006)
            line.name = "LINK:\(spec.id)"
            
            // Store metadata for inspector lookup
            LinkMetadataStore.shared.store(spec)
            
            linksGroup.addChild(line)
        }
        
        rootEntity.addChild(linksGroup)
    }
    
    // Cylinder line between two points (neutral light material)
    private func makeLine(from: SIMD3<Float>, to: SIMD3<Float>, radius: Float) -> ModelEntity {
        let dir = to - from
        let len = max(0.0001, simd_length(dir))
        let mid = (from + to) * 0.5
        
        let mesh = MeshResource.generateCylinder(height: len, radius: radius)
        let mat = SimpleMaterial(color: UIColor(white: 0.85, alpha: 0.65), roughness: 0.9, isMetallic: false)
        
        let e = ModelEntity(mesh: mesh, materials: [mat])
        e.position = mid
        
        // Rotate cylinder to align with direction
        let up = SIMD3<Float>(0, 1, 0)
        let axis = simd_normalize(simd_cross(up, dir))
        let angle = acos(simd_clamp(simd_dot(simd_normalize(dir), up), -1, 1))
        if simd_length(axis) > 0.0001 && !angle.isNaN {
            e.orientation = simd_quatf(angle: angle, axis: axis)
        }
        return e
    }
}

// Store link metadata for inspector lookup
class LinkMetadataStore {
    static let shared = LinkMetadataStore()
    private var links: [String: AssuranceLinkSpec] = [:]
    
    private init() {}
    
    func store(_ spec: AssuranceLinkSpec) {
        links[spec.id] = spec
    }
    
    func get(_ id: String) -> AssuranceLinkSpec? {
        return links[id]
    }
}

