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
    
    function isMapViewVisible() {
        return GC.App.getViewType() == "maps";
    }

    function renderMapView( container ) {
        $(container).empty();
        $(container).append($("<div></div>")
                        .addClass("map-address-list")
                        .append($("<div></div>")
                            .addClass("well")
                            .append($("<div></div>")
                                .addClass("row")
                                .append($("<h3></h3>")
                                    .html("Patient's House"))
                                .append("255 Ted Turner Dr SW, Atlanta, GA 30303")))
                        .append($("<div></div>")
                            .addClass("well")
                            .append($("<div></div>")
                                .addClass("row")
                                .append($("<h3></h3>")
                                    .append("Woodruff Park Playground"))
                                .append("Peachtree St NE, Atlanta, GA 30303"))
                            .append($("<div></div>")
                                .addClass("row")
                                .append($("<h5></h5>")
                                    .append($("<span></span>")
                                        .addClass("label label-default")
                                        .append("Quality Score"))
                                    .append(" 7/10")))));
        //address1 = $("<div></div>").addClass("well");
        //$(container).append(addresslist);
        $(container).append($("<div></div>").attr("id", "google-map-canvas").html("TODO Map goes here"));
        
    }


    NS.MapView = {
        render : function() {
//            if (PRINT_MODE) {
//                renderTableViewForPrint("#view-table");
//            } else {
                renderMapView("#view-map");
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
                if (isMapViewVisible()) {
                    renderMapView("#view-map");
                }
            });

            GC.Preferences.bind("set:metrics set:nicu set:currentColorPreset", function(e) {
                if (isMapViewVisible()) {
                    renderMapView("#view-map");
                }
            });

            GC.Preferences.bind("set", function(e) {
                if (e.data.path == "roundPrecision.velocity.nicu" ||
                    e.data.path == "roundPrecision.velocity.std") {
                    if (isMapViewVisible()) {
                        renderMapView("#view-map");
                    }
                }
            });

/*            GC.Preferences.bind("set:fontSize", function(e) {
                setTimeout(updateDataTableLayout, 0);
            });
*/
            GC.Preferences.bind("set:timeFormat", function(e) {
                renderMapView("#view-map");
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
