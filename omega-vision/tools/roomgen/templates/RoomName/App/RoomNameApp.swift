import SwiftUI

@main
struct RoomNameApp: App {
    @StateObject private var appState = AppState()
    
    var body: some Scene {
        WindowGroup {
            RoomNameScene()
                .environmentObject(appState)
        }
    }
}

































