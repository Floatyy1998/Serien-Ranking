import UIKit
import WebKit
import Capacitor

class MainViewController: CAPBridgeViewController {
    override func webView(with frame: CGRect, configuration: WKWebViewConfiguration) -> WKWebView {
        guard ProcessInfo.processInfo.isiOSAppOnMac else {
            return super.webView(with: frame, configuration: configuration)
        }
        configuration.userContentController.addUserScript(MacWebView.noPredictionsScript)
        return MacWebView(frame: frame, configuration: configuration)
    }
}

/// iPad-App auf Apple-Silicon-Macs: WebKit legt Pfeile in die Kurzbefehlsleiste,
/// macOS zeigt sie als leere graue Leiste unter jedem fokussierten Textfeld.
final class MacWebView: WKWebView {
    /// Wortvorschläge halten die Leiste offen, auch wenn sie leer ist — WebKit liest autocorrect beim Fokussieren.
    static let noPredictionsScript = WKUserScript(
        source: """
        (function () {
          function off(event) {
            var target = event.target;
            if (!(target instanceof Element)) return;
            var field = target.closest('input, textarea, [contenteditable]');
            if (field && field.getAttribute('autocorrect') !== 'off') field.setAttribute('autocorrect', 'off');
          }
          ['pointerdown', 'mousedown', 'focus'].forEach(function (type) {
            document.addEventListener(type, off, true);
          });
        })();
        """,
        injectionTime: .atDocumentStart,
        forMainFrameOnly: false
    )

    override var inputAccessoryView: UIView? { nil }

    override var inputAssistantItem: UITextInputAssistantItem {
        let item = super.inputAssistantItem
        if !item.leadingBarButtonGroups.isEmpty { item.leadingBarButtonGroups = [] }
        if !item.trailingBarButtonGroups.isEmpty { item.trailingBarButtonGroups = [] }
        return item
    }
}
