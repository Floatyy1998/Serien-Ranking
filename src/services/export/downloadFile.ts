/** Browser-Download für generierte Export-Dateien (Blob + Object-URL). */
export function downloadFile(filename: string, content: string, mime: string): void {
  try {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  } catch (error) {
    console.error('[export] Download fehlgeschlagen', error);
  }
}
