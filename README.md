
ToyBlocks
=========
Dieses Dokument soll zukünftigen Entwicklern einen Überblick über verwendete Technologien liefern und eine kurze Einführung in den Programmcode geben. 

**ToyBlocks** ist ein webbasiertes Lernspiel für Studierende des Fachbereichs Architektur, das im Rahmen des Basiskurses Architekturgeschichte (Modul 312) als interdisziplinäres Konzept zwischen den Fachbereichen Architektur und Informatik der TU Darmstadt entstanden ist.

Ziel dieses Studienprojektes ist es, den Studierenden zusätzlich zu den Referaten im Basiskurs Grundlagen zur Architekturgeschichte zu vermitteln, um Gelerntes zu vertiefen und den eigenen Wissensstand zu testen.

Momentan wird **ToyBlocks** unter <https://toyblocks.architektur.tu-darmstadt.de/> gehostet.

Entwickler:
      
* Simon Bugert <simon.bugert@googlemail.com>* Mansur Iqbal <mansuriqbal@gmail.com>* Steven Lamarr Reynolds <reynolds.tud@googlemail.com>* Andrej Tretjakow <tretjakow@gmail.com>

---

Technologien und Architektur
----------------------------

* [node.js][nodejs] als Serverplatform
* [npm] zur Verwaltung von node.js-Modulen
* [mongoDB][mongo]: Document-Database
* [graphicsmagick] zur Bildverarbeitung/-skalierung
* [http-proxy] als reverse proxy für https-Verbindungen
* [forever] stellt sicher, dass die node-Applikation u.A. bei Abstürzen neugestartet wird
* init-Skripte für die node.js-Applikation, mongoDB sowie den http-proxy

Die Software läuft zurzeit auf einem Debiansystem. Für den Stack wurde der Benutzer _production_ eingerichtet, auf den per SSH nur ein key-basierter Login erlaubt ist.  
Lediglich der **http-proxy** wird mit Root-Rechten gestartet um den Port 80 öffnen zu können. Sobald dies erfolgt ist, werden die Root-Rechte wieder abgegeben.

Änderungen können zu dem git remote `ssh://production@www5.architektur.tu-darmstadt.de/home/production/repos/toyblocks` gepusht werden.  
Ein _git post-receive hook_ kopiert die Änderungen nach `/home/production/apps/toyblocks` und **forever** startet die Applikation neu, da es die Dateiänderungen bemerkt.  
Node.js ist in `/home/production/node/latest` installiert, was das updaten und wechseln von Versionen vereinfacht.  
Logs werden im Verzeichnis `/home/production/logs` gespeichert.  
Der Datenbankspeicher liegt in `/home/production/dbs/mongo`.  


Abhängigkeiten und Anforderungen
--------------------------------
Die wichtigsten verwendeten node.js-Module:

* [express] in Version 3 als Web-Framework
* [Dustjs][dust] als Templating-Engine (Linkedin-Fork)
* [mongodb] als mongoDB-Client
* [gm] als node.js-wrapper für graphicsmagick

Alle node.js-Abhängikeiten können durch einen einzigen Aufruf von `npm install` im Verzeichnis installiert werden. Die Dependencies sind hierfür in der Datei _package.json_ definiert.

Eine Beispieldatenbank liegt im Ordner _toyblocks_dump/_.  
Diese kann durch `mongorestore toyblocks_dump` wiederhergestellt werden. Druch den zusätzlichen Parameter `--drop` wird die bestehende Datenbank überschrieben.

**ToyBlocks** kann in zwei Modi verwendet werden - `production` oder `development`. Diese unterscheiden sich u.A. in der Art des Loggings. Der Modus wird durch eine Linux-Umgebungsvariable bestimmt, die sich auch im init-Skript wiederfindet.

Entwicklungsumgebung
--------------------
Die Frontend-Dependencies werden durch [Bower][bower] in der Datei _bower.json_ verwaltet.  
`bower install` lädt alle Pakete in _bower_components/_.  
**Bower** wird hierfür am besten _global_ installiert durch `npm install -g bower`.

Als build-Tool wird [Grunt][grunt] verwendet. Auf dem aktuellen Stand gibt es einen Task, der in _Gruntfile.js_ spezifizierte Dateien, die von Bower geladen wurden, in die entsprechenden Ordner kopiert.  
Um **Grunt** verwenden zu können, muss das _grunt-cli_ durch `npm install -g grunt-cli` installiert werden.
Ein Aufruf von `grunt init` führt dann den oben genannten Task aus.

Dadurch können sehr einfach Frontend-Pakete hinzugefügt und entfernt werden.

Eine Liste der wichtigsten Pakete, die im Frontend verwendet werden:

