import SwiftUI

@main
struct AssumptionRoomApp: App {
    @StateObject private var appState = AppState()
    
    var body: some Scene {
        WindowGroup {
            AssumptionRoomScene()
                .environmentObject(appState)
        }
    }
}

