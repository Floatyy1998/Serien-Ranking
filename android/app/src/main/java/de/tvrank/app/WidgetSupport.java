package de.tvrank.app;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

final class WidgetSupport {

  static final int POSTER_W = 52;
  static final int POSTER_H = 72;

  private static final String[] WEEKDAYS = { "SO", "MO", "DI", "MI", "DO", "FR", "SA" };

  private WidgetSupport() {}

  static JSONObject readPayload(Context ctx) {
    try {
      String raw = ctx
        .getSharedPreferences(TvRankWidget.PREFS, Context.MODE_PRIVATE)
        .getString(TvRankWidget.KEY_DATA, null);
      return raw != null ? refreshed(new JSONObject(raw)) : new JSONObject();
    } catch (Exception e) {
      return new JSONObject();
    }
  }

  // Tageswechsel-Ableitung: die App schiebt Daten nur, wenn sie läuft — Tage,
  // Labels und "heute" werden deshalb beim Rendern aus den absoluten Daten neu
  // berechnet. Felder ohne Datum (alte Payloads) bleiben unverändert.
  private static JSONObject refreshed(JSONObject data) {
    try {
      String todayStr = isoDay(new Date());

      JSONArray week = data.optJSONArray("week");
      if (week != null) {
        JSONArray newWeek = new JSONArray();
        for (int i = 0; i < week.length(); i++) {
          JSONObject day = week.optJSONObject(i);
          if (day == null) continue;
          String date = day.optString("date", "");
          if (date.isEmpty()) {
            newWeek.put(day);
            continue;
          }
          long diff = daysFromToday(date);
          if (diff == Long.MIN_VALUE) {
            newWeek.put(day);
            continue;
          }
          if (diff < 0) continue;
          day.put("label", weekLabel(diff, date));
          newWeek.put(day);
        }
        data.put("week", newWeek);
      }

      JSONArray countdowns = data.optJSONArray("countdowns");
      if (countdowns != null) {
        JSONArray newCds = new JSONArray();
        for (int i = 0; i < countdowns.length(); i++) {
          JSONObject cd = refreshedCountdown(countdowns.optJSONObject(i));
          if (cd != null) newCds.put(cd);
        }
        data.put("countdowns", newCds);
      }
      JSONObject cd = refreshedCountdown(data.optJSONObject("countdown"));
      if (cd != null) data.put("countdown", cd);
      else data.remove("countdown");

      // "Heute" von einem früheren Tag → aus der (bereinigten) Woche ableiten
      String generated = data.optString("generatedDate", "");
      if (!generated.isEmpty() && !generated.equals(todayStr)) {
        JSONArray newToday = new JSONArray();
        JSONArray cleanWeek = data.optJSONArray("week");
        if (cleanWeek != null) {
          for (int i = 0; i < cleanWeek.length(); i++) {
            JSONObject day = cleanWeek.optJSONObject(i);
            if (day == null || !todayStr.equals(prefixDay(day.optString("date", "")))) continue;
            JSONArray eps = day.optJSONArray("eps");
            if (eps == null) break;
            for (int e = 0; e < eps.length(); e++) {
              JSONObject ep = eps.optJSONObject(e);
              if (ep == null) continue;
              JSONObject t = new JSONObject();
              t.put("title", ep.optString("title", "?"));
              t.put("ep", ep.optString("ep", ""));
              t.put("watched", false);
              t.put("poster", ep.optString("poster", ""));
              newToday.put(t);
            }
            break;
          }
        }
        data.put("today", newToday);
      }
    } catch (Exception e) {
      // Ableitung ist best-effort — im Zweifel unveränderte Daten rendern
    }
    return data;
  }

  private static JSONObject refreshedCountdown(JSONObject cd) {
    if (cd == null) return null;
    String date = cd.optString("date", "");
    if (date.isEmpty()) return cd;
    long diff = daysFromToday(date);
    if (diff == Long.MIN_VALUE) return cd;
    if (diff < 0) return null;
    try {
      cd.put("days", diff);
    } catch (Exception ignored) {}
    return cd;
  }

  private static String isoDay(Date d) {
    return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(d);
  }

  private static String prefixDay(String s) {
    return s.length() >= 10 ? s.substring(0, 10) : s;
  }

  private static long daysFromToday(String dateStr) {
    try {
      SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
      Date target = f.parse(prefixDay(dateStr));
      Date today = f.parse(isoDay(new Date()));
      return Math.round((target.getTime() - today.getTime()) / 86400000.0);
    } catch (Exception e) {
      return Long.MIN_VALUE;
    }
  }

  private static String weekLabel(long diff, String dateStr) {
    if (diff == 0) return "HEUTE";
    if (diff == 1) return "MORGEN";
    try {
      Calendar c = Calendar.getInstance();
      c.setTime(new SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(prefixDay(dateStr)));
      return WEEKDAYS[c.get(Calendar.DAY_OF_WEEK) - 1] + " " + c.get(Calendar.DAY_OF_MONTH) + ".";
    } catch (Exception e) {
      return "";
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
