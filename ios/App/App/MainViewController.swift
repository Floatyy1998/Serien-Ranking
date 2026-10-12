import UIKit
import WebKit
import Capacitor

class MainViewController: CAPBridgeViewController {
    override func webView(with frame: CGRect, configuration: WKWebViewConfiguration) -> WKWebView {
        guard ProcessInfo.processInfo.isiOSAppOnMac else {
            return super.webView(with: frame, configuration: configuration)
        }
        return MacWebView(frame: frame, configuration: configuration)
    }
}

/// iPad-App auf Apple-Silicon-Macs: WebKit legt Pfeile in die Kurzbefehlsleiste,
/// macOS zeigt sie als leere graue Leiste unter jedem fokussierten Textfeld.
final class MacWebView: WKWebView {
    override var inputAccessoryView: UIView? { nil }

    override var inputAssistantItem: UITextInputAssistantItem {
        let item = super.inputAssistantItem
        if !item.leadingBarButtonGroups.isEmpty { item.leadingBarButtonGroups = [] }
        if !item.trailingBarButtonGroups.isEmpty { item.trailingBarButtonGroups = [] }
        return item
    }
}
