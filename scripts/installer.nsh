; Bis 1.1.2 packte der Build alle Web-Abhaengigkeiten mit ein, darunter rund
; 9000 entpackte Capacitor-Dateien mit Pfaden bis 252 Zeichen. Beim Update
; verschiebt der alte Deinstaller jede Datei nach %TEMP% - dort wird der Pfad
; laenger als MAX_PATH, das Verschieben scheitert, und der Installer meldet
; endlos "TV-Rank kann nicht geschlossen werden". Die Huelle braucht den Ordner
; nie; an Ort und Stelle laesst er sich noch loeschen, also vorher weg damit.
!macro customInit
  RMDir /r "$LOCALAPPDATA\Programs\TV-Rank\resources\app.asar.unpacked"
  ${if} $INSTDIR != ""
    RMDir /r "$INSTDIR\resources\app.asar.unpacked"
  ${endIf}
!macroend
