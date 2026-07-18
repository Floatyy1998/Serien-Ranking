package de.tvrank.app;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;

import org.json.JSONObject;

final class WidgetSupport {

  static final int POSTER_W = 52;
  static final int POSTER_H = 72;

  private WidgetSupport() {}

  static JSONObject readPayload(Context ctx) {
    try {
      String raw = ctx
        .getSharedPreferences(TvRankWidget.PREFS, Context.MODE_PRIVATE)
        .getString(TvRankWidget.KEY_DATA, null);
      return raw != null ? new JSONObject(raw) : new JSONObject();
    } catch (Exception e) {
      return new JSONObject();
    }
  }

  static PendingIntent deepLink(Context ctx, String path, int requestCode) {
    Intent open = new Intent(Intent.ACTION_VIEW, Uri.parse("de.tvrank.app://" + path), ctx, MainActivity.class);
    return PendingIntent.getActivity(
      ctx,
      requestCode,
      open,
      PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
    );
  }

  static String formatDays(long days) {
    if (days == 0) return "heute!";
    if (days == 1) return "morgen";
    return "in " + days + " Tagen";
  }
}
