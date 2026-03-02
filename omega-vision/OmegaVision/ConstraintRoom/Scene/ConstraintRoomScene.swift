import SwiftUI
import RealityKit

struct ConstraintRoomScene: View {
    @EnvironmentObject private var appState: AppState

    // Layer visibility state (user-driven only).
    @State private var showStructure: Bool = true
    @State private var showConstraints: Bool = true
    @State private var showAssumptions: Bool = true
    @State private var showUncertainty: Bool = true

    // Inspector selection (read-only).
    @State private var inspectorItem: InspectorItem = InspectorDefaults.empty

    // Reset token (forces RealityView rebuild).
    @State private var resetToken: Int = 0

    // Preset selection.
    @State private var preset: ScenePreset = .t3AssumptionSurface

    // About modal.
    @State private var showAbout: Bool = false

    // RC mode selection.
    @State private var mode: RCMode = .gallery

    // Layers (locked ontology).
    @State private var structureLayer: StructureLayer
    @State private var constraintLayer: ConstraintLayer
    @State private var assumptionLayer: AssumptionLayer
    @State private var uncertaintyLayer: UncertaintyLayer

    init() {
        let built = PresetBuilder.build(preset: .t3AssumptionSurface)
        _structureLayer = State(initialValue: built.structure)
        _constraintLayer = State(initialValue: built.constraints)
        _assumptionLayer = State(initialValue: built.assumptions)
        _uncertaintyLayer = State(initialValue: built.uncertainty)
    }

    var body: some View {
        ZStack(alignment: .top) {
            if mode == .gallery {
                galleryView
            } else {
                RCAuditView()
            }

            // Top center: mode picker
            VStack(spacing: 12) {
                RCModePicker(mode: $mode)
                    .padding(.top, 18)

                if mode == .gallery && appState.showTrustOverlay {
                    HStack(spacing: 12) {
                        TrustOverlay()
                        Button("About") {
                            showAbout = true
                        }
                        .buttonStyle(.borderedProminent)
                        .font(.system(size: 13, weight: .semibold, design: .rounded))
                    }
                }
            }
        }
        .sheet(isPresented: $showAbout) {
            AboutModal(preset: preset)
        }
    }

    private var galleryView: some View {
        ZStack(alignment: .top) {
            RealityView { content in
                _ = SceneLimits.allowAnimation
                _ = SceneLimits.allowTimeStep
                _ = SceneLimits.allowPhysics

                let room = RoomBuilder.makeEmptyRoom()

                room.addChild(structureLayer.rootEntity)
                room.addChild(constraintLayer.rootEntity)
                room.addChild(assumptionLayer.rootEntity)
                room.addChild(uncertaintyLayer.rootEntity)

                content.add(room)
            } update: { _ in
                structureLayer.setVisible(showStructure)
                constraintLayer.setVisible(showConstraints)
                assumptionLayer.setVisible(showAssumptions)
                uncertaintyLayer.setVisible(showUncertainty)
            }
            .id(resetToken)
            // Tap selection: RealityView supports targeted gestures with EntityTargetValue.
            .gesture(
                TapGesture()
                    .targetedToAnyEntity()
                    .onEnded { value in
                        let name = value.entity.name
                        if let meta = SelectionOnly.metadata(preset: preset, for: name) {
                            let item = InspectorItem(
                                title: name,
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

            // UI overlays
            VStack {
                HStack(alignment: .top) {
                    // Left: presets + layer toggles + reset
                    VStack(alignment: .leading, spacing: 10) {
                        PresetPicker(preset: $preset)

                        LayerToggleOnly(
                            showStructure: $showStructure,
                            showConstraints: $showConstraints,
                            showAssumptions: $showAssumptions,
                            showUncertainty: $showUncertainty
                        )

                        ResetViewOnly {
                            // Hard reset: rebuild the RealityView (camera/scene state only).
                            resetToken += 1
                            inspectorItem = InspectorDefaults.empty
                            let built = PresetBuilder.build(preset: preset)
                            structureLayer = built.structure
                            constraintLayer = built.constraints
                            assumptionLayer = built.assumptions
                            uncertaintyLayer = built.uncertainty
                        }
                    }
                    .padding(.leading, 18)
                    .padding(.top, 90)
                    .onChange(of: preset) { _, newPreset in
                        resetToken += 1
                        inspectorItem = InspectorDefaults.empty
                        let built = PresetBuilder.build(preset: newPreset)
                        structureLayer = built.structure
                        constraintLayer = built.constraints
                        assumptionLayer = built.assumptions
                        uncertaintyLayer = built.uncertainty
                    }

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
}

private enum RoomBuilder {
    static func makeEmptyRoom() -> Entity {
        let root = Entity()
        root.name = "ConstraintRoomRoot"

        let size = SceneConfig.roomSize
        let height = SceneConfig.wallHeight
        let t = SceneConfig.wallThickness

        let wallMat = SimpleMaterial(color: .init(white: 0.12, alpha: 1.0), roughness: 0.9, isMetallic: false)
        let floorMat = SimpleMaterial(color: .init(white: 0.10, alpha: 1.0), roughness: 0.95, isMetallic: false)

        let floor = ModelEntity(mesh: .generatePlane(width: size, depth: size), materials: [floorMat])
        floor.name = "Floor"
        floor.position = .init(0, 0, 0)
        root.addChild(floor)

        let w = size
        let h = height

        let north = ModelEntity(mesh: .generatePlane(width: w, height: h), materials: [wallMat])
        north.name = "WallNorth"
        north.position = .init(0, h/2, -size/2)
        north.orientation = simd_quatf(angle: 0, axis: [0,1,0])
        root.addChild(north)

        let south = ModelEntity(mesh: .generatePlane(width: w, height: h), materials: [wallMat])
        south.name = "WallSouth"
        south.position = .init(0, h/2, size/2)
        south.orientation = simd_quatf(angle: .pi, axis: [0,1,0])
        root.addChild(south)

        let east = ModelEntity(mesh: .generatePlane(width: w, height: h), materials: [wallMat])
        east.name = "WallEast"
        east.position = .init(size/2, h/2, 0)
        east.orientation = simd_quatf(angle: -.pi/2, axis: [0,1,0])
        root.addChild(east)

        let west = ModelEntity(mesh: .generatePlane(width: w, height: h), materials: [wallMat])
        west.name = "WallWest"
        west.position = .init(-size/2, h/2, 0)
        west.orientation = simd_quatf(angle: .pi/2, axis: [0,1,0])
        root.addChild(west)

        let light = DirectionalLight()
        light.light.intensity = 1500
        light.shadow = .init()
        light.shadow?.maximumDistance = 10
        light.shadow?.depthBias = 2e-3

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

        _ = t
        return root
    }
}
