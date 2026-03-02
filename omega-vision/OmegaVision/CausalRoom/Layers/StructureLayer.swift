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
    
    init(preset: CausalPreset? = nil) {
        // Create a "Nodes" group entity
        let nodesGroup = Entity()
        nodesGroup.name = "Nodes"
        
        // Default node definitions: (id, defaultTitle, position angle in radians, defaultMeaning)
        let defaultNodeDefs: [(String, String, Float, String)] = [
            ("N1", "Sensor Quality", 0.0, "Represents the quality and reliability of sensor inputs. This is a conceptual label, not a measurement."),
            ("N2", "Estimator Drift", Float.pi / 3, "Represents drift in estimation processes over time. This is a conceptual label, not a measurement."),
            ("N3", "Control Authority", 2 * Float.pi / 3, "Represents the available control authority in the system. This is a conceptual label, not a measurement."),
            ("N4", "Environment", Float.pi, "Represents environmental conditions and constraints. This is a conceptual label, not a measurement."),
            ("N5", "Time Pressure", 4 * Float.pi / 3, "Represents temporal constraints and urgency factors. This is a conceptual label, not a measurement."),
            ("N6", "Landing Outcome", 5 * Float.pi / 3, "Represents potential landing outcomes. This is a conceptual label, not a measurement.")
        ]
        
        // Apply preset overrides if provided
        let nodeDefs: [(String, String, Float, String)] = defaultNodeDefs.map { (id, defaultTitle, angle, defaultMeaning) in
            let title = preset?.nodeTitles[id] ?? defaultTitle
            let meaning = preset?.nodeMeanings?[id] ?? defaultMeaning
            return (id, title, angle, meaning)
        }
        
        let radius: Float = 1.8
        let yPos: Float = 1.2
        let nodeMat = SimpleMaterial(color: UIColor(white: 0.85, alpha: 1.0), roughness: 0.6, isMetallic: false)
        
        for (id, title, angle, meaning) in nodeDefs {
            let x = radius * cos(angle)
            let z = radius * sin(angle)
            
            // Create node sphere
            let node = ModelEntity(mesh: .generateSphere(radius: 0.12), materials: [nodeMat])
            node.name = id
            node.position = .init(x, yPos, z)
            
            nodesGroup.addChild(node)
        }
        
        rootEntity.addChild(nodesGroup)
    }
}

// Component to store node metadata
struct NodeMetadataComponent: Component {
    let id: String
    let title: String
    let meaning: String
}