* [jQuery][jquery]
* [Twitter Bootstrap][bootstrap]: Front-End-Framework
* [jQuery UI][jquery-ui] u.A. für Drag-Events
* [Summernote][summernote]: WYSIWYG Editor für Bootstrap
* [Font Awesome][fontawesome]: Icon-Font für Summernote
* [Flot][flot]: Plotting-Library für Statistiken
* [jQuery UI Touch Punch][jquery-ui-touch-punch]: Touch Event Support für jQuery UI
* [jQuery bootpag][jquery-bootpag]: Pagination
* im Verzeichnis _public/css/_ befindet sich die Toyblocks-Font, die fünf Spielsymbole enthält

Im Projektverzeichnis befindet sich außerdem die jshint-Konfigurationsdatei _.jshintrc_, die den [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript/) sicherstellt.  
Nachdem **jshint** durch `npm install -g jshint` installiert wurde, kann eine Datei durch Aufruf von `jshint dateiname.js` überprüft werden.

---

Dokumentation
-------------

Beim Aufruf einer Webseite wird die URL in der Hauptapplikationsdatei _app.js_ dispatcht. URLs sind immer in der Form _/area/controller/action_. Wenn eine der drei URL-Teile fehlt, wird sie durch _index_ ersetzt. Anschließend wir der richtige Controller instanziiert. Es gibt einen Grundcontroller in _/controllers/Base.js_, von dem alle Controller extenden. Dort sind Funktionen, die in jedem Controller benötigt werden. Danach hat jede Area einen Controller mit Grundfunktionen für die entsprechenden Controller aus der Area. Dadurch, dass jeder Controller den Base-Controller erweitert, kann man Funktionalitäten überschreiben wie zum Beispiel Aufruf-Rechte eines Controllers.

#### Controller

Der _Base-Controller_ bekommt beim Insanziieren von der _app.js_ den _Mongo-Datenbank-Handler_, das _MongoDB-Objekt_, das _Request-Objekt_ von Express.js und das _Response-Objekt_ übergeben. So kann man in jedem Controller dadrauf zugreifen. Wenn ein Controller insaziiert ist, wird die Funktion _run()_ aufgerufen, die die passende Action darin aufruft. In der Action ist dann der eigentliche Code für diesen Seitenaufruf. Nach allen Operationen wird _this.view.render()_ aufgerufen, die das passende Template lädt.

#### View
Die _this.view_ Variable ist eine Insanz der View, die sich in der Datei _views/Base.js_ befindet. Dort werden Templates geladen und entsprechende Basis-Variablen (wie z.B. _area, _controller oder _action um in jedem Template zu wissen, wo man sich befindet - hilfreich für das Layout-Template) an die Templates übergeben.

#### Templates
Die Templates befinden sich im Ordner _templates/_ und sind ähnlich den Controllern angeordnet, d.h. für jede Area und Controller ein Ordner. Je Action gibt es ein Template, das so wie die Action selbst mit _.dust_ als Endung benannt wird. **Dust.js** ist die Template-Engine. Mehr dazu auf der [Homepage von dust.js][dust].  
Die meisten Templates inkludieren das Layout unter _templates/layout/layout.dust_. Dieser wiederum inkludiert den Header, Footer und Content. Content ist aufgeteilt in ContentHead, Content und ContentFoot. Dies ist praktisch zum Beispiel für die Ajax-Pagination. Bei Anfragen über Ajax setzt man bei der view über die Funktion _setContentOnly(true)_ den Indikator, dass nur der "Content"-Inhalt gerendert werden soll und dieser wird entsprechend nur in diesen Bereich durch das Paginations-Javascript automatisch geladen.

#### Javascript
Die allgemeinen Javascript-Funktionalitäten befinden sich unter _public/js/_. Die Hauptdatei für das Toyblocks Projekt ist _main.js_. Dort werden Formularelemente, die Pagination und wichtige Modals konfiguriert. Spezieller Javascript-Code, der nur in jeweils einer Action benutzt wird, ist inline in dem Action-Template eingebunden, damit sich die js-Datei nicht unnötig aufbläht und der Code leicht zu finden ist.

#### Stylesheets
Bei den Stylesheets verhält es sich Ähnlich den Javascript-Dateien. Das meiste kommt vom Bootstrap-Framework. Spezielle Styles werden in der _public/css/main.css_ für das Projekt angepasst. Styles die nur in einer Action vorkommen, werden auch inline nur in der Action eingebunden, um das Haupt-Stylesheet nicht unnötig aufzublähen.

#### ToyBlocks-Objekte
Die Struktur von **Toyblocks** basiert auf einem simplen selbstentwickelten Objekte-Attribute System. Es gibt eine Verwaltung für Attribute, die grundlegende Attribute mit ihren Eigenschaften anlegen kann. Diese haben einen bestimmt Typ, Titel und ob sie vordefinierte Werte haben. Mögliche Attribut-Typen sind bislang:

