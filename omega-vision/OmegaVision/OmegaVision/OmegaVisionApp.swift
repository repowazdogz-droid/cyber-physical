//
//  OmegaVisionApp.swift
//  OmegaVision
//
//  Created by Warren Smith on 20/12/2025.
//

import SwiftUI

@main
struct OmegaVisionApp: App {
    @StateObject private var state = GalleryState()
    @StateObject private var vault = ArtifactVault()
    
    var body: some Scene {
        WindowGroup {
            GalleryRouter()
                .environmentObject(state)
                .environmentObject(vault)
        }
    }
}
