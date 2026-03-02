import SwiftUI

@main
struct CausalRoomApp: App {
    @StateObject private var appState = AppState()
    
    var body: some Scene {
        WindowGroup {
            CausalRoomScene()
                .environmentObject(appState)
        }
    }
}





