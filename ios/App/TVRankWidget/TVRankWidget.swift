import WidgetKit
import SwiftUI
import UIKit

// MARK: - Payload

struct WidgetPayload: Decodable {
  struct Ep: Decodable {
    let title: String
    let ep: String
    let watched: Bool
    let poster: String?
  }
  struct Countdown: Decodable {
    let title: String
    let days: Int
    let poster: String?
  }
  struct Day: Decodable {
    let label: String
    let eps: [Ep2]
  }
  struct Ep2: Decodable {
    let title: String
    let ep: String
    let poster: String?
  }
  let today: [Ep]
  let countdown: Countdown?
  let countdowns: [Countdown]?
  let week: [Day]?

  static let empty = WidgetPayload(today: [], countdown: nil, countdowns: nil, week: nil)
  static let preview = WidgetPayload(
    today: [
      Ep(title: "One Piece", ep: "S21E135", watched: false, poster: nil),
      Ep(title: "Severance", ep: "S2E8", watched: true, poster: nil),
    ],
    countdown: Countdown(title: "Stranger Things", days: 12, poster: nil),
    countdowns: [
      Countdown(title: "Stranger Things", days: 12, poster: nil),
      Countdown(title: "House of the Dragon", days: 40, poster: nil),
    ],
    week: [
      Day(label: "HEUTE", eps: [Ep2(title: "One Piece", ep: "S21E135", poster: nil)]),
      Day(label: "MORGEN", eps: [Ep2(title: "Severance", ep: "S2E8", poster: nil)]),
    ]
  )

  static func loadFromStore() -> WidgetPayload {
    guard let data = WidgetStore.load(),
          let payload = try? JSONDecoder().decode(WidgetPayload.self, from: data)
    else { return .empty }
    return payload
  }

  var allPosterURLs: [String] {
    var urls = today.compactMap { $0.poster }
    urls += (countdowns ?? []).compactMap { $0.poster }
    urls += (week ?? []).flatMap { $0.eps.compactMap { $0.poster } }
    var seen = Set<String>()
    return urls.filter { !$0.isEmpty && seen.insert($0).inserted }
  }
}

// MARK: - Timeline (lädt kleine Poster mit)

struct TodayEntry: TimelineEntry {
  let date: Date
  let payload: WidgetPayload
  let posters: [String: UIImage]
}

struct TodayProvider: TimelineProvider {
  func placeholder(in context: Context) -> TodayEntry {
    TodayEntry(date: Date(), payload: .preview, posters: [:])
  }

  func getSnapshot(in context: Context, completion: @escaping (TodayEntry) -> Void) {
    let payload: WidgetPayload = context.isPreview ? .preview : .loadFromStore()
    completion(TodayEntry(date: Date(), payload: payload, posters: [:]))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<TodayEntry>) -> Void) {
    let payload = WidgetPayload.loadFromStore()
    let urls = payload.allPosterURLs.prefix(24)
    guard !urls.isEmpty else {
      completion(entryTimeline(payload, [:]))
      return
    }
    let group = DispatchGroup()
    var images: [String: UIImage] = [:]
    let lock = NSLock()
    for url in urls {
      guard let u = URL(string: url) else { continue }
      group.enter()
      URLSession.shared.dataTask(with: u) { data, _, _ in
        if let data = data, let img = UIImage(data: data) {
          lock.lock()
          images[url] = img
          lock.unlock()
        }
        group.leave()
      }.resume()
    }
    group.notify(queue: .main) {
      completion(self.entryTimeline(payload, images))
    }
  }

  private func entryTimeline(_ payload: WidgetPayload, _ posters: [String: UIImage]) -> Timeline<TodayEntry> {
    let entry = TodayEntry(date: Date(), payload: payload, posters: posters)
    return Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(1800)))
  }
}

// MARK: - Design-Bausteine

private let accent = Color(red: 0, green: 0.82, blue: 0.14)

private var widgetBackground: some View {
  LinearGradient(
    colors: [
      Color(red: 0.055, green: 0.067, blue: 0.084),
      Color(red: 0.024, green: 0.031, blue: 0.043),
    ],
    startPoint: .top,
    endPoint: .bottom
  )
}

struct HeaderText: View {
  let text: String
  var body: some View {
    HStack(spacing: 5) {
      Circle().fill(accent).frame(width: 5, height: 5)
      Text(text)
        .font(.system(size: 10.5, weight: .heavy, design: .rounded))
        .kerning(1.4)
        .foregroundStyle(accent)
    }
  }
}

struct PosterThumb: View {
  let image: UIImage?
  let fallback: String
  var width: CGFloat = 24
  var height: CGFloat = 34

