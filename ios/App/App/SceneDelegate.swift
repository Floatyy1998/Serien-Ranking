import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        // Main.storyboard liefert das Fenster samt MainViewController; ohne Storyboard-Fenster hier nachbauen.
        if window == nil {
            let window = UIWindow(windowScene: windowScene)
            window.rootViewController = MainViewController()
            window.makeKeyAndVisible()
            self.window = window
        }

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)

        if let shortcutItem = connectionOptions.shortcutItem {
            deliverShortcutOnceReady(shortcutItem)
        }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }

    // Home-Screen-Shortcut bei laufender App; seit UIScene ruft iOS nicht mehr den AppDelegate.
    func windowScene(_ windowScene: UIWindowScene, performActionFor shortcutItem: UIApplicationShortcutItem, completionHandler: @escaping (Bool) -> Void) {
        postShortcut(shortcutItem)
        completionHandler(true)
    }

    // Kaltstart per Shortcut: Plugins hören erst nach dem ersten capacitorViewDidAppear zu.
    private func deliverShortcutOnceReady(_ shortcutItem: UIApplicationShortcutItem) {
        var token: NSObjectProtocol?
        token = NotificationCenter.default.addObserver(forName: .capacitorViewDidAppear, object: nil, queue: .main) { [weak self] _ in
            if let token {
                NotificationCenter.default.removeObserver(token)
            }
            self?.postShortcut(shortcutItem)
        }
    }

    private func postShortcut(_ shortcutItem: UIApplicationShortcutItem) {
        NotificationCenter.default.post(
            name: NSNotification.Name("handleAppShortcutNotification"),
            object: nil,
            userInfo: ["shortcutItem": shortcutItem]
        )
    }
}
