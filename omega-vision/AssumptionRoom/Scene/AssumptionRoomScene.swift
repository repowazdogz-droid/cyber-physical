import SwiftUI
import RealityKit

struct AssumptionRoomScene: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.packContext) private var packContext
    
    // Layer visibility state (user-driven only).
    @State private var showAssumptions: Bool = true
    @State private var showConflicts: Bool = true
    @State private var showUnsupported: Bool = false
    @State private var showUncertainty: Bool = true
    
    // Inspector selection (read-only).
    @State private var inspectorItem: InspectorItem = InspectorDefaults.empty
    
    // Reset token (forces RealityView rebuild).
    @State private var resetToken: Int = 0
    
    // Preset selection.
    @State private var preset: ScenePreset = .researchReasoning
    
    // Layers (locked ontology).
    @State private var assumptionsLayer = AssumptionsLayer()
    @State private var conflictsLayer = ConflictsLayer()
    @State private var unsupportedLayer = UnsupportedLayer()
    @State private var uncertaintyLayer = UncertaintyLayer()
    
    var body: some View {
        ZStack(alignment: .top) {
            RealityView { content in
                _ = SceneLimits.allowAnimation
                _ = SceneLimits.allowTimeStep
                _ = SceneLimits.allowPhysics
                
                // Create a simple room (minimal, just for context)
                let room = RoomBuilder.makeEmptyRoom()
                
                // Add layers
                room.addChild(assumptionsLayer.rootEntity)
                room.addChild(conflictsLayer.rootEntity)
                room.addChild(unsupportedLayer.rootEntity)
                room.addChild(uncertaintyLayer.rootEntity)
                
                content.add(room)
            } update: { _ in
                assumptionsLayer.setVisible(showAssumptions)
                conflictsLayer.setVisible(showConflicts)
                unsupportedLayer.setVisible(showUnsupported)
                uncertaintyLayer.setVisible(showUncertainty)
            }
            .id(resetToken)
            .gesture(
                TapGesture()
                    .targetedToAnyEntity()
                    .onEnded { value in
                        let entity = value.entity
                        let name = entity.name
                        
                        // Use canonical non-selectable check (also check userData for room-specific markers)
                        if entity.userData.get(boolForKey: "nonSelectable") == true ||
                           InteractionContract.isNonSelectable(name) {
                            return
                        }
                        
                        if let meta = SelectionOnly.metadata(preset: preset, for: name, packContext: packContext) {
                            // Get title from metadata if available
                            var title = name
                            if name.hasPrefix("A"), let assumptionMeta = InspectorCopy.assumptionMetadata(for: name, preset: preset.assumptionPreset) {
                                title = assumptionMeta.title
                            } else if name.hasPrefix("C"), let conflictMeta = InspectorCopy.conflictMetadata(for: name) {
                                title = conflictMeta.title
                            } else if name.hasPrefix("U"), let unsupportedMeta = InspectorCopy.unsupportedMetadata(for: name) {
                                title = unsupportedMeta.title
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
                            showAssumptions: $showAssumptions,
                            showConflicts: $showConflicts,
                            showUnsupported: $showUnsupported,
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
            root.name = "AssumptionRoomRoot"
            
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
        
    }
}

