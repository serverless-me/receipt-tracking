ExecuteOrDelayUntilScriptLoaded(execClientOM, "sp.js");
var spListName = "Förderfirmen";

var myChoiceField = "Title";
var context = null;
var erfassungURL = "https://siriustuebingen.sharepoint.com/firmen/Quittungseingabe/Quittungseingabe.aspx";

var firmenauswahlElem = document.getElementById("Firmenauswahl");
var historyElem = document.getElementById("Quittungseingabe");
var betragElem = document.getElementById("tbBetrag");

function execClientOM() {
    context = new SP.ClientContext.get_current();

    this.myList = context.get_web().get_lists().getByTitle(spListName);

    var camlQuery = new SP.CamlQuery();
    camlQuery.set_viewXml("<View><RowLimit>100</RowLimit></View>");
    this.collListItem = myList.getItems(camlQuery);

    context.load(collListItem, 'Include(Id, DisplayName)');

    context.executeQueryAsync(Function.createDelegate(this, this.onSuccess), Function.createDelegate(this, this.onFailure));
}

function onSuccess(sender, args) {
    var myOption = document.createElement("Option");
    firmenauswahlElem.appendChild(myOption);

    var filterArray = new Array();
    var arrayIndex = 0;


    var listItemEnumerator = collListItem.getEnumerator();
    while (listItemEnumerator.moveNext()) {
        var listItem = listItemEnumerator.get_current();

        if (getIndex(filterArray, listItem.get_displayName()) < 0) {
            filterArray.push(listItem.get_displayName());

            var myOption = document.createElement("Option");
            var myText = document.createTextNode(listItem.get_displayName());
            myOption.appendChild(myText);
            myOption.setAttribute("value", listItem.get_id());
            firmenauswahlElem.appendChild(myOption);
        }

    }
}

function onFailure(sender, args) {
    alert("Firmen konnten nicht geladen werden. Versuchen Sie die Seite erneut zu laden (F5).");
}

function getIndex(array, item) {
    for (i = 0; i < array.length; i++) {
        if (array[i] == item) return i;
    }
    return -1;
}

function addQuittung(e) {
    if (e.keyCode == 13 && firmenauswahlElem.selectedIndex != 0 && betragElem.value != "") {
        var qList = context.get_web().get_lists().getByTitle('Quittungen');

        var itemCreateInfo = new SP.ListItemCreationInformation();
        this.qListItem = qList.addItem(itemCreateInfo);

        qListItem.set_item('Betrag', betragElem.value.replace(",", "."));
        qListItem.set_item('F_x00f6_rderfirma', firmenauswahlElem.children[firmenauswahlElem.selectedIndex].value);

        qListItem.update();

        context.load(qListItem);

        context.executeQueryAsync(Function.createDelegate(this, this.onQuerySucceeded), Function.createDelegate(this, this.onQueryFailed));
    }
}

function onQuerySucceeded() {
    historyElem.value = betragElem.value + "\n" + historyElem.value;
    betragElem.value = "";
    betragElem.focus();
}

function onQueryFailed(sender, args) {
    historyElem.value = "Daten konnten nicht gespeichert werden: " + args.get_message() + "\n" + historyElem.value;
}

function resetErfassung() {
    document.location.href = erfassungURL;
}

function firmaSelected() {
    firmenauswahlElem.disabled = true;
}
