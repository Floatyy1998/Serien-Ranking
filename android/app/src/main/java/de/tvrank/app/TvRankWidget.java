package de.tvrank.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

/** „Heute läuft"-Widget: liest das von der App gespiegelte JSON aus den SharedPreferences. */
public class TvRankWidget extends AppWidgetProvider {

  public static final String PREFS = "tvrank_widget";
  public static final String KEY_DATA = "data";

  private static final int[] ROW_IDS = { R.id.widget_row1, R.id.widget_row2, R.id.widget_row3, R.id.widget_row4 };

  @Override
  public void onUpdate(Context context, AppWidgetManager manager, int[] widgetIds) {
    for (int id : widgetIds) {
      manager.updateAppWidget(id, build(context));
    }
  }

  private RemoteViews build(Context ctx) {
    RemoteViews views = new RemoteViews(ctx.getPackageName(), R.layout.widget_today);

    for (int rowId : ROW_IDS) views.setViewVisibility(rowId, View.GONE);
    views.setViewVisibility(R.id.widget_empty, View.GONE);
    views.setViewVisibility(R.id.widget_countdown, View.GONE);

    try {
      String raw = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_DATA, null);
      JSONObject data = raw != null ? new JSONObject(raw) : new JSONObject();
      JSONArray today = data.optJSONArray("today");
      int shown = 0;
      if (today != null) {
        for (int i = 0; i < today.length() && shown < ROW_IDS.length; i++) {
          JSONObject ep = today.optJSONObject(i);
          if (ep == null) continue;
          String line = ep.optString("title", "?") + "  ·  " + ep.optString("ep", "");
          views.setTextViewText(ROW_IDS[shown], (ep.optBoolean("watched", false) ? "✓ " : "• ") + line);
          views.setViewVisibility(ROW_IDS[shown], View.VISIBLE);
          shown++;
        }
      }
      int total = today != null ? today.length() : 0;
      views.setTextViewText(R.id.widget_header, total > 0 ? "HEUTE · " + total : "HEUTE");
      if (shown == 0) {
        views.setTextViewText(R.id.widget_empty, "Heute keine neuen Folgen");
        views.setViewVisibility(R.id.widget_empty, View.VISIBLE);
      }

      JSONObject countdown = data.optJSONObject("countdown");
      if (countdown != null) {
        long days = countdown.optLong("days", -1);
        if (days >= 0) {
          String when = days == 0 ? "heute!" : days == 1 ? "morgen" : "in " + days + " Tagen";
          views.setTextViewText(
            R.id.widget_countdown,
            "⏳ " + countdown.optString("title", "?") + " " + when
          );
          views.setViewVisibility(R.id.widget_countdown, View.VISIBLE);
        }
      }
    } catch (Exception e) {
      views.setTextViewText(R.id.widget_empty, "TV-Rank öffnen zum Aktualisieren");
      views.setViewVisibility(R.id.widget_empty, View.VISIBLE);
    }

    Intent open = new Intent(ctx, MainActivity.class);
    PendingIntent pi = PendingIntent.getActivity(
      ctx,
      0,
      open,
      PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
    );
    views.setOnClickPendingIntent(R.id.widget_root, pi);

    return views;
  }
}
