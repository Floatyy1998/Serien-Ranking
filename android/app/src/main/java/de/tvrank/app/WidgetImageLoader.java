package de.tvrank.app;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.BitmapShader;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Shader;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

/** Lädt kleine Poster synchron (nur aus goAsync-Hintergrund-Threads rufen). */
final class WidgetImageLoader {

  private WidgetImageLoader() {}

  static Map<String, Bitmap> fetchAll(Iterable<String> urls, int widthPx, int heightPx) {
    Map<String, Bitmap> out = new HashMap<>();
    for (String url : urls) {
      if (url == null || url.isEmpty() || out.containsKey(url)) continue;
      Bitmap bmp = fetch(url);
      if (bmp != null) out.put(url, rounded(bmp, widthPx, heightPx));
    }
    return out;
  }

  private static Bitmap fetch(String url) {
    try {
      HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
      conn.setConnectTimeout(4000);
      conn.setReadTimeout(4000);
      try (InputStream in = conn.getInputStream()) {
        return BitmapFactory.decodeStream(in);
      } finally {
        conn.disconnect();
      }
    } catch (Exception e) {
      return null;
    }
  }

  private static Bitmap rounded(Bitmap src, int widthPx, int heightPx) {
    Bitmap scaled = Bitmap.createScaledBitmap(src, widthPx, heightPx, true);
    Bitmap out = Bitmap.createBitmap(widthPx, heightPx, Bitmap.Config.ARGB_8888);
    Canvas canvas = new Canvas(out);
    Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    paint.setShader(new BitmapShader(scaled, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP));
    float radius = widthPx * 0.18f;
    canvas.drawRoundRect(new RectF(0, 0, widthPx, heightPx), radius, radius, paint);
    return out;
  }
}