* string - Einfaches Textfeld für Namen, Titel und Ähnliches. Vordefinierte Werte werden als eine Auswahl-Selectbox gezeigt.
* text - Textarea für längere Texte mit [Summernote][summernote] als Texteditor
* int - Einfache Zahlen, die so auch validiert werden
* bool - Ja/Nein Auswahl
* image - Bilder-Upload. Die Bilder werden in der der images-Collection in Mongo abgelegt.
* objecttype - Referenzen zu anderen Objekten. In einem neuen Modal kann man Objekte aus anderen Objekttypen referenzieren.

In der Objekte-Verwaltung wiederum setzt man Objekt-Typen aus den vorhandenen Attributen zusammen. Für einen neuen Objekt-Typ gibt man einen technischen Namen ein, der später als der Name der Collection in der Datenbank dient. Einen Titel und die Attribute die sich darin befinden. Bei den Attributen kann man bestimmen, ob sie multipel sein dürfen und ob sie obligatorisch sind. (Anzeigbar wird momentan nicht genutzt, sollte aber dazu dienen, um in dem Objekte-Anzeige Interface nur anzeigbare Attribute anzuzeigen, um es überschaubar zu halten.) Wenn ein Typ angelegt ist, kann er angeklickt werden um die ensprechenden Objekt in diesem Typ zu sehen, zu bearbeiten und neue zu erstellen.

Beispielhaft am Fehlstellen-Spiel: Wir haben einen Objekt-Typ mit _Titel_, _Fehlstellen-Bild_, _Kategorie_, _korrekten Einzelteilen_ und _Lösungsbild_. Ein anderer Objekt-Typ _Fehlstellen Einzelteile_ beschreibt die Einzelteile, die in den Kategorien vorkommen können. Wenn man ein Spiel beginnt, wird einem das Fehlstellen-Bild mit Lücken angezeigt. Aus den Einzelteilen werden alle Einzelteile aus der Kategorie des Spiels geladen. Durch die Referenz im Spiel auf das korrekte Einzelteil, weiß das Spiel die richtige Lösung. Referenzen sind immer über die MongoIDs verknüpft.

#### Benutzer
Als Nutzer von Toyblocks kann jeder mit einer _TU-ID_ bzw. entsprechendem Login werden. Man wird über den [SSO] eingeloggt und falls nicht in der users-Collection existent ensprechend angelegt. Wir benutzen das _SAML1.1-Protokoll_. Im Base-Controller in der _checkLogin-Funktion_ ist die komplette User-Login Verwaltung beschrieben.

#### Rechte
Für die Rechte ist die Funktion _getRightLevel()_ verantwortlich. Ein Besucher der Webseite hat ein Recht von _400_, ein Student _300_, ein Moderator _200_ und ein Administrator _100_. Damit ist sichergestellt, dass zum Beispiel ein Moderator alles machen kann, was auch ein Student machen kann, aber nicht das, was für Admins erlaubt ist. Die Zahlen sind im Hunderter Bereich, damit es durch eventuell kommende zusätzliche Rechte einfach erweitert werden kann.




[toyblocks]:  https://toyblocks.architektur.tu-darmstadt.de/  "Toyblocks URL"
[nodejs]:  http://nodejs.org/  "node.js"
[npm]: https://www.npmjs.org/
[mongo]: http://www.mongodb.org/ "mongoDB" 
[express]: http://expressjs.com/ "express"
[dust]: http://linkedin.github.io/dustjs/ "Dustjs"
[http-proxy]: https://github.com/nodejitsu/node-http-proxy/tree/v0.10.4 "node-http-proxy"
[forever]: https://github.com/nodejitsu/forever "forever"
[graphicsmagick]: http://www.graphicsmagick.org/ "Graphicsmagick"
[gm]: https://www.npmjs.org/package/gm "gm"
[mongodb]: https://www.npmjs.org/package/mongodb "mongodb"
[grunt]: http://gruntjs.com/ "Grunt"
[bower]: http://bower.io/ "Bower"
[bootstrap]: http://getbootstrap.com/ "Twitter Bootstrap"
[jquery]: http://jquery.com/ "jQuery"
[jquery-ui]: http://jqueryui.com/ "jQuery UI"
[summernote]: http://hackerwins.github.io/summernote/ "Summernote"
[fontawesome]: http://fortawesome.github.io/Font-Awesome/ "Font Awesome"
[flot]: http://www.flotcharts.org/ "Flot"
[jquery-ui-touch-punch]: https://github.com/furf/jquery-ui-touch-punch.git "jQuery UI Touch Punch"
[jquery-bootpag]: http://botmonster.com/jquery-bootpag/ "jQuery bootpag"
[SSO]: http://www.hrz.tu-darmstadt.de/id/authentisierung/sso/index.de.jsp "Single Sign-On der TU Darmstadt"