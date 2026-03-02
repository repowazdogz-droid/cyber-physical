import SwiftUI

@main
struct TradeoffRoomApp: App {
    @StateObject private var appState = AppState()
    
    var body: some Scene {
        WindowGroup {
            TradeoffRoomScene()
                .environmentObject(appState)
        }
    }
}

