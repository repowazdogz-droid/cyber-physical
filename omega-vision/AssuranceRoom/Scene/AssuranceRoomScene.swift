import SwiftUI
import RealityKit

struct AssuranceRoomScene: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.packContext) private var packContext
    
    // Layer visibility state (user-driven only).
    @State private var showInputs: Bool = true
    @State private var showAuthority: Bool = true
    @State private var showOutcomes: Bool = true
    @State private var showOverrides: Bool = true
    @State private var showTrace: Bool = true
    
    // Inspector selection (read-only).
    @State private var inspectorItem: InspectorItem = InspectorDefaults.empty
    
    // Reset token (forces RealityView rebuild).
    @State private var resetToken: Int = 0
    
    // Preset selection.
    @State private var preset: ScenePreset = .uavSafeLanding
    
    // Layers (locked ontology).
    @State private var inputsLayer = InputsLayer()
    @State private var authorityLayer = AuthorityLayer()
    @State private var outcomesLayer = OutcomesLayer()
    @State private var overridesLayer = OverridesLayer()
    @State private var traceLayer = TraceLayer()
    
    var body: some View {
        ZStack(alignment: .top) {
            RealityView { content in
                _ = SceneLimits.allowAnimation
                _ = SceneLimits.allowTimeStep
                _ = SceneLimits.allowPhysics
                
                // Create a simple room (minimal, just for context)
                let room = RoomBuilder.makeEmptyRoom()
                
                // Add layers
                room.addChild(inputsLayer.rootEntity)
                room.addChild(authorityLayer.rootEntity)
                room.addChild(outcomesLayer.rootEntity)
                room.addChild(overridesLayer.rootEntity)
                room.addChild(traceLayer.rootEntity)
                
                content.add(room)
            } update: { _ in
                inputsLayer.setVisible(showInputs)
                authorityLayer.setVisible(showAuthority)
                outcomesLayer.setVisible(showOutcomes)
                overridesLayer.setVisible(showOverrides)
                traceLayer.setVisible(showTrace)
            }
            .id(resetToken)
            .gesture(
                TapGesture()
                    .targetedToAnyEntity()
                    .onEnded { value in
                        let entity = value.entity
                        let name = entity.name
                        
                        // Use canonical non-selectable check (also check userData and room-specific patterns)
                        if entity.userData.get(boolForKey: "nonSelectable") == true ||
                           InteractionContract.isNonSelectable(name) ||
                           name.hasPrefix("TR") { // Trace layer (room-specific)
                            inspectorItem = InspectorDefaults.empty
                            return
                        }
                        
                        if let meta = SelectionOnly.metadata(preset: preset, for: name, packContext: packContext) {
                            // Get title from metadata if available (uses pack override, then preset)
                            let assurancePreset = preset.assurancePreset
                            var title = name
                            if name.hasPrefix("I"), let inputMeta = InspectorCopy.inputMetadata(for: name, preset: assurancePreset, packContext: packContext) {
                                title = inputMeta.title
                            } else if name.hasPrefix("A"), let authorityMeta = InspectorCopy.authorityMetadata(for: name, preset: assurancePreset, packContext: packContext) {
                                title = authorityMeta.title
                            } else if name.hasPrefix("S"), let outcomeMeta = InspectorCopy.outcomeMetadata(for: name, preset: assurancePreset, packContext: packContext) {
                                title = outcomeMeta.title
                            } else if name.hasPrefix("OVR"), let overrideMeta = InspectorCopy.overrideMetadata(for: name, preset: assurancePreset, packContext: packContext) {
                                title = overrideMeta.title
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
                            showInputs: $showInputs,
                            showAuthority: $showAuthority,
                            showOutcomes: $showOutcomes,
                            showOverrides: $showOverrides,
                            showTrace: $showTrace
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
        .onChange(of: preset) { _, newPreset in
            resetToken += 1 // Force RealityView rebuild
            inspectorItem = InspectorDefaults.empty // Clear inspector
            
            // Rebuild layers with the new preset (geometry remains the same, but internal state might be reset)
            let built = PresetBuilder.build(preset: newPreset)
            inputsLayer = built.inputs
            authorityLayer = built.authority
            outcomesLayer = built.outcomes
            overridesLayer = built.overrides
            traceLayer = built.trace
        }
    }
    
    private enum RoomBuilder {
        static func makeEmptyRoom() -> Entity {
            let root = Entity()
            root.name = "AssuranceRoomRoot"
            
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

