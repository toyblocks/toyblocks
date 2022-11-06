# ToyBlocks

**ToyBlocks** ist ein webbasiertes Lernspiel für Studierende des Fachbereichs Architektur, das im Rahmen des Basiskurses Architekturgeschichte (Modul 312) als interdisziplinäres Konzept zwischen den Fachbereichen Architektur und Informatik der TU Darmstadt entstanden ist.

**ToyBlocks** is an E-learning webgame for students from the Fachbereich Architektur of TU Darmstadt. It is used in the entry class Architekturgeschichte (Modul 313, eng. architecture history) and was created as an interdisciplinary concept between Fachbereich Architektur and Fachbereich Informatik.

It is currently hosted at <https://toyblocks.architektur.tu-darmstadt.de/>.

---

## Getting Started

To install the project and get it running you need to install the packages, restore the mongodb database and run the project. Mongod service should be running the background.

```bash
npm install --legacy-peer-deps
npx bower install
npx grunt init 
mongorestore --db toyblocks toyblocks_database_demo/toydemo
npm start
```

## Documentation

A documentation (in german) for developers can be found under [DOCUMENTATION.md](https://github.com/toyblocks/toyblocks/blob/master/DOCUMENTATION.md).

## License

This project is under the MIT License which can be found under [LICENSE](https://github.com/toyblocks/toyblocks/blob/master/LICENSE).

## Team

Project Leaders:

* Marion Bolder-Boos
* Gabriel Dette
* Franziska Lang
* Stefanie Müller

Developers:

* Simon Bugert
* Mansur Iqbal
* Steven Lamarr Reynolds
* Andrej Tretjakow
