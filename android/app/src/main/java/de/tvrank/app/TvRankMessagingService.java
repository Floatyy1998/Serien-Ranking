package de.tvrank.app;

import android.app.Notification;
import android.app.NotificationManager;
import android.content.Context;
import android.service.notification.StatusBarNotification;
import androidx.annotation.NonNull;
import com.capacitorjs.plugins.pushnotifications.MessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

/**
 * Faengt stille Data-Messages ab, bevor sie an Capacitor gehen:
 *
 * - "dismiss": nimmt die zugestellten Notifications eines Deep-Links vom
 *   Sperrbildschirm — der Nutzer hat sie auf einem anderen Geraet gelesen.
 * - "replace": tauscht den Text einer zugestellten Chat-Notification leise aus,
 *   wenn der Absender die Nachricht bearbeitet oder geloescht hat (wie WhatsApp).
 *
 * Der Abgleich laeuft ueber den Notification-Tag: pushSender.js setzt
 * android.notification.tag auf den Deep-Link, bei Chat-Nachrichten auf
 * "<Deep-Link>#<Nachrichten-ID>".
 */
public class TvRankMessagingService extends MessagingService {

    private static final String KIND_DISMISS = "dismiss";
    private static final String KIND_REPLACE = "replace";

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        Map<String, String> data = remoteMessage.getData();
        String kind = data.get("kind");
        if (KIND_DISMISS.equals(kind)) {
            cancelByLink(data.get("url"));
            return;
        }
        if (KIND_REPLACE.equals(kind)) {
            replaceText(data.get("url"), data.get("mid"), data.get("body"));
            return;
        }
        super.onMessageReceived(remoteMessage);
    }

    private NotificationManager manager() {
        return (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
    }

    private void cancelByLink(String link) {
        NotificationManager manager = manager();
        if (link == null || link.isEmpty() || manager == null) {
            return;
        }
        for (StatusBarNotification active : manager.getActiveNotifications()) {
            String tag = active.getTag();
            if (tag != null && (tag.equals(link) || tag.startsWith(link + "#"))) {
                manager.cancel(tag, active.getId());
            }
        }
    }

    private void replaceText(String link, String messageId, String body) {
        NotificationManager manager = manager();
        if (link == null || messageId == null || body == null || manager == null) {
            return;
        }
        String tag = link + "#" + messageId;
        for (StatusBarNotification active : manager.getActiveNotifications()) {
            if (!tag.equals(active.getTag())) {
                continue;
            }
            // recoverBuilder behaelt Titel, Icon, Kanal und den Tap-Intent
            Notification.Builder builder = Notification.Builder
                .recoverBuilder(this, active.getNotification())
                .setContentText(body)
                .setStyle(new Notification.BigTextStyle().bigText(body))
                .setOnlyAlertOnce(true);
            manager.notify(tag, active.getId(), builder.build());
        }
    }
}
