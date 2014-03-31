
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

---

Dokumentation
-------------

Beim Aufruf einer Webseite wird die URL in der Hauptapplikationsdatei "app.js" dispatcht. Urls sind immer in der Form /area/controller/action. Wenn eine der drei URL-Teile fehlt, wird sie durch "index" ersetzt. Anschließend wir der richtige Controller instanzieert. Es gibt einen Grundcontroller in /controllers/Base.js, von dem alle Controller extenden. Dort sind Funktionen, die in jedem Controller benötigt werden. Danach hat jede Area einen Controller mit Grundfunktionen für jede Area. Dadurch, dass jeder Controller den BaseController erweitern, kann man Funktionalitäten überschreiben wie zum Beispiel Aufruf-Rechte eines Controllers.

Der Basecontroller bekommt beim insanzieren von der app.js den Mongo Datenbank Handler, MongoDB-Objekt, das Request-Objekt von Express.js und das Response-Objekt übergeben. So kann man in jedem Controller dadrauf zugreifen. Wenn ein Controller insaziert ist, wird die Funktion run() da dran aufgerufen, die die passende Action im Controller aufruft. In der Action ist dann der eigentliche Code für diesen Seitenaufruf. Nach allen Operationen wird this.view.render() aufgerufen, die das passende Template lädt.

Die Templates befinden sich im Ordner /templates und sind ähnlich den Controllern angeordnet, d.h. für jede Area und Controller ein Ordner. Pro Action gibt es ein Template, das so wie die Action selbst mit .dust als Endung heißt. Dust.js ist die Template-Engine. Mehr dazu unter http://akdubya.github.io/dustjs/

Für die Rechte ist die Funktion getRightLevel() verantwortlich. Ein Besucher der Webseite hat ein Recht von 400, ein Student 300, ein Moderator 200 und ein Admin 100. Damit ist sichergestellt, dass zum Beispiel ein Moderator alles machen kann, was auch ein Student machen kann, aber nicht das, was für Admins erlaubt ist. Die Zahlen sind im Hunderter Bereich, damit es durch eventuell kommende zusätzliche Rechte einfach erweitert werden kann.




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

