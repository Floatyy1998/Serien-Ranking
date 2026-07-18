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

/** „Heute läuft"-Widget: heutige Folgen mit Postern + Countdown-Fußzeile. */
public class TvRankWidget extends AppWidgetProvider {

  public static final String PREFS = "tvrank_widget";
  public static final String KEY_DATA = "data";

  private static final int[] ROWS = { R.id.widget_row1, R.id.widget_row2, R.id.widget_row3 };
  private static final int[] IMGS = { R.id.widget_img1, R.id.widget_img2, R.id.widget_img3 };
  private static final int[] TITLES = { R.id.widget_title1, R.id.widget_title2, R.id.widget_title3 };
  private static final int[] SUBS = { R.id.widget_sub1, R.id.widget_sub2, R.id.widget_sub3 };

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
    RemoteViews views = new RemoteViews(ctx.getPackageName(), R.layout.widget_today);

    for (int row : ROWS) views.setViewVisibility(row, View.GONE);
    views.setViewVisibility(R.id.widget_empty, View.GONE);
    views.setViewVisibility(R.id.widget_more, View.GONE);
    views.setViewVisibility(R.id.widget_countdown, View.GONE);

    JSONObject data = WidgetSupport.readPayload(ctx);
    JSONArray today = data.optJSONArray("today");
    int total = today != null ? today.length() : 0;
    views.setTextViewText(R.id.widget_header, total > 0 ? "●  HEUTE · " + total : "●  HEUTE");

    List<String> urls = new ArrayList<>();
    if (today != null) {
      for (int i = 0; i < Math.min(total, ROWS.length); i++) {
        JSONObject ep = today.optJSONObject(i);
        if (ep != null) urls.add(ep.optString("poster", ""));
      }
    }
    Map<String, Bitmap> posters = WidgetImageLoader.fetchAll(urls, WidgetSupport.POSTER_W, WidgetSupport.POSTER_H);

    int shown = 0;
    if (today != null) {
      for (int i = 0; i < total && shown < ROWS.length; i++) {
        JSONObject ep = today.optJSONObject(i);
        if (ep == null) continue;
        boolean watched = ep.optBoolean("watched", false);
        views.setTextViewText(TITLES[shown], ep.optString("title", "?"));
        views.setTextViewText(SUBS[shown], ep.optString("ep", "") + (watched ? "   ✓ gesehen" : ""));
        Bitmap poster = posters.get(ep.optString("poster", ""));
        if (poster != null) views.setImageViewBitmap(IMGS[shown], poster);
        else views.setImageViewResource(IMGS[shown], R.drawable.widget_poster_placeholder);
        views.setViewVisibility(ROWS[shown], View.VISIBLE);
        shown++;
      }
    }

    if (shown == 0) {
      views.setTextViewText(R.id.widget_empty, "Keine neuen Folgen — Zeit für den Backlog 🍿");
      views.setViewVisibility(R.id.widget_empty, View.VISIBLE);
    } else if (total > shown) {
      views.setTextViewText(R.id.widget_more, "+ " + (total - shown) + " weitere");
      views.setViewVisibility(R.id.widget_more, View.VISIBLE);
    }

    JSONObject countdown = data.optJSONObject("countdown");
    if (countdown != null) {
      long days = countdown.optLong("days", -1);
      if (days >= 0) {
        views.setTextViewText(
          R.id.widget_countdown,
          "⏳ " + countdown.optString("title", "?") + " " + WidgetSupport.formatDays(days)
        );
        views.setViewVisibility(R.id.widget_countdown, View.VISIBLE);
      }
    }

    views.setOnClickPendingIntent(R.id.widget_root, WidgetSupport.deepLink(ctx, "calendar", 0));
    return views;
  }
}
