# Hängt das TVRankWidget-Target zur CI-Build-Zeit ins Xcode-Projekt (kein Mac
# nötig, das Repo-pbxproj bleibt unangetastet). Idempotent.
require 'xcodeproj'
require 'json'

WIDGET_NAME = 'TVRankWidget'.freeze

def add_widget_target!(project_path)
  proj = Xcodeproj::Project.open(project_path)
  return if proj.targets.any? { |t| t.name == WIDGET_NAME }

  app = proj.targets.find { |t| t.name == 'App' }
  raise 'App-Target nicht gefunden' unless app

  widget = proj.new_target(:app_extension, WIDGET_NAME, :ios, '17.0')

  group = proj.main_group.new_group(WIDGET_NAME, WIDGET_NAME)
  widget_src = group.new_file('TVRankWidget.swift')
  store_src = group.new_file('WidgetStore.swift')
  group.new_file('Info.plist')
  group.new_file('TVRankWidget.entitlements')

  widget.source_build_phase.add_file_reference(widget_src)
  widget.source_build_phase.add_file_reference(store_src)

  app_group = proj.main_group['App']
  plugin_src = app_group.new_file('WidgetBridgePlugin.swift')
  app.source_build_phase.add_file_reference(plugin_src)
  app.source_build_phase.add_file_reference(store_src)

  widget.build_configurations.each do |config|
    bs = config.build_settings
    bs['PRODUCT_BUNDLE_IDENTIFIER'] = 'de.tvrank.app.TVRankWidget'
    bs['INFOPLIST_FILE'] = 'TVRankWidget/Info.plist'
    bs['CODE_SIGN_ENTITLEMENTS'] = 'TVRankWidget/TVRankWidget.entitlements'
    bs['GENERATE_INFOPLIST_FILE'] = 'NO'
    bs['SWIFT_VERSION'] = '5.0'
    bs['TARGETED_DEVICE_FAMILY'] = '1,2'
    bs['IPHONEOS_DEPLOYMENT_TARGET'] = '17.0'
    bs['MARKETING_VERSION'] = '1.0'
    bs['CURRENT_PROJECT_VERSION'] = '1'
    bs['SKIP_INSTALL'] = 'YES'
    bs['PRODUCT_NAME'] = '$(TARGET_NAME)'
  end

  app.add_dependency(widget)

  embed = app.new_copy_files_build_phase('Embed App Extensions')
  embed.symbol_dst_subfolder_spec = :plug_ins
  build_file = embed.add_file_reference(widget.product_reference)
  build_file.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }

  proj.save
end

# Der von `cap sync` generierten Plugin-Liste unser lokales Plugin hinzufügen
def register_widget_bridge_plugin!(config_json_path)
  config = JSON.parse(File.read(config_json_path))
  list = config['packageClassList'] || []
  unless list.include?('WidgetBridgePlugin')
    config['packageClassList'] = list + ['WidgetBridgePlugin']
    File.write(config_json_path, JSON.pretty_generate(config))
  end
end
