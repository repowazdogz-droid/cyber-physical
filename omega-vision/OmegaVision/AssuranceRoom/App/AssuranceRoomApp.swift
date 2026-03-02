import SwiftUI

@main
struct AssuranceRoomApp: App {
    @StateObject private var appState = AppState()
    
    var body: some Scene {
        WindowGroup {
            AssuranceRoomScene()
                .environmentObject(appState)
        }
    }
}

