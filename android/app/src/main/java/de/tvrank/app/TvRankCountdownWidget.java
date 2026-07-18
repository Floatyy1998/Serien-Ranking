package de.tvrank.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.graphics.Bitmap;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** Countdown-Widget: die nächsten Staffeln/Premieren mit Poster + Tage-Zahl. */
public class TvRankCountdownWidget extends AppWidgetProvider {

  private static final int[] ROWS = { R.id.cd_row1, R.id.cd_row2, R.id.cd_row3 };
  private static final int[] IMGS = { R.id.cd_img1, R.id.cd_img2, R.id.cd_img3 };
  private static final int[] TITLES = { R.id.cd_title1, R.id.cd_title2, R.id.cd_title3 };
  private static final int[] WHENS = { R.id.cd_when1, R.id.cd_when2, R.id.cd_when3 };
  private static final int[] DAYS = { R.id.cd_days1, R.id.cd_days2, R.id.cd_days3 };

  @Override
  public void onUpdate(Context context, AppWidgetManager manager, int[] widgetIds) {
    final PendingResult result = goAsync();
    new Thread(() -> {
      try {
        RemoteViews views = build(context);
        for (int id : widgetIds) manager.updateAppWidget(id, views);
      } finally {
        result.finish();
      }
    }).start();
  }

  private RemoteViews build(Context ctx) {
    RemoteViews views = new RemoteViews(ctx.getPackageName(), R.layout.widget_countdown);

    for (int row : ROWS) views.setViewVisibility(row, View.GONE);
    views.setViewVisibility(R.id.cd_empty, View.GONE);

    JSONObject data = WidgetSupport.readPayload(ctx);
    JSONArray countdowns = data.optJSONArray("countdowns");

    List<String> urls = new ArrayList<>();
    if (countdowns != null) {
      for (int i = 0; i < Math.min(countdowns.length(), ROWS.length); i++) {
        JSONObject cd = countdowns.optJSONObject(i);
        if (cd != null) urls.add(cd.optString("poster", ""));
      }
    }
    Map<String, Bitmap> posters = WidgetImageLoader.fetchAll(urls, WidgetSupport.POSTER_W, WidgetSupport.POSTER_H);

    int shown = 0;
    if (countdowns != null) {
      for (int i = 0; i < countdowns.length() && shown < ROWS.length; i++) {
        JSONObject cd = countdowns.optJSONObject(i);
        if (cd == null) continue;
        long days = cd.optLong("days", 0);
        views.setTextViewText(TITLES[shown], cd.optString("title", "?"));
        views.setTextViewText(WHENS[shown], WidgetSupport.formatDays(days));
        views.setTextViewText(DAYS[shown], days == 0 ? "🎬" : String.valueOf(days));
        Bitmap poster = posters.get(cd.optString("poster", ""));
        if (poster != null) views.setImageViewBitmap(IMGS[shown], poster);
        else views.setImageViewResource(IMGS[shown], R.drawable.widget_poster_placeholder);
        views.setViewVisibility(ROWS[shown], View.VISIBLE);
        shown++;
      }
    }

    if (shown == 0) {
      views.setTextViewText(R.id.cd_empty, "Keine anstehenden Premieren");
      views.setViewVisibility(R.id.cd_empty, View.VISIBLE);
    }

    views.setOnClickPendingIntent(R.id.cd_root, WidgetSupport.deepLink(ctx, "countdowns", 1));
    return views;
  }
}
