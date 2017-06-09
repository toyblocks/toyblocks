
ToyBlocks
=========

**ToyBlocks** ist ein webbasiertes Lernspiel für Studierende des Fachbereichs Architektur, das im Rahmen des Basiskurses Architekturgeschichte (Modul 312) als interdisziplinäres Konzept zwischen den Fachbereichen Architektur und Informatik der TU Darmstadt entstanden ist.


**ToyBlocks** is an E-learning webgame for students from the Fachbereich Architektur of TU Darmstadt. It is used in the entry class Architekturgeschichte (Modul 313, eng. architecture history) and was created as an interdisciplinary concept between Fachbereich Architektur and Fachbereich Informatik.

It is currently hosted at <https://toyblocks.architektur.tu-darmstadt.de/>.

---

## Getting Started

To install the project and get it running you need to install the packages, restore the mongodb database and run the project. Mongod service should be running the background.

```
npm install
bower install
mongorestore --db toyblocks toyblocks_database_demo/toydemo
npm start

```

## Documentation

A documentation (in german) for users can be found under [DOCUMENTATION.md](https://github.com/toyblocks/toyblocks/blob/master/DOCUMENTATION.md).

----


Collaborators:

* Marion Bolder-Boos
* Gabriel Dette
* Franziska Lang
* Stefanie Müller

Developers:

* Simon Bugert
* Mansur Iqbal
* Steven Lamarr Reynolds
* Andrej Tretjakow
