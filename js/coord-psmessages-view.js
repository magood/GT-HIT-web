/*global
Chart, GC, PointSet, Raphael, console, $,
jQuery, debugLog,
XDate, setTimeout, getDataSet*/

/*jslint undef: true, eqeq: true, nomen: true, plusplus: true, forin: true*/
(function(NS, $) {

    "use strict";

    var selectedIndex = -1,

        /**
         * The cached value from GC.App.getMetrics()
         */
        metrics = null,

        PRINT_MODE = $("html").is(".before-print"),

        EMPTY_MARK = PRINT_MODE ? "" : "&#8212;",

        MILISECOND = 1,
        SECOND     = MILISECOND * 1000,
        MINUTE     = SECOND * 60,
        HOUR       = MINUTE * 60,
        DAY        = HOUR * 24,
        WEEK       = DAY * 7,
        MONTH      = WEEK * 4.348214285714286,
        YEAR       = MONTH * 12,

        shortDateFormat = {
            "Years"   : "y",
            "Year"    : "y",
            "Months"  : "m",
            "Month"   : "m",
            "Weeks"   : "w",
            "Week"    : "w",
            "Days"    : "d",
            "Day"     : "d",
            separator : " "
        };

    function isPSMessagesViewVisible() {
        return GC.App.getViewType() == "psmessages";
    }

    function retrieveTableData(somedatatable, sometabledata) {
        console.log('sometabledata ' + sometabledata.length);
        console.log(sometabledata);
        var somedataset = JSON.parse(sometabledata);
        console.log('somedataset ' + somedataset.length);
        console.log(somedataset);
        for (var ind = 0; ind < somedataset.length; ind++) {
            somedatatable.row.add(somedataset[ind]);
        }
        somedatatable.draw(false);
    }

    function renderPSMessagesView( container ) {
        $(container).empty();

        var thetable = $("<table></table>").addClass("display");
        thetable.prop("id", "psmessages-table").prop("width", "100%");
        $(container).append(thetable);

        var thedatatable = $("#psmessages-table").DataTable( {
            columns: [
                { title: "Message ID" },
                { title: "From" },
                { title: "To" },
                { title: "Concerning" },
                { title: "Detail" },
                { title: "Sent" }
            ]
        } );

        $("<button>Reload Message List From Server</button>")
            .prop("style", "margin-left:100px")
            .click(function() {
                window.sessionStorage.removeItem('psmessagestable');
                renderPSMessagesView(container);
            })
            .appendTo('div.dataTables_length');

        $("#psmessages-table tbody").on('click', 'tr', function () {
            window.sessionStorage.setItem('message_id', thedatatable.row(this).data()[0]);
            GC.App.setViewType("message");
        });

        var thedataset = [];

        var tabledata = window.sessionStorage.getItem('psmessagestable');
        if (tabledata) {
            retrieveTableData(thedatatable, tabledata);
            return;
        }

        var todayDateStr = moment().startOf("day").format("YYYY-MM-DD");
        $.ajax({
            url: 'http://52.72.172.54:8080/fhir/baseDstu2/Communication?subject=Patient%2F' +
                    (window.sessionStorage.getItem("patient_id") ?
                        window.sessionStorage.getItem("patient_id") : 'Patient-15479') +
                    '&_count=50',
            dataType: 'json',
            success: function(psMessagesResult) { mergeHTML(psMessagesResult, true);}
        });
        function mergeHTML(psMessagesResult, initialCall) {
            if (!psMessagesResult || psMessagesResult.total == "0") return;
            if (psMessagesResult.data) {
                psMessagesResult = psMessagesResult.data;
            }
            console.log(psMessagesResult.entry);
            for (var i = 0; i < psMessagesResult.entry.length; i++) {
                var p = psMessagesResult.entry[i];
                if (Date.parse(p.resource.sent) > moment()) { continue;}
                var rdata = [
                        (p.resource.id) ? p.resource.id : "",
                        ((p.resource.sender) ?
                            ((p.resource.sender.display) ? p.resource.sender.display :
                                ((p.resource.sender.reference) ? p.resource.sender.reference : "")) : ""),
                        ((p.resource.recipient) ?
                            ((p.resource.recipient[0].display) ?
                                p.resource.recipient[0].display :
                                ((p.resource.recipient[0].reference) ?
                                    p.resource.recipient[0].reference : "")) : ""),
                        ((p.resource.subject) ?
                            ((p.resource.subject.display) ? p.resource.subject.display :
                                ((p.resource.subject.reference) ? p.resource.subject.reference : "")) : ""),
                        ((p.resource.category) ?
                            ((p.resource.category.text) ? p.resource.category.text :
                                ((p.resource.category.coding) ?
                                    ((p.resource.category.coding.system) ?
                                        p.resource.category.coding.system + " - " : "") +
                                    ((p.resource.category.coding.code) ?
                                        p.resource.category.coding.code : "") : "")) : ""),
                                            // TODO add default of encounter reference
                        ((p.resource.sent) ?
                            moment(p.resource.sent).format('ll') :
                                ((p.resource.received) ?
                                    moment(p.resource.received).format('ll') : ""))
                    ];
                thedatatable.row.add(rdata);
                thedataset.push(rdata);
//              if (p.resource.deceased) {alert(p.resource.deceased + " " + heading.text());}
            }
            thedatatable.draw(false);
            window.sessionStorage.setItem('psmessagestable', JSON.stringify(thedataset));
            console.log("links " + psMessagesResult.link.length);
            if (initialCall) {
                getMultiResults(psMessagesResult);
            }
        }
        function getMultiResults(psMessagesResult) {
            var nResults = psMessagesResult.total;
            for (var ind = 0; ind < (psMessagesResult.link ?
                                    psMessagesResult.link.length : 0); ind++) {
                if (psMessagesResult.link[ind].relation == "next") {
                    var theURL = psMessagesResult.link[ind].url;
                    console.log("url " + theURL);
                    var a = $('<a>', { href:theURL } )[0];
                    var que = a.search.substring(1);
                    var quedata = que.split("&");
                    for (var qind = 0; qind < quedata.length; qind++) {
                        var item = quedata[qind].split("=");
                        if ((item[0] === "_getpagesoffset") &&
                            (parseInt(item[1]) < nResults)) {
                            var nRequests = 0;
                            for (var offsetResults = parseInt(item[1]);
                                offsetResults < nResults; offsetResults += 50) {
                                var newURL = theURL.replace(/(_getpagesoffset=)(\d+)/, '$1' +
                                                            offsetResults.toString());
                                console.log("rewritten to " + newURL);
                                nRequests++;
                                $.ajax({
                                    dataType: "json",
                                    url: newURL,
                                    success: function (newResult) {
                                        console.log(newResult);
                                        mergeHTML(newResult, false);
                                        //if (--nRequests == 0) $(container).remove(loadingdiv);
                                    }
                                });
                            }
                        }
                    }
                    break;
                }
            }
        }
    }


    NS.PSMessagesView = {
        render : function() {
//            if (PRINT_MODE) {
//                renderTableViewForPrint("#view-table");
//            } else {
                renderPSMessagesView("#view-messages");
//            }
        }//,
//        selectByAge : PRINT_MODE ? $.noop : selectByAge
    };

    $(function() {
        if (!PRINT_MODE) {
//            $("#stage").bind("scroll resize", updateDataTableLayout);
//            $(window).bind("resize", updateDataTableLayout);

//            updateDataTableLayout();
//            initAnnotationPopups();

/*            $("#stage").on("click", ".datatable td, .datatable th", function() {
                //debugger;
                var i = 0, tmp = this;
                while ( tmp.previousSibling ) {
                    tmp = tmp.previousSibling;
                    i++;
                }
                GC.App.setSelectedRecord(GC.App.getPatient().getModel()[i], "selected");
            });
*/
            $("html").bind("set:viewType set:language", function(e) {
                if (isPSMessagesViewVisible()) {
                    renderPSMessagesView("#view-messages");
                }
            });

            GC.Preferences.bind("set:metrics set:nicu set:currentColorPreset", function(e) {
                if (isPSMessagesViewVisible()) {
                    renderPSMessagesView("#view-messages");
                }
            });

            GC.Preferences.bind("set", function(e) {
                if (e.data.path == "roundPrecision.velocity.nicu" ||
                    e.data.path == "roundPrecision.velocity.std") {
                    if (isPSMessagesViewVisible()) {
                        renderPSMessagesView("#view-messages");
                    }
                }
            });

/*            GC.Preferences.bind("set:fontSize", function(e) {
                setTimeout(updateDataTableLayout, 0);
            });
*/
            GC.Preferences.bind("set:timeFormat", function(e) {
                renderPSMessagesView("#view-messages");
            });

/*            $("#stage")
            .on("dblclick", ".datatable td", function() {
                var i = $(this).closest("tr").find("td").index(this);
                GC.App.editEntry(GC.App.getPatient().getModel()[i]);
            })
            .on("dblclick", ".datatable th", function() {
                var i = $(this).closest("tr").find("th").index(this);
                GC.App.editEntry(GC.App.getPatient().getModel()[i]);
            });
*/
/*            $("html").bind("appSelectionChange", function(e, selType, sel) {
                if (selType == "selected") {
                    selectByAge(sel.age.getMilliseconds());
                }
            });
*/        }
    });

}(GC, jQuery));