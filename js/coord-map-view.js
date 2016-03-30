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
                        .addClass("map-address-list bb")
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
        $(container).append($("<div></div>")
                        .addClass("google-map-container")
                        .append($("<div></div>")
                            .attr("id", "google-map-canvas")
                            .html("TODO Map goes here")));
        var map; //gmaps obj.
        function init_map() {
            var myOptions = { zoom: 15, center: new google.maps.LatLng(33.7489954, -84.3879824), mapTypeId: google.maps.MapTypeId.HYBRID };
            map = new google.maps.Map(document.getElementById('google-map-canvas'), myOptions);
            var marker = new google.maps.Marker({ map: map, position: new google.maps.LatLng(33.7489954, -84.3879824) });
            var infowindow = new google.maps.InfoWindow({ content: '<strong>Patients House</strong><br>Atlanta<br>' });
            google.maps.event.addListener(marker, 'click', function () { infowindow.open(map, marker); });
            infowindow.open(map, marker);
        }

        function attachWindowListener(marker, loc) {
            google.maps.event.addListener(marker, 'click', function () {
                var o = marker.locationObj;
                var iw = new google.maps.InfoWindow({ content: '<strong>' + o.name + '</strong>' });
                iw.open(map, marker);
            });
        }
        init_map();

        var addedResources = [];

        var debounceTimeout;
        function updateDebounce() {
            window.clearTimeout(debounceTimeout);
            debounceTimeout = window.setTimeout(updateResources, 1000);
        }

        google.maps.event.addListener(map, "bounds_changed", updateDebounce);

        function updateResources() {
            console.log("grabbing parks from OSM Overpass...");
            var bounds = map.getBounds();
            var sw = bounds.getSouthWest();
            var ne = bounds.getNorthEast();

            //var oquery = 'node["name"="Gielgen"]; out body;';
            var q2 = 'node [leisure=playground] (' + sw.lat() + ',' + sw.lng() + ',' + ne.lat() + ',' + ne.lng() + '); out;';
            var params = {
                data: q2
            };

            $.post("http://overpass-api.de/api/interpreter", params, function (doc) {
                var items = doc.firstChild.children;
                var results = [];
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    if (item.tagName == "node") {
                        var attrs = item.attributes;
                        var id = attrs.id.nodeValue;
                        var lat = attrs.lat.nodeValue;
                        var lon = attrs.lon.nodeValue;
                        var name = "Playground";
                        for (var j = 0; j < item.children.length; j++) {
                            var c = item.children[j];
                            if (c.nodeName == "tag") {
                                if (c.attributes.k.nodeValue == "name") {
                                    name = c.attributes.v.nodeValue;
                                }
                            }
                        }
                        results.push({
                            id: id,
                            lat: lat,
                            lng: lon,
                            name: name
                        });
                    }
                }
                console.log("retrieved " + results.length + " results from OSM Overpass");

                for (var i = 0; i < results.length; i++) {
                    var r = results[i];
                    if (addedResources.indexOf(r.id) == -1) {
                        addedResources.push(r.id);
                        var m2 = new google.maps.Marker({
                            map: map,
                            position: new google.maps.LatLng(r.lat, r.lng),
                            title: r.name,
                            locationObj: r
                        });
                        attachWindowListener(m2, r);
                    }
                }
            });
        }
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
