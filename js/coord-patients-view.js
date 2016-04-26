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

    function isPatientsViewVisible() {
        return GC.App.getViewType() == "patients";
    }

    function retrieveTableData(somedatatable, sometabledata) {
        // console.log('sometabledata ' + sometabledata.length);
        // console.log(sometabledata);
        var somedataset = JSON.parse(sometabledata);
        // console.log('somedataset ' + somedataset.length);
        // console.log(somedataset);
        for (var ind = 0; ind < somedataset.length; ind++) {
            somedatatable.row.add(somedataset[ind]);
        }
        somedatatable.draw(false);
    }

    function renderPatientsView( container ) {
        $(container).empty();

        var loadingdiv = $("<div></div>").addClass("table-loading-spinner").hide();
        $(container).append(loadingdiv);

        var thetable = $("<table></table>").addClass("stripe hover");
        thetable.prop("id", "patient-table").prop("width", "100%");
        $(container).append(thetable);

        var thedatatable = $("#patient-table").DataTable( {
            columns: [
                { title: "Name" },
                { title: "ID" },
                { title: "Zip" },
                { title: "Tel" },
                { title: "Address" },
                { title: "Email" },
                { title: "DoB" }
            ]
        } );

        $("<div>Reload Patient List From Server</div>")
            .addClass("btn btn-info")
            .prop("style", "margin-left:100px")
            .click(function() {
                window.sessionStorage.removeItem('patientstable');
                renderPatientsView(container);
            })
            .appendTo('div.dataTables_length');

        $("#patient-table tbody").on('click', 'tr', function () {
            console.log(thedatatable.row(this).data());
            if (thedatatable.row(this).data()[1] == "") return;
            window.sessionStorage.setItem('patient_id', thedatatable.row(this).data()[1]);
            GC.App.setViewType("psmessages");
            GC.get_data();
            gc_app_js(GC,jQuery);
            // TODO refresh chart data etcetera
        });

        var thedataset = [];

        var tabledata = window.sessionStorage.getItem('patientstable');
        if (tabledata) {
            retrieveTableData(thedatatable, tabledata);
            return;
        }
        var minorBirthdate = moment().subtract(18, 'years').startOf("day");
        var minorDateStr = minorBirthdate.format("YYYY-MM-DD");
        var todayDateStr = moment().startOf("day").format("YYYY-MM-DD");
        loadingdiv.show();
        $.ajax({
            url: 'http://52.72.172.54:8080/fhir/baseDstu2/Patient' +
                '?birthdate=%3E%3D' + minorDateStr + '&birthdate=%3C%3D' +
                todayDateStr + '&_count=50',
            dataType: 'json',
            success: function(patientResult) { mergeHTML(patientResult, true);}
        });
        function mergeHTML(patientResult, initialCall) {
            if (!patientResult) return;
            if (patientResult.data) {
                patientResult = patientResult.data;
            }
            console.log(patientResult.entry);
            for (var i = 0; i < patientResult.entry.length; i++) {
                // Maybe we should filter out p.deceased === true even though apparently none in the dataset
                var p = patientResult.entry[i];
                if (Date.parse(p.resource.birthDate) > moment()) { continue;}
                var theEmail = "";
                var thePhone = "";
                if (p.resource.telecom) {
                    for (var ind = p.resource.telecom.length - 1; ind >= 0; ind--) {
                        if (p.resource.telecom[ind].system == "phone") {
                            thePhone = p.resource.telecom[ind].value;
                        } else if (p.resource.telecom[ind].system == "email") {
                            theEmail = p.resource.telecom[ind].value;
                        }
                    }
                }
                var rdata = [
                        (p.resource.name) ?
                            ((p.resource.name[0].family) ? p.resource.name[0].family + ", " : "") +
                            ((p.resource.name[0].given[0]) ? p.resource.name[0].given[0] : "") +
                            ((p.resource.name[0].given[1]) ? " " + p.resource.name[0].given[1] : "") :
                            "Not known",
                        (p.resource.id) ? p.resource.id : "",
                        (p.resource.address && p.resource.address[0].postalCode) ?
                            p.resource.address[0].postalCode : "",
                        thePhone,
                        (p.resource.address) ?
                            ((p.resource.address[0].line) ?
                                p.resource.address[0].line.join(", ") + ", " : "") +
                            ((p.resource.address[0].city) ?
                                p.resource.address[0].city + ", "  : "" ) +
                            ((p.resource.address[0].state) ?
                                p.resource.address[0].state : "") :
                            "Not known",
                        theEmail,
                        (p.resource.birthDate) ? p.resource.birthDate : ""
                    ];
                thedatatable.row.add(rdata);
                thedataset.push(rdata);
//              if (p.resource.deceased) {alert(p.resource.deceased + " " + heading.text());}
            }
            thedatatable.draw(false);
            window.sessionStorage.setItem('patientstable', JSON.stringify(thedataset));
            console.log("links " + patientResult.link.length);
            if (initialCall) {
                getMultiResults(patientResult);
            }
        }
        function getMultiResults(patientResult) {
            var nResults = patientResult.total;
            var lookingForMore = false;
            for (var ind = 0; ind < (patientResult.link ?
                                    patientResult.link.length : 0); ind++) {
                if (patientResult.link[ind].relation == "next") {
                    var theURL = patientResult.link[ind].url;
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
                                lookingForMore = true;
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
            if (lookingForMore) {
                $(document).ajaxStop(function() {loadingdiv.hide();});
            } else {
                loadingdiv.hide();
            }
        }
    }


    NS.PatientsView = {
        render : function() {
//            if (PRINT_MODE) {
//                renderTableViewForPrint("#view-table");
//            } else {
                renderPatientsView("#view-patients");
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
                if (isPatientsViewVisible()) {
                    renderPatientsView("#view-patients");
                }
            });

            GC.Preferences.bind("set:metrics set:nicu set:currentColorPreset", function(e) {
                if (isPatientsViewVisible()) {
                    renderPatientsView("#view-patients");
                }
            });

            GC.Preferences.bind("set", function(e) {
                if (e.data.path == "roundPrecision.velocity.nicu" ||
                    e.data.path == "roundPrecision.velocity.std") {
                    if (isPatientsViewVisible()) {
                        renderPatientsView("#view-patients");
                    }
                }
            });

/*            GC.Preferences.bind("set:fontSize", function(e) {
                setTimeout(updateDataTableLayout, 0);
            });
*/
            GC.Preferences.bind("set:timeFormat", function(e) {
                renderPatientsView("#view-patients");
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
