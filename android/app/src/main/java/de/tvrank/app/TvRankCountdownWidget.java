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

/** Countdown-Widget: die nächsten Staffeln/Premieren der eigenen Serien. */
public class TvRankCountdownWidget extends AppWidgetProvider {

  private static final int[] TITLE_IDS = { R.id.cd_title1, R.id.cd_title2, R.id.cd_title3 };
  private static final int[] DAYS_IDS = { R.id.cd_days1, R.id.cd_days2, R.id.cd_days3 };

  @Override
  public void onUpdate(Context context, AppWidgetManager manager, int[] widgetIds) {
    for (int id : widgetIds) {
      manager.updateAppWidget(id, build(context));
    }
  }

  private static String formatDays(long days) {
    if (days == 0) return "heute!";
    if (days == 1) return "morgen";
    return "in " + days + " Tagen";
  }

  private RemoteViews build(Context ctx) {
    RemoteViews views = new RemoteViews(ctx.getPackageName(), R.layout.widget_countdown);

    for (int i = 0; i < TITLE_IDS.length; i++) {
      views.setViewVisibility(TITLE_IDS[i], View.GONE);
      views.setViewVisibility(DAYS_IDS[i], View.GONE);
    }
    views.setViewVisibility(R.id.cd_empty, View.GONE);

    try {
      String raw = ctx
        .getSharedPreferences(TvRankWidget.PREFS, Context.MODE_PRIVATE)
        .getString(TvRankWidget.KEY_DATA, null);
      JSONObject data = raw != null ? new JSONObject(raw) : new JSONObject();
      JSONArray countdowns = data.optJSONArray("countdowns");
      int shown = 0;
      if (countdowns != null) {
        for (int i = 0; i < countdowns.length() && shown < TITLE_IDS.length; i++) {
          JSONObject cd = countdowns.optJSONObject(i);
          if (cd == null) continue;
          views.setTextViewText(TITLE_IDS[shown], cd.optString("title", "?"));
          views.setTextViewText(DAYS_IDS[shown], formatDays(cd.optLong("days", 0)));
          views.setViewVisibility(TITLE_IDS[shown], View.VISIBLE);
          views.setViewVisibility(DAYS_IDS[shown], View.VISIBLE);
          shown++;
        }
      }
      if (shown == 0) {
        views.setTextViewText(R.id.cd_empty, "Keine anstehenden Premieren");
        views.setViewVisibility(R.id.cd_empty, View.VISIBLE);
      }
    } catch (Exception e) {
      views.setTextViewText(R.id.cd_empty, "TV-Rank öffnen zum Aktualisieren");
      views.setViewVisibility(R.id.cd_empty, View.VISIBLE);
    }

    Intent open = new Intent(ctx, MainActivity.class);
    PendingIntent pi = PendingIntent.getActivity(
      ctx,
      1,
      open,
      PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
    );
    views.setOnClickPendingIntent(R.id.cd_root, pi);

    return views;
  }
}
