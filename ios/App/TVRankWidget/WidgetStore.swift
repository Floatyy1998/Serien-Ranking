import Foundation
import Security

// Geteilte Ablage App <-> Widget über die Keychain: beide Targets listen
// $(AppIdentifierPrefix)de.tvrank.app.shared als ERSTE keychain-access-group,
// dadurch landen Default-Writes/-Reads ohne Team-ID im Code in derselben Gruppe.
enum WidgetStore {
  private static let service = "de.tvrank.app.widget"
  private static let account = "payload"

  static func save(_ data: Data) {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: account,
    ]
    SecItemDelete(query as CFDictionary)
    var attrs = query
    attrs[kSecValueData as String] = data
    attrs[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
    SecItemAdd(attrs as CFDictionary, nil)
  }

  static func load() -> Data? {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: account,
      kSecReturnData as String: true,
      kSecMatchLimit as String: kSecMatchLimitOne,
    ]
    var out: CFTypeRef?
    guard SecItemCopyMatching(query as CFDictionary, &out) == errSecSuccess else { return nil }
    return out as? Data
  }
}
