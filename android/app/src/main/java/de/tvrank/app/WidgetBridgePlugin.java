package de.tvrank.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

  @PluginMethod
  public void setData(PluginCall call) {
    String json = call.getString("json");
    if (json == null) {
      call.reject("json fehlt");
      return;
    }
    Context ctx = getContext();
    ctx
      .getSharedPreferences(TvRankWidget.PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(TvRankWidget.KEY_DATA, json)
      .apply();

    Intent update = new Intent(ctx, TvRankWidget.class);
    update.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
    int[] ids = AppWidgetManager
      .getInstance(ctx)
      .getAppWidgetIds(new ComponentName(ctx, TvRankWidget.class));
    update.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
    ctx.sendBroadcast(update);

    call.resolve();
  }
}
