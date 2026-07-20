# Hängt das NotificationService-Target (iOS Notification Service Extension) zur
# CI-Build-Zeit ins Xcode-Projekt — damit Push-Notifications auf iOS Bilder
# (Poster/Backdrop aus der FCM-Payload) anzeigen. Kein Mac nötig, das
# Repo-pbxproj bleibt unangetastet. Idempotent. Muster: widget_target.rb.
require 'xcodeproj'

NSE_NAME = 'NotificationService'.freeze

def nse_repo_path(rel)
  File.join(File.expand_path('..', __dir__), rel)
end

def add_notification_service_target!(project_path)
  proj = Xcodeproj::Project.open(nse_repo_path(project_path))
  return if proj.targets.any? { |t| t.name == NSE_NAME }

  app = proj.targets.find { |t| t.name == 'App' }
  raise 'App-Target nicht gefunden' unless app

  nse = proj.new_target(:app_extension, NSE_NAME, :ios, '17.0')

  group = proj.main_group.new_group(NSE_NAME, NSE_NAME)
  src = group.new_file('NotificationService.swift')
  group.new_file('Info.plist')
  nse.source_build_phase.add_file_reference(src)

  nse.build_configurations.each do |config|
    bs = config.build_settings
    bs['PRODUCT_BUNDLE_IDENTIFIER'] = 'de.tvrank.app.NotificationService'
    bs['INFOPLIST_FILE'] = 'NotificationService/Info.plist'
    bs['GENERATE_INFOPLIST_FILE'] = 'NO'
    bs['SWIFT_VERSION'] = '5.0'
    bs['TARGETED_DEVICE_FAMILY'] = '1,2'
    bs['IPHONEOS_DEPLOYMENT_TARGET'] = '17.0'
    bs['MARKETING_VERSION'] = '1.1'
    bs['CURRENT_PROJECT_VERSION'] = '1'
    bs['SKIP_INSTALL'] = 'YES'
    bs['PRODUCT_NAME'] = '$(TARGET_NAME)'
  end

  app.add_dependency(nse)

  # Bestehende „Embed App Extensions"-Phase wiederverwenden (das Widget-Target
  # legt sie ggf. schon an), sonst neu erstellen — sonst zwei Embed-Phasen.
  # Wir landen hier nur, wenn das Target frisch erzeugt wurde (Guard oben),
  # daher ist die Produkt-Referenz garantiert noch nicht eingebettet.
  embed = app.copy_files_build_phases.find { |p| p.symbol_dst_subfolder_spec == :plug_ins }
  embed ||= begin
    phase = app.new_copy_files_build_phase('Embed App Extensions')
    phase.symbol_dst_subfolder_spec = :plug_ins
    phase
  end
  build_file = embed.add_file_reference(nse.product_reference)
  build_file.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }

  proj.save
end
