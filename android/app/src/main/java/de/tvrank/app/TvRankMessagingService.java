package de.tvrank.app;

import android.app.NotificationManager;
import android.content.Context;
import android.service.notification.StatusBarNotification;
import androidx.annotation.NonNull;
import com.capacitorjs.plugins.pushnotifications.MessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

/**
 * Faengt stille "dismiss"-Data-Messages ab und nimmt die zugestellte
 * Notification desselben Deep-Links vom Sperrbildschirm — der Nutzer hat sie
 * auf einem anderen Geraet gelesen. Alles andere reicht sie unveraendert an
 * Capacitor weiter.
 *
 * Der Abgleich laeuft ueber den Notification-Tag: pushSender.js setzt
 * android.notification.tag auf den Deep-Link, deshalb ist er hier bekannt.
 */
public class TvRankMessagingService extends MessagingService {

    private static final String KIND_DISMISS = "dismiss";

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        Map<String, String> data = remoteMessage.getData();
        if (KIND_DISMISS.equals(data.get("kind"))) {
            cancelByTag(data.get("url"));
            return;
        }
        super.onMessageReceived(remoteMessage);
    }

    private void cancelByTag(String tag) {
        if (tag == null || tag.isEmpty()) {
            return;
        }
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) {
            return;
        }
        for (StatusBarNotification active : manager.getActiveNotifications()) {
            if (tag.equals(active.getTag())) {
                manager.cancel(active.getTag(), active.getId());
            }
        }
    }
}
