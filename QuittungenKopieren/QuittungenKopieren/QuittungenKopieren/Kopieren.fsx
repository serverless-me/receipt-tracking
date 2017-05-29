#r @"C:\Program Files\Common Files\Microsoft Shared\Web Server Extensions\15\ISAPI\Microsoft.SharePoint.Client.dll"
#r @"C:\Program Files\Common Files\Microsoft Shared\Web Server Extensions\15\ISAPI\Microsoft.SharePoint.Client.Runtime.dll"

open Microsoft.SharePoint.Client
open Microsoft.SharePoint.Client.Application
open System.Security;

let ctx = new ClientContext("https://siriustuebingen.sharepoint.com/firmen/")

let load(item:'a) = 
    ctx.Load(item)
    ctx.ExecuteQuery()

let spList = ctx.Web.Lists.GetByTitle("Quittungen")

load spList

for i in 75..spList.ItemCount do 
    try
        let spItem = spList.GetItemById(i)
        load spItem
        let firma = spItem.["F_x00f6_rderfirma"] :?> FieldLookupValue
        let erfasser = spItem.["Author"] :?> FieldLookupValue
        let betrag = spItem.["Betrag"]
        let datum = spItem.["Created"]
        let msg1 = "ListItem " + i.ToString() + ": " + firma.LookupValue.ToString() + ": "+  betrag.ToString() + ", " + erfasser.LookupValue.ToString() + ", " + datum.ToString()
        printfn "%s\n" msg1
        let spList = ctx.Web.Lists.GetByTitle("Quittungen2013")
        load spList
        let itemInfo = new ListItemCreationInformation()
        let title = betrag.ToString() + " " + firma.LookupValue.ToString() + " (" + erfasser.LookupValue.ToString() + ", " + datum.ToString() + ")"
        itemInfo.LeafName <- title
        let item = spList.AddItem(itemInfo)
        ctx.ExecuteQuery()
        item.["F_x00f6_rderfirma"] <- firma
        item.["Author"] <- erfasser
        item.["Betrag"] <- betrag
        item.["Created"] <- datum
        item.Update()
        ctx.ExecuteQuery()
    with
        | :? Microsoft.SharePoint.Client.ServerException -> 
            let msg2 = "Id not found " + i.ToString()
            printfn "%s\n" msg2
        | :? System.Exception -> 
            let msg2 = "Some other exception"
            printfn "%s\n" msg2