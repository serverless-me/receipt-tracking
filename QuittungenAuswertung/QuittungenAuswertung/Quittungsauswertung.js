/// <reference path="../LayoutsJS/SP.DocumentManagement.debug.js" />
/// <reference path="../LayoutsJS/SP.Exp.debug.js" />
/// <reference path="../LayoutsJS/SP.Init.debug.js" />
/// <reference path="../LayoutsJS/SP.Map.debug.js" />
/// <reference path="../LayoutsJS/SP.Policy.debug.js" />
/// <reference path="../LayoutsJS/SP.Publishing.debug.js" />
/// <reference path="../LayoutsJS/SP.debug.js" />
/// <reference path="../LayoutsJS/SP.js" />
/// <reference path="../LayoutsJS/jquery-1.8.2.js" />
/// <reference path="../LayoutsJS/jquery-1.8.2.intellisense.js" />
/// <reference path="../LayoutsJS/camljs.js" />
var firmenList;
var firmenItems;
var firmenQuery;
var firmenArray;

var lastCalculationDate;
var logItems;
var logList;

var quittungenList;
var quittungenItems;
var quittungenQuery;

var context;
var web;
var lists;

var logirmenList;

function execConstructor() {

    context = new SP.ClientContext.get_current();
    web = context.get_web();
    context.load(web);
    setLastCalculationDate();
}

function setLastCalculationDate() {
    logList = web.get_lists().getByTitle("Log");

    var logQuery = ""
    logQuery += "<Where>";
    logQuery += "<Eq>";
    logQuery += "<FieldRef Name='Title'/>";
    logQuery += "<Value Type='Text'>Successfull</Value>";
    logQuery += "</Eq>";
    logQuery += "</Where>";
    logQuery += "<OrderBy><FieldRef Name='Timestamp' Ascending='TRUE'/></OrderBy>";

    var caml = new SP.CamlQuery();
    caml.viewXml = logQuery;
    logItems = logList.getItems(caml);
    context.load(logItems, 'Include(Title, Timestamp)');

    context.executeQueryAsync(Function.createDelegate(this, this.onSuccessCalculationDate), Function.createDelegate(this, this.onFailure));
}

function onSuccessCalculationDate(sender, args) {
    var maxCount = logItems.get_count();
    lastCalculationDate = logItems.itemAt(maxCount-1).get_fieldValues().Timestamp;
    loadFirmen();
}


function loadFirmen() {

    firmenList = context.get_web().get_lists().getByTitle("SpendenTest");
    context.load(firmenList);

    firmenQuery = new SP.CamlQuery.createAllItemsQuery();
    firmenItems = firmenList.getItems(firmenQuery);
    context.load(firmenItems, 'Include(F_x00f6_rderfirma, Umsatz, Prozentsatz, ID)');
    
    context.executeQueryAsync(Function.createDelegate(this, this.onSuccessFirmen), Function.createDelegate(this, this.onFailure));
}

function onSuccessFirmen(sender, args) {
    this.firmencount = firmenItems.get_count();
    firmenArray = new Array();
    for (i = 0; i < this.firmencount; i++) {
        firmenArray[i] = {
            firma: firmenItems.itemAt(i).get_fieldValues()["F_x00f6_rderfirma"].get_lookupValue(),
            betrag: firmenItems.itemAt(i).get_fieldValues()["Umsatz"],
            prozentsatz: firmenItems.itemAt(i).get_fieldValues()["Prozentsatz"],
            id: firmenItems.itemAt(i).get_fieldValues()["ID"]
        };
    }
    loadQuittungen();
}

function loadQuittungen() {
    quittungenList = context.get_web().get_lists().getByTitle("Quittungen2013");
    var quittungenQuery = ""
    //quittungenQuery += "<Where>";
    //quittungenQuery += "<Gt>";
    //quittungenQuery += "<FieldRef Name='Created'/>";
    //quittungenQuery += "<Value Type='DateTime' IncludeTimeValue='True'>" + lastCalculationDate + "</Value>";
    //quittungenQuery += "</Gt>";
    //quittungenQuery += "</Where>";
    quittungenQuery += "<RowLimit>1000</RowLimit>";

    var caml = new SP.CamlQuery();
    caml.viewXml = quittungenQuery;

    quittungenItems = quittungenList.getItems(caml);
    context.load(quittungenItems, 'Include(F_x00f6_rderfirma, Betrag)');

    context.executeQueryAsync(Function.createDelegate(this, this.onSuccessQuittungen), Function.createDelegate(this, this.onFailure));
}

function onSuccessQuittungen(sender, args) {
    this.quittungenEnumerator = quittungenItems.getEnumerator();
    while (this.quittungenEnumerator.moveNext()) {
        this.quittungenItem = this.quittungenEnumerator.get_current();
        this.quittung = {
            firma: quittungenItem.get_fieldValues()["F_x00f6_rderfirma"].get_lookupValue(),
            betrag: quittungenItem.get_fieldValues()["Betrag"]
        };
        sumQuittungen(this.quittung);
    }
    updateSpenden();
}

function sumQuittungen(quittung) {
    for (i = 0; i < firmenArray.length; i++) {
        if (firmenArray[i].firma === quittung.firma) {
            firmenArray[i].betrag += quittung.betrag;
            return;
        }
    }
}

function updateSpenden() {
    for (i = 0; i < firmenArray.length; i++) {
        var spende1 = firmenArray[i].betrag * firmenArray[i].prozentsatz;
        var firmenItem = firmenItems.getById(firmenArray[i].id);
        firmenItem.set_item('Umsatz', firmenArray[i].betrag);
        firmenItem.set_item('Spende10', spende1);
        firmenItem.update();
        context.executeQueryAsync(Function.createDelegate(this, this.onSuccessUpdate), Function.createDelegate(this, this.onFailure));
    }
}

function onSuccessUpdate(sender, args) {
    logUpdate();
}

function logUpdate() {
    logirmenList = context.get_web().get_lists().getByTitle("Log");
    var logCreateInfo = new SP.ListItemCreationInformation();
    var logItem = logirmenList.addItem(logCreateInfo);
    logItem.set_item("Title", "Successfull");
    logItem.set_item("Timestamp", new Date().format("s"));
    logItem.update();
    context.executeQueryAsync(Function.createDelegate(this, this.onSuccessLog), Function.createDelegate(this, this.onFailure));
}

function onSuccessLog(sender, args) {
    alert("Aktualisierung abgeschlossen");
    window.location.href('/firmen/default.aspx');
}

function onFailure(sender, args) {
    alert("Request failed " + args.get_message());
}

