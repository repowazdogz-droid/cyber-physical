import SwiftUI

@main
struct ConstraintRoomApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            ConstraintRoomScene()
                .environmentObject(appState)
        }
    }
}