  @ViewBuilder
  private func poster(_ img: UIImage) -> some View {
    // iOS-18-Tinted-Modus maskiert Bilder sonst zu weißen Silhouetten
    if #available(iOSApplicationExtension 18.0, *) {
      Image(uiImage: img)
        .resizable()
        .aspectRatio(contentMode: .fill)
        .widgetAccentedRenderingMode(.fullColor)
    } else {
      Image(uiImage: img)
        .resizable()
        .aspectRatio(contentMode: .fill)
    }
  }

  var body: some View {
    Group {
      if let img = image {
        poster(img)
      } else {
        ZStack {
          Color.white.opacity(0.08)
          Text(String(fallback.prefix(1)))
            .font(.system(size: width * 0.5, weight: .bold, design: .rounded))
            .foregroundStyle(.white.opacity(0.4))
        }
      }
    }
    .frame(width: width, height: height)
    .clipShape(RoundedRectangle(cornerRadius: 5, style: .continuous))
    .overlay(
      RoundedRectangle(cornerRadius: 5, style: .continuous)
        .strokeBorder(.white.opacity(0.12), lineWidth: 0.5)
    )
  }
}

struct EpChip: View {
  let text: String
  var body: some View {
    Text(text)
      .font(.system(size: 9.5, weight: .semibold, design: .monospaced))
      .foregroundStyle(.white.opacity(0.55))
      .padding(.horizontal, 5)
      .padding(.vertical, 2)
      .background(Color.white.opacity(0.07), in: Capsule())
  }
}

struct EmptyHint: View {
  let text: String
  var body: some View {
    Text(text)
      .font(.system(size: 12.5, design: .rounded))
      .foregroundStyle(.white.opacity(0.55))
  }
}

// MARK: - Heute läuft

struct TodayWidgetView: View {
  @Environment(\.widgetFamily) var family
  let entry: TodayEntry

  var maxRows: Int { family == .systemSmall ? 2 : 3 }

