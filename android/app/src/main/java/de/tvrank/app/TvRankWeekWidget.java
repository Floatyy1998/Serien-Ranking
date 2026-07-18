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

/** Wochen-Widget: kommende Folgen der nächsten 7 Tage, gruppiert per Tages-Chip. */
public class TvRankWeekWidget extends AppWidgetProvider {

  private static final int[] ROWS = {
    R.id.wk_row1, R.id.wk_row2, R.id.wk_row3, R.id.wk_row4, R.id.wk_row5, R.id.wk_row6,
  };
  private static final int[] DAYS = {
    R.id.wk_day1, R.id.wk_day2, R.id.wk_day3, R.id.wk_day4, R.id.wk_day5, R.id.wk_day6,
  };
  private static final int[] IMGS = {
    R.id.wk_img1, R.id.wk_img2, R.id.wk_img3, R.id.wk_img4, R.id.wk_img5, R.id.wk_img6,
  };
  private static final int[] TITLES = {
    R.id.wk_title1, R.id.wk_title2, R.id.wk_title3, R.id.wk_title4, R.id.wk_title5, R.id.wk_title6,
  };
  private static final int[] SUBS = {
    R.id.wk_sub1, R.id.wk_sub2, R.id.wk_sub3, R.id.wk_sub4, R.id.wk_sub5, R.id.wk_sub6,
  };

  private static class Row {
    String day;
    String title;
    String ep;
    String poster;
  }

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
    RemoteViews views = new RemoteViews(ctx.getPackageName(), R.layout.widget_week);

    for (int row : ROWS) views.setViewVisibility(row, View.GONE);
    views.setViewVisibility(R.id.wk_empty, View.GONE);

    JSONObject data = WidgetSupport.readPayload(ctx);
    JSONArray week = data.optJSONArray("week");

    List<Row> rows = new ArrayList<>();
    if (week != null) {
      for (int d = 0; d < week.length() && rows.size() < ROWS.length; d++) {
        JSONObject day = week.optJSONObject(d);
        if (day == null) continue;
        JSONArray eps = day.optJSONArray("eps");
        if (eps == null) continue;
        for (int e = 0; e < eps.length() && rows.size() < ROWS.length; e++) {
          JSONObject ep = eps.optJSONObject(e);
          if (ep == null) continue;
          Row row = new Row();
          row.day = e == 0 ? day.optString("label", "") : "";
          row.title = ep.optString("title", "?");
          row.ep = ep.optString("ep", "");
          row.poster = ep.optString("poster", "");
          rows.add(row);
        }
      }
    }

    List<String> urls = new ArrayList<>();
    for (Row row : rows) urls.add(row.poster);
    Map<String, Bitmap> posters = WidgetImageLoader.fetchAll(urls, WidgetSupport.POSTER_W, WidgetSupport.POSTER_H);

    for (int i = 0; i < rows.size(); i++) {
      Row row = rows.get(i);
      views.setTextViewText(DAYS[i], row.day);
      views.setTextViewText(TITLES[i], row.title);
      views.setTextViewText(SUBS[i], row.ep);
      Bitmap poster = posters.get(row.poster);
      if (poster != null) views.setImageViewBitmap(IMGS[i], poster);
      else views.setImageViewResource(IMGS[i], R.drawable.widget_poster_placeholder);
      views.setViewVisibility(ROWS[i], View.VISIBLE);
    }

    if (rows.isEmpty()) {
      views.setTextViewText(R.id.wk_empty, "Diese Woche keine neuen Folgen");
      views.setViewVisibility(R.id.wk_empty, View.VISIBLE);
    }

    views.setOnClickPendingIntent(R.id.wk_root, WidgetSupport.deepLink(ctx, "calendar", 2));
    return views;
  }
}
