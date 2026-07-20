import UserNotifications

/// Notification Service Extension: lädt das Bild aus der FCM-Payload
/// (`fcm_options.image`) herunter und hängt es als Attachment an, damit
/// Push-Notifications auf iOS Poster/Backdrops zeigen. Bewusst OHNE Firebase-
/// Abhängigkeit (nur System-Framework) — das Projekt nutzt SPM, und ein
/// manueller Download hält die Extension schlank und build-sicher.
class NotificationService: UNNotificationServiceExtension {

    private var contentHandler: ((UNNotificationContent) -> Void)?
    private var bestAttempt: UNMutableNotificationContent?

    override func didReceive(
        _ request: UNNotificationRequest,
        withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
    ) {
        self.contentHandler = contentHandler
        bestAttempt = request.content.mutableCopy() as? UNMutableNotificationContent

        guard let bestAttempt = bestAttempt else {
            contentHandler(request.content)
            return
        }
        guard
            let urlString = imageURLString(from: request.content.userInfo),
            let url = URL(string: urlString)
        else {
            contentHandler(bestAttempt)
            return
        }

        let task = URLSession.shared.downloadTask(with: url) { tempURL, response, _ in
            defer { contentHandler(bestAttempt) }
            guard let tempURL = tempURL else { return }

            // Datei mit passender Endung ablegen — sonst erkennt iOS den Typ nicht.
            var ext = (response?.suggestedFilename as NSString?)?.pathExtension ?? ""
            if ext.isEmpty { ext = url.pathExtension }
            let fileName = ext.isEmpty ? UUID().uuidString : "\(UUID().uuidString).\(ext)"
            let dest = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(fileName)

            do {
                try FileManager.default.moveItem(at: tempURL, to: dest)
                let attachment = try UNNotificationAttachment(identifier: "image", url: dest, options: nil)
                bestAttempt.attachments = [attachment]
            } catch {
                // Bild fehlgeschlagen → Notification bleibt ohne Bild bestehen.
            }
        }
        task.resume()
    }

    override func serviceExtensionTimeWillExpire() {
        // Zeitlimit erreicht: ohne Bild ausliefern, nie verwerfen.
        if let contentHandler = contentHandler, let bestAttempt = bestAttempt {
            contentHandler(bestAttempt)
        }
    }

    private func imageURLString(from userInfo: [AnyHashable: Any]) -> String? {
        if let fcm = userInfo["fcm_options"] as? [String: Any], let img = fcm["image"] as? String {
            return img
        }
        if let img = userInfo["image"] as? String {
            return img
        }
        return nil
    }
}
