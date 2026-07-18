import Foundation
import Capacitor
import WidgetKit

@objc(WidgetBridgePlugin)
public class WidgetBridgePlugin: CAPPlugin, CAPBridgedPlugin {
  public let identifier = "WidgetBridgePlugin"
  public let jsName = "WidgetBridge"
  public let pluginMethods: [CAPPluginMethod] = [
    CAPPluginMethod(name: "setData", returnType: CAPPluginReturnPromise)
  ]

  @objc func setData(_ call: CAPPluginCall) {
    guard let json = call.getString("json"), let data = json.data(using: .utf8) else {
      call.reject("json fehlt")
      return
    }
    WidgetStore.save(data)
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
    }
    call.resolve()
  }
}
