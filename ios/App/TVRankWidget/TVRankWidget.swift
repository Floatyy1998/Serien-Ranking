import WidgetKit
import SwiftUI

struct WidgetPayload: Decodable {
  struct Ep: Decodable {
    let title: String
    let ep: String
    let watched: Bool
  }
  struct Countdown: Decodable {
    let title: String
    let days: Int
  }
  let today: [Ep]
  let countdown: Countdown?

  static let empty = WidgetPayload(today: [], countdown: nil)
  static let preview = WidgetPayload(
    today: [
      Ep(title: "One Piece", ep: "S21E135", watched: false),
      Ep(title: "Severance", ep: "S2E8", watched: true),
    ],
    countdown: Countdown(title: "Stranger Things", days: 12)
  )
}

extension WidgetPayload {
  static func loadFromStore() -> WidgetPayload {
    guard let data = WidgetStore.load(),
          let payload = try? JSONDecoder().decode(WidgetPayload.self, from: data)
    else { return .empty }
    return payload
  }
}

struct TodayEntry: TimelineEntry {
  let date: Date
  let payload: WidgetPayload
}

struct TodayProvider: TimelineProvider {
  func placeholder(in context: Context) -> TodayEntry {
    TodayEntry(date: Date(), payload: .preview)
  }

  func getSnapshot(in context: Context, completion: @escaping (TodayEntry) -> Void) {
    completion(TodayEntry(date: Date(), payload: context.isPreview ? .preview : .loadFromStore()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<TodayEntry>) -> Void) {
    let entry = TodayEntry(date: Date(), payload: .loadFromStore())
    completion(Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(1800))))
  }
}

private let accent = Color(red: 0, green: 0.82, blue: 0.14)

struct TodayWidgetView: View {
  @Environment(\.widgetFamily) var family
  let entry: TodayEntry

  var maxRows: Int { family == .systemSmall ? 2 : 3 }

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      Text(entry.payload.today.isEmpty ? "HEUTE" : "HEUTE · \(entry.payload.today.count)")
        .font(.system(size: 11, weight: .bold))
        .kerning(1.2)
        .foregroundStyle(accent)

      if entry.payload.today.isEmpty {
        Text("Keine neuen Folgen")
          .font(.system(size: 13))
          .foregroundStyle(.white.opacity(0.6))
      } else {
        ForEach(Array(entry.payload.today.prefix(maxRows).enumerated()), id: \.offset) { _, ep in
          HStack(spacing: 5) {
            Text(ep.watched ? "✓" : "•")
              .foregroundStyle(ep.watched ? accent : .white.opacity(0.5))
            Text(ep.title)
              .lineLimit(1)
              .foregroundStyle(.white.opacity(0.95))
            Spacer(minLength: 4)
            if family != .systemSmall {
              Text(ep.ep)
                .foregroundStyle(.white.opacity(0.45))
            }
          }
          .font(.system(size: 12.5))
        }
        if entry.payload.today.count > maxRows {
          Text("+ \(entry.payload.today.count - maxRows) weitere")
            .font(.system(size: 11))
            .foregroundStyle(.white.opacity(0.4))
        }
      }

      Spacer(minLength: 0)

      if let cd = entry.payload.countdown {
        Text("⏳ \(cd.title) \(cd.days == 0 ? "heute!" : cd.days == 1 ? "morgen" : "in \(cd.days) Tagen")")
          .font(.system(size: 11))
          .lineLimit(1)
          .foregroundStyle(.white.opacity(0.75))
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .containerBackground(for: .widget) {
      Color(red: 0.043, green: 0.051, blue: 0.063)
    }
  }
}

struct TodayWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "TVRankToday", provider: TodayProvider()) { entry in
      TodayWidgetView(entry: entry)
    }
    .configurationDisplayName("Heute läuft")
    .description("Heutige Folgen deiner Serien und der nächste Countdown.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

@main
struct TVRankWidgetBundle: WidgetBundle {
  var body: some Widget {
    TodayWidget()
  }
}
