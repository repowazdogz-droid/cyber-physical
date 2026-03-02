import SwiftUI
import RealityKit

struct CausalRoomScene: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.packContext) private var packContext
    
    // Layer visibility state (user-driven only).
    @State private var showStructure: Bool = true
    @State private var showLinks: Bool = true
    @State private var showDisallowedLinks: Bool = true
    @State private var showConstraints: Bool = false
    @State private var showAssumptions: Bool = false
    @State private var showUncertainty: Bool = true
    
    // Inspector selection (read-only).
    @State private var inspectorItem: InspectorItem = InspectorDefaults.empty
    
    // Reset token (forces RealityView rebuild).
    @State private var resetToken: Int = 0
    
    // Preset selection.
    @State private var preset: ScenePreset = .faultToSafeLanding
    
    // Layers (locked ontology).
    @State private var structureLayer = StructureLayer()
    @State private var linkLayer: LinkLayer
    @State private var disallowedLinkLayer: DisallowedLinkLayer
    @State private var constraintLayer = ConstraintLayer()
    @State private var assumptionLayer = AssumptionLayer()
    @State private var uncertaintyLayer = UncertaintyLayer()
    
    init() {
        // Build structure layer first with default preset to get node positions
        let defaultPreset = ScenePreset.faultToSafeLanding
        let structure = StructureLayer(preset: defaultPreset.causalPreset)
        let nodePositions = RoomBuilder.extractNodePositions(from: structure.rootEntity)
        
        // Create link layers with node positions
        _linkLayer = State(initialValue: LinkLayer(nodePositions: nodePositions))
        _disallowedLinkLayer = State(initialValue: DisallowedLinkLayer(nodePositions: nodePositions))
        _structureLayer = State(initialValue: structure)
    }
    
    var body: some View {
        ZStack(alignment: .top) {
            RealityView { content in
                _ = SceneLimits.allowAnimation
                _ = SceneLimits.allowTimeStep
                _ = SceneLimits.allowPhysics
                
                // Create a simple room (minimal, just for context)
                let room = RoomBuilder.makeEmptyRoom()
                
                // Add layers
                room.addChild(structureLayer.rootEntity)
                room.addChild(linkLayer.rootEntity)
                room.addChild(disallowedLinkLayer.rootEntity)
                room.addChild(constraintLayer.rootEntity)
                room.addChild(assumptionLayer.rootEntity)
                room.addChild(uncertaintyLayer.rootEntity)
                
                content.add(room)
            } update: { _ in
                structureLayer.setVisible(showStructure)
                linkLayer.setVisible(showLinks)
                disallowedLinkLayer.setVisible(showDisallowedLinks)
                constraintLayer.setVisible(showConstraints)
                assumptionLayer.setVisible(showAssumptions)
                uncertaintyLayer.setVisible(showUncertainty)
            }
            .id(resetToken)
            .gesture(
                TapGesture()
                    .targetedToAnyEntity()
                    .onEnded { value in
                        let entity = value.entity
                        let name = entity.name
                        
                        // Use canonical non-selectable check
                        if InteractionContract.isNonSelectable(name) {
                            return
                        }
                        if let meta = SelectionOnly.metadata(preset: preset, for: name, packContext: packContext) {
                            // Get better title for links
                            var title = name
                            if name.hasPrefix("LINK:"), let linkId = String(name.dropFirst(5)),
                               let linkMeta = InspectorCopy.linkMetadata(for: linkId) {
                                title = linkMeta.title
                            } else if name.hasPrefix("DISALLOWED:"), let linkId = String(name.dropFirst(11)),
                                      let disallowedMeta = InspectorCopy.disallowedLinkMetadata(for: linkId) {
                                title = disallowedMeta.title
                            } else if name.hasPrefix("N"), let nodeMeta = InspectorCopy.nodeMetadata(for: name, preset: preset.causalPreset, packContext: packContext) {
                                title = nodeMeta.title
                            }
                            
                            let item = InspectorItem(
                                title: title,
                                kind: meta.kind,
                                meaning: InspectorRules.sanitize(meta.meaning),
                                dependsOn: InspectorRules.sanitize(meta.dependsOn),
                                notACommand: SelectionSemantics.purpose
                            )
                            inspectorItem = item
                        } else {
                            inspectorItem = InspectorDefaults.empty
                        }
                    }
            )
            
            // Top center trust overlay
            if appState.showTrustOverlay {
                TrustOverlay()
            }
            
            // UI overlays
            VStack {
                HStack(alignment: .top) {
                    // Left: presets + layer toggles + reset
                    VStack(alignment: .leading, spacing: 10) {
                        PresetPicker(preset: $preset)
                        
                        LayerToggleOnly(
                            showStructure: $showStructure,
                            showLinks: $showLinks,
                            showDisallowedLinks: $showDisallowedLinks,
                            showConstraints: $showConstraints,
                            showAssumptions: $showAssumptions,
                            showUncertainty: $showUncertainty
                        )
                        
                        ResetViewOnly {
                            resetToken += 1
                            inspectorItem = InspectorDefaults.empty
                        }
                    }
                    .padding(.leading, 18)
                    .padding(.top, 90)
                    
                    Spacer()
                    
                    // Right: inspector
                    InspectorPanel(item: inspectorItem)
                        .padding(.trailing, 18)
                        .padding(.top, 90)
                }
                
                Spacer()
            }
            
            // Bottom-left footer
            VStack {
                Spacer()
                HStack {
                    TrustFooter(preset: preset)
                        .padding(.leading, 18)
                        .padding(.bottom, 18)
                    Spacer()
                }
            }
        }
    }
    
    private enum RoomBuilder {
        static func makeEmptyRoom() -> Entity {
            let root = Entity()
            root.name = "CausalRoomRoot"
            
            let size = SceneConfig.roomSize
            let height = SceneConfig.wallHeight
            
            // Floor
            let floorMat = SimpleMaterial(color: .init(white: 0.10, alpha: 1.0), roughness: 0.95, isMetallic: false)
            let floor = ModelEntity(mesh: .generatePlane(width: size, depth: size), materials: [floorMat])
            floor.name = "Floor"
            floor.position = .init(0, 0, 0)
            root.addChild(floor)
            
            // Simple lighting
            let light = DirectionalLight()
            light.light.intensity = 1500
            let lightEntity = Entity()
            lightEntity.name = "KeyLight"
            lightEntity.components.set(light)
            lightEntity.orientation = simd_quatf(angle: -.pi/4, axis: [1,0,0])
            lightEntity.position = .init(0, height, 0)
            root.addChild(lightEntity)
            
            let ambient = PointLight()
            ambient.light.intensity = 300
            let ambientEntity = Entity()
            ambientEntity.name = "AmbientFill"
            ambientEntity.components.set(ambient)
            ambientEntity.position = .init(0, height * 0.9, 0)
            root.addChild(ambientEntity)
            
            return root
        }
        
        // Extract node positions from StructureLayer
        static func extractNodePositions(from root: Entity) -> [String: SIMD3<Float>] {
            var positions: [String: SIMD3<Float>] = [:]
            
            // Node positions are defined in StructureLayer.init()
            // N1-N6 arranged in a ring at radius 1.8, y=1.2
            let radius: Float = 1.8
            let yPos: Float = 1.2
            let nodeAngles: [(String, Float)] = [
                ("N1", 0.0),
                ("N2", Float.pi / 3),
                ("N3", 2 * Float.pi / 3),
                ("N4", Float.pi),
                ("N5", 4 * Float.pi / 3),
                ("N6", 5 * Float.pi / 3)
            ]
            
            for (id, angle) in nodeAngles {
                let x = radius * cos(angle)
                let z = radius * sin(angle)
                positions[id] = SIMD3<Float>(x, yPos, z)
            }
            
            return positions
        }
    }
}

