/*global
Chart, GC, PointSet, Raphael, console, $,
jQuery, debugLog,
XDate, setTimeout, getDataSet*/

/*jslint undef: true, eqeq: true, nomen: true, plusplus: true, forin: true*/
(function (NS, $) {

    "use strict";

    var selectedIndex = -1,

        /**
         * The cached value from GC.App.getMetrics()
         */
        metrics = null,

        PRINT_MODE = $("html").is(".before-print"),

        EMPTY_MARK = PRINT_MODE ? "" : "&#8212;",

        MILISECOND = 1,
        SECOND = MILISECOND * 1000,
        MINUTE = SECOND * 60,
        HOUR = MINUTE * 60,
        DAY = HOUR * 24,
        WEEK = DAY * 7,
        MONTH = WEEK * 4.348214285714286,
        YEAR = MONTH * 12,

        shortDateFormat = {
            "Years": "y",
            "Year": "y",
            "Months": "m",
            "Month": "m",
            "Weeks": "w",
            "Week": "w",
            "Days": "d",
            "Day": "d",
            separator: " "
        };

    var resourceTypes = {
        "CommunityResource/HealthClub": "Health Club",
        "CommunityResource/Playground": "Playground",
        "CommunityResource/HikingTrail": "Hiking Trail"
    };
    function getTypeName(typeCode) {
        var rTypeName = "Unknown";
        try {
            rTypeName = resourceTypes[typeCode];
        } catch (e) { }
        return rTypeName;
    }

    function isMapViewVisible() {
        return GC.App.getViewType() == "maps";
    }

    function renderMapView(container) {
        $(container).empty();
        $(container).append($("<div></div>")
                        .addClass("map-address-list bb"));

        // // FIXME (sangwhan): DELETE ME LATER.
        // // Debug code (mock data to simulate a long list of community resources)

        // for (var i = 0; i < 20; i++) {
        //     document.querySelector('.map-address-list').innerHTML +=
        //         document.querySelectorAll('.map-address-list .well')[1].outerHTML;
        // }

        //address1 = $("<div></div>").addClass("well");
        //$(container).append(addresslist);
        $(container).append($("<div></div>")
                        .addClass("google-map-container")
                        .append($("<div></div>")
                            .attr("id", "google-map-canvas")
                            .html("TODO Map goes here")));
        var map; //gmaps obj.
        function init_map() {
            var myOptions = { zoom: 12, mapTypeId: google.maps.MapTypeId.HYBRID };
            var mapElement = document.getElementById('google-map-canvas');
            map = new google.maps.Map(document.getElementById('google-map-canvas'), myOptions);
        }

        function setPatientMarker(glatlng) {
            var marker = new google.maps.Marker({ map: map, position: glatlng, label: "P" });
            var infowindow = new google.maps.InfoWindow({ content: "<h5 class='infoWindowHeader'>Patient's House</h5>" });
            google.maps.event.addListener(marker, 'click', function () { infowindow.open(map, marker); });
            infowindow.open(map, marker);
            google.maps.event.trigger(map, 'resize');
            map.setCenter(glatlng);
        }

        function attachWindowListener(marker, loc) {
            google.maps.event.addListener(marker, 'click', function () {
                var o = marker.locationObj;
                //build infowindow html
                var contentDom = $("<div>")
                    .append($("<h5 class='infoWindowHeader'>").text(o.name))
                    .append($("<p class='infoWindowParagraph'>").text(getTypeName(o.type)));


                var iw = new google.maps.InfoWindow({ content: contentDom.html() });
                iw.open(map, marker);
            });
        }
        init_map();
        var pId = (window.sessionStorage.getItem("patient_id") ? window.sessionStorage.getItem("patient_id") : GC.chartSettings.defaultPatient);

        var referrals;
        referrals = sessionStorage.getItem("pending_referrals");
        if (referrals) {
            referrals = JSON.parse(referrals);
        } else {
            referrals = [];
        }

        $.ajax({
            url: GC.chartSettings.serverBase + "/Patient/" + pId,
            dataType: 'json',
            success: function (patientResults) {
                try {
                    var addr = patientResults.address[0];
                    getFromFHIR(addr.postalCode, addr.city, addr.state);

                    $('.map-address-list')
                        .append($("<div></div>")
                                .addClass("btn btn-info")
                                .html("Send Community<br />Resource Referrals")
                                .click(function () {
                                    var patientname = ""
                                    patientResults.name[0].given.forEach(function (firstname) {
                                        patientname += firstname + ' ';
                                    });
                                    patientResults.name[0].family.forEach(function (familyname) {
                                        patientname += familyname + " ";
                                    });
                                    GC.App.sendCommunityReferrals({
                                        patient_name: patientname,
                                        patient_id: pId,
                                        resources: referrals
                                    });
                                }))
                        .append($("<p style='margin-top:.5em'>").text("Click to select resource for referral:"))
                        .append($("<ul class='list-group'>"));
                    var addrText = "";
                    if (addr.line.length > 0)
                        addrText = addr.line[0] + ", ";
                    addrText += addr.city + ", " + addr.state + " " + addr.postalCode;
                    console.log("patient address: " + addrText);

                    $.get({
                        url: "https://maps.googleapis.com/maps/api/geocode/json",
                        data: {
                            address: addrText,
                            key: "AIzaSyC2lIWgJTOezqi3-VVnD65eiNhGGHyHZTk" //Health Informatics Project Maps Key
                        },
                        success: function (data) {
                            if (data.results.length > 0) {
                                var loc = data.results[0].geometry.location;
                                setPatientMarker(loc);
                            }
                            else if (data.error_message) {
                                console.log(data.error_message);
                            }
                        }
                    });
                }
                catch (e) {
                    alert("Patient does not have an address recorded.  Map cannot be displayed.");
                }
            }
        });

        var addedResources = [];

        var debounceTimeout;
        function updateDebounce() {
            window.clearTimeout(debounceTimeout);
            debounceTimeout = window.setTimeout(updateOSMResources, 1000);
        }

        //google.maps.event.addListener(map, "bounds_changed", updateDebounce);

        function getGoogleMapsResults(r) {
            $.get({
                url: "https://maps.googleapis.com/maps/api/geocode/json",
                data: {
                    address: r.dispAddr + ', ' + r.city + ', ' + r.state + ' ' + r.zip,
                    key: "AIzaSyC2lIWgJTOezqi3-VVnD65eiNhGGHyHZTk" //Health Informatics Project Maps Key
                },
                success: function (data) {
                    if (data.results.length > 0) {
                        var loc = data.results[0].geometry.location;
                        r.lat = loc.lat;
                        r.lng = loc.lng;
                        addResource(r);
                    }
                    else if (data.error_message) {
                        console.log(data.error_message);
                    }
                }
            });
        }

        function getFromFHIR(zip, city, state) {
            $.ajax({
                url: GC.chartSettings.serverBase + "/Organization" +
                    '?address-city=' + city + '&address-state=' + state + '&_count=50',
                dataType: 'json',
                success: function (cityResults) {
                    console.log("got " + cityResults.total + " " + city + " results");
                    if (cityResults.total > 0) {
                        var results = [];
                        for (var i = 0; i < cityResults.entry.length; i++) {
                            var item = cityResults.entry[i].resource;
                            if (item.address.length > 0 && item.type) {
                                var type = item.type.text;
                                var name = item.name;
                                var id = item.id;
                                var addr = "";
                                var addrObj = item.address[0];
                                if (addrObj.line) {
                                    for (var ai = 0; ai < addrObj.line.length; ai++) {
                                        addr += addrObj.line[ai] + ' ';
                                    }
                                }

                                var resultObject = {
                                    id: id,
                                    lat: null,
                                    lng: null,
                                    name: name,
                                    type: type,
                                    dispAddr: addr,
                                    city: addrObj.city,
                                    state: addrObj.state,
                                    zip: addrObj.postalCode

                                };
                                getGoogleMapsResults(resultObject);
                            }
                        }
                    }
                }
            });
        }

        function addResources(resources) {
            for (var i = 0; i < resources.length; i++) {
                var r = resources[i];
                addResource(r);
            }
        }
        function addResource(r) {
            if (addedResources.indexOf(r.id) == -1) {
                console.log("adding resource: " + r.name);
                console.log(r);

                var addressString = r.city + ", " + r.state;

                //Some zip codes are not defined, This section can be removed if we want consistency (not display zip altogether)
                if (r.zip)
                    addressString += " - " + r.zip;

                var ispendingreferral = false;
                referrals.forEach(function (referral) {
                    if (referral.resourcename == r.name) {
                        ispendingreferral = true;
                    }
                });

                var rTypeName = getTypeName(r.type);
                var listItem = $("<li class='list-group-item communityResource'>")
                    .append($("<h3>").text(r.name))
                    .append($("<h5>").text(rTypeName))
                    .append($("<p>").text(r.dispAddr))
                    .append($("<p>").text(r.addressString))
                    .click(function (e) {
                        //console.log("this: " + this);
                        //console.log("e.target: " + e.target);
                        var $li = $(this);
                        $li.toggleClass("resourceSelected");
                        if ($li.hasClass("resourceSelected")) {
                            console.log("selecting resournce");
                            var dup = false;
                            referrals.forEach(function (referral) {
                                if (referral.resourcename == r.name) dup = true;
                            });
                            if (dup) return;
                            referrals.push({
                                resourcename: r.name,
                                resourcetiming: r.type, //TODO timing != type
                                resourceaddress: r.dispAddr
                            });
                        } else {
                            console.log("removing resournce");
                            for (var ri = 0; ri < referrals.length; ri++) {
                                if (referrals[ri].resourcename == r.name) {
                                    referrals.splice(ri, 1);
                                }
                            }
                        }
                        sessionStorage.setItem("pending_referrals", JSON.stringify(referrals));
                    });
                $('.map-address-list ul.list-group').append(listItem);

                //$('.map-address-list').append($("<div></div>")
                //            .addClass("well")
                //            .append($("<div></div>")
                //                .addClass("row")
                //                .append($("<h3>"+ r.name +"</h3>")))
                //            .append($("<div></div>")
                //                .addClass("row")
                //                .append($("<h5>"+ r.type +"</h5>")))
                //            .append($("<div></div>")
                //                .addClass("row")
                //                .append($("<h5>"+ r.dispAddr +"</h5>")))
                //            .append($("<div></div>")
                //                .addClass("row")
                //                .append($("<h5>"+ addressString+ "</h5>")))

                //            // Quality score is not available in this response
                //            // If fetched uncomment this and replace <quality_score> with variable containing value
                //            // .append($("<div></div>")
                //            //     .addClass("row")
                //            //     .append($("<h5></h5>")
                //            //         .append($("<span></span>")
                //            //             .addClass("label label-default")
                //            //             .append("Quality Score"))
                //            // If fetched needs to be added here
                //            //         .append(<quality_score>)))

                //            .append($("<div></div>")
                //                .addClass('checkbox')
                //                .append($("<label></label>")
                //                    .append($("<input>")
                //                    .attr("type", "checkbox")
                //                    .prop("value", "")
                //                    .prop("checked", ispendingreferral)
                //                    .click(function(event){
                //                        if (event.target.checked) {
                //                            var dup = false;
                //                            referrals.forEach(function (referral) {
                //                                if (referral.resourcename == r.name) dup = true;
                //                            });
                //                            if (dup) return;
                //                            referrals.push({
                //                                resourcename: r.name,
                //                                resourcetiming: r.type, //TODO timing != type
                //                                resourceaddress: r.dispAddr
                //                            });
                //                        } else {
                //                            for (var ri = 0; ri < referrals.length; ri++) {
                //                                if (referrals[ri].resourcename == r.name) {
                //                                    referrals.splice(ri,1);
                //                                }
                //                            }
                //                        }
                //                        sessionStorage.setItem("pending_referrals", JSON.stringify(referrals));
                //                    }))
                //                    .append("&nbsp; refer")))
                //          );


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

        function updateOSMResources() {
            console.log("grabbing parks from OSM Overpass...");
            var bounds = map.getBounds();
            var sw = bounds.getSouthWest();
            var ne = bounds.getNorthEast();

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
        render: function () {
            //            if (PRINT_MODE) {
            //                renderTableViewForPrint("#view-table");
            //            } else {
            renderMapView("#view-map");
            //            }
        }//,
        //        selectByAge : PRINT_MODE ? $.noop : selectByAge
    };

    $(function () {
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
            $("html").bind("set:viewType set:language", function (e) {
                if (isMapViewVisible()) {
                    renderMapView("#view-map");
                }
            });

            GC.Preferences.bind("set:metrics set:nicu set:currentColorPreset", function (e) {
                if (isMapViewVisible()) {
                    renderMapView("#view-map");
                }
            });

            GC.Preferences.bind("set", function (e) {
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
            GC.Preferences.bind("set:timeFormat", function (e) {
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