  var body: some View {
    VStack(alignment: .leading, spacing: 7) {
      HeaderText(text: entry.payload.today.isEmpty ? "HEUTE" : "HEUTE · \(entry.payload.today.count)")

      if entry.payload.today.isEmpty {
        Spacer(minLength: 0)
        EmptyHint(text: "Keine neuen Folgen — Zeit für den Backlog 🍿")
        Spacer(minLength: 0)
      } else {
        ForEach(Array(entry.payload.today.prefix(maxRows).enumerated()), id: \.offset) { _, ep in
          HStack(spacing: 8) {
            PosterThumb(image: ep.poster.flatMap { entry.posters[$0] }, fallback: ep.title)
            VStack(alignment: .leading, spacing: 1) {
              Text(ep.title)
                .font(.system(size: 12.5, weight: .semibold, design: .rounded))
                .lineLimit(1)
                .foregroundStyle(.white.opacity(ep.watched ? 0.45 : 0.95))
                .strikethrough(ep.watched, color: .white.opacity(0.3))
              HStack(spacing: 4) {
                EpChip(text: ep.ep)
                if ep.watched {
                  Text("✓")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(accent)
                }
              }
            }
            Spacer(minLength: 0)
          }
        }
        if entry.payload.today.count > maxRows {
          Text("+ \(entry.payload.today.count - maxRows) weitere")
            .font(.system(size: 10.5, design: .rounded))
            .foregroundStyle(.white.opacity(0.4))
        }
        Spacer(minLength: 0)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .widgetURL(URL(string: "de.tvrank.app://calendar"))
    .containerBackground(for: .widget) { widgetBackground }
  }
}

struct TodayWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "TVRankToday", provider: TodayProvider()) { entry in
      TodayWidgetView(entry: entry)
    }
    .configurationDisplayName("Heute läuft")
    .description("Heutige Folgen deiner Serien auf einen Blick.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

// MARK: - Countdown

struct CountdownWidgetView: View {
  @Environment(\.widgetFamily) var family
  let entry: TodayEntry

  var items: [WidgetPayload.Countdown] {
    let all = entry.payload.countdowns ?? (entry.payload.countdown.map { [$0] } ?? [])
    return Array(all.prefix(family == .systemSmall ? 1 : 3))
  }

  private func number(_ days: Int) -> String {
    days == 0 ? "🎬" : "\(days)"
  }

  private func unit(_ days: Int) -> String {
    days == 0 ? "heute!" : days == 1 ? "Tag" : "Tage"
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HeaderText(text: "COUNTDOWN")

      if items.isEmpty {
        Spacer(minLength: 0)
        EmptyHint(text: "Keine anstehenden Premieren")
        Spacer(minLength: 0)
      } else if family == .systemSmall, let cd = items.first {
        Spacer(minLength: 0)
        VStack(alignment: .leading, spacing: 3) {
          HStack(alignment: .firstTextBaseline, spacing: 4) {
            Text(number(cd.days))
              .font(.system(size: 34, weight: .heavy, design: .rounded))
              .foregroundStyle(accent)
            Text(unit(cd.days))
              .font(.system(size: 13, weight: .semibold, design: .rounded))
              .foregroundStyle(accent.opacity(0.7))
          }
          Text(cd.title)
            .font(.system(size: 12.5, weight: .semibold, design: .rounded))
            .lineLimit(2)
            .foregroundStyle(.white.opacity(0.95))
        }
        Spacer(minLength: 0)
      } else {
        ForEach(Array(items.enumerated()), id: \.offset) { _, cd in
          HStack(spacing: 8) {
            PosterThumb(image: cd.poster.flatMap { entry.posters[$0] }, fallback: cd.title, width: 26, height: 37)
            VStack(alignment: .leading, spacing: 1) {
              Text(cd.title)
                .font(.system(size: 12.5, weight: .semibold, design: .rounded))
                .lineLimit(1)
                .foregroundStyle(.white.opacity(0.95))
              Text(cd.days == 0 ? "heute!" : cd.days == 1 ? "morgen" : "in \(cd.days) Tagen")
                .font(.system(size: 11, weight: .medium, design: .rounded))
                .foregroundStyle(accent.opacity(0.9))
            }
            Spacer(minLength: 0)
            Text(number(cd.days))
              .font(.system(size: 20, weight: .heavy, design: .rounded))
              .foregroundStyle(accent.opacity(0.85))
          }
        }
        Spacer(minLength: 0)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .widgetURL(URL(string: "de.tvrank.app://countdowns"))
    .containerBackground(for: .widget) { widgetBackground }
  }
}

struct CountdownWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "TVRankCountdown", provider: TodayProvider()) { entry in
      CountdownWidgetView(entry: entry)
    }
    .configurationDisplayName("Countdown")
    .description("Countdown zu den nächsten Staffeln und Premieren deiner Serien.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

// MARK: - Wochen-Kalender

struct WeekWidgetView: View {
  @Environment(\.widgetRenderingMode) var renderingMode
  let entry: TodayEntry

  // Höhen-Budget einer systemLarge-Kachel: 3 Tage à max. 2 Folgen
  var days: [WidgetPayload.Day] { Array((entry.payload.week ?? []).prefix(3)) }

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HeaderText(text: "DEINE WOCHE")

      if days.isEmpty {
        Spacer(minLength: 0)
        EmptyHint(text: "Diese Woche keine neuen Folgen")
        Spacer(minLength: 0)
      } else {
        ForEach(Array(days.enumerated()), id: \.offset) { _, day in
          VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 6) {
              dayChip(day.label)
              Rectangle()
                .fill(.white.opacity(0.08))
                .frame(height: 0.5)
            }
            ForEach(Array(day.eps.prefix(2).enumerated()), id: \.offset) { _, ep in
              HStack(spacing: 7) {
                PosterThumb(image: ep.poster.flatMap { entry.posters[$0] }, fallback: ep.title, width: 20, height: 28)
                Text(ep.title)
                  .font(.system(size: 12, weight: .medium, design: .rounded))
                  .lineLimit(1)
                  .foregroundStyle(.white.opacity(0.92))
                Spacer(minLength: 4)
                EpChip(text: ep.ep)
              }
            }
          }
        }
        Spacer(minLength: 0)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .widgetURL(URL(string: "de.tvrank.app://calendar"))
    .containerBackground(for: .widget) { widgetBackground }
  }

  @ViewBuilder
  private func dayChip(_ label: String) -> some View {
    // Invertierter HEUTE-Chip nur in Vollfarbe — im Tinted-Modus wäre Schwarz auf Weiß unlesbar
    let inverted = label == "HEUTE" && renderingMode == .fullColor
    Text(label)
      .font(.system(size: 10, weight: .heavy, design: .rounded))
      .kerning(0.8)
      .foregroundStyle(inverted ? Color.black : accent)
      .padding(.horizontal, 7)
      .padding(.vertical, 2.5)
      .background(
        inverted ? AnyShapeStyle(accent) : AnyShapeStyle(accent.opacity(0.14)),
        in: Capsule()
      )
  }
}

struct WeekWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "TVRankWeek", provider: TodayProvider()) { entry in
      WeekWidgetView(entry: entry)
    }
    .configurationDisplayName("Deine Woche")
    .description("Die kommenden Folgen deiner Serien in den nächsten 7 Tagen.")
    .supportedFamilies([.systemLarge])
  }
}

// MARK: - Bundle

@main
struct TVRankWidgetBundle: WidgetBundle {
  var body: some Widget {
    TodayWidget()
    CountdownWidget()
    WeekWidget()
  }
}
