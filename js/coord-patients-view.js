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
        
        /**
         * The scheme used to create and render the grid
         */
        scheme,
        
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
    
    function createHeaderPatientsTable(container) {
        var headerTable = $(
            '<table class="datatable-headers" cellspacing="0">' +
                '<tr class="date"><th colspan="2">' + GC.str("STR_35") + '</th></tr>' +
                '<tr class="age"><th colspan="2">' + GC.str("STR_36") + '</th></tr>' +
            '</table>'
        ).appendTo(container);
        
        $.each(scheme.header.rows, function(i, o) {
            var tr = $("<tr/>"), 
                colspan = 2,
                td, units;
            
            if ( o.rowClass ) {
                tr.addClass( o.rowClass );
            }
            
            if ( o.units ) {
                colspan = 1;
                units = o.units[metrics];
                if ($.isFunction(units)) {
                    units = units();
                }
                $('<td/>').html(units).appendTo( tr );
            } else if (o.secondCell) {
                colspan = 1;
                $('<td/>').html(o.secondCell).appendTo( tr );
            }
            
            td = $('<td/>').html('<div>' + GC.str(o.label) + '</div>');
            td.attr( "colspan", colspan );
            td.prependTo( tr );
            tr.appendTo(headerTable);
        });
        
        $('<tr class="footer-row"><td colspan="2">&nbsp;</td></tr>').appendTo(headerTable);
        
        return headerTable;
    }
    
    function renderPatientsView( container ) {
        $(container).empty();
//        var loadingdiv = $("<div><h2>Loading</h2></div>");
//        $(container).append(loadingdiv);
        
//        createHeaderPatientsTable(container);
        var sampleData = [
            ["PATIENT, Anthony", "735", "30332", "404-894-2000", "North Avenue, Atlanta, GA", "info@gatech.edu", "2015-06-07"],
            ["SMITH, John", "644", "30303", "123-456-7890", "Some Street, Atlanta, GA", "info@somedomain.com", "2016-01-17"],
            ["PATIENT, Anthonia", "736", "30332", "404-894-2000", "North Avenue, Atlanta, GA", "info3@gatech.edu", "2015-06-07"],
            ["SMITH, Joanne", "645", "30303", "123-456-7890", "Some Street, Atlanta, GA", "info3@somedomain.com", "2016-01-17"],["PATIENT, Tony", "737", "30332", "404-894-2000", "North Avenue, Atlanta, GA", "info7@gatech.edu", "2015-06-07"],
            ["SMITH, Johnathan", "646", "30303", "123-456-7890", "Some Street, Atlanta, GA", "info7@somedomain.com", "2016-01-17"]
        ];
        var thetable = $("<table></table>").addClass("display");
        thetable.prop("id", "patient-table").prop("width","100%");
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
        
//      var proxyprefix='http://crossorigin.me/';

        var proxyprefix='http://localhost:8888/proxy/'; // corsa; see README

        var minorBirthdate = moment().subtract(18, 'years').startOf("day");
        var minorDateStr = minorBirthdate.format("YYYY-MM-DD");
        var todayDateStr = moment().startOf("day").format("YYYY-MM-DD");
        $.ajax({
            url: proxyprefix + 'http://52.72.172.54:8080/fhir/baseDstu2/Patient?birthdate=%3E%3D' + minorDateStr + '&birthdate=%3C%3D' + todayDateStr + '&_count=50',
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
                thedatatable.row.add([
                        (p.resource.name) ? p.resource.name[0].family + ", " + p.resource.name[0].given[0] + ((p.resource.name[0].given[1]) ? " " + p.resource.name[0].given[1] : "") : "Not known",
                        p.resource.id,
                        (p.resource.address) ? p.resource.address[0].postalCode: "",
                        thePhone,
                        (p.resource.address) ? p.resource.address[0].line.join(", ") + ", " + p.resource.address[0].city + ", " + p.resource.address[0].state : "Not known",
                        theEmail,
                        p.resource.birthDate
                    ]
                )
//                    if (p.resource.deceased) {alert(p.resource.deceased + " " + heading.text());}
            }
            thedatatable.draw(false);
            console.log("links " + patientResult.link.length);
            if (initialCall) {
                var nResults = patientResult.total;
                for (var ind = 0; ind < patientResult.link.length; ind++) {
                    if (patientResult.link[ind].relation == "next") {
                        var theURL = patientResult.link[ind].url;
                        console.log("url " + theURL);
                        var a = $('<a>', { href:theURL } )[0];
                        var que = a.search.substring(1);
                        var quedata = que.split("&");
                        for (var qind = 0; qind < quedata.length; qind++) {
                            var item = quedata[qind].split("=");
                            if ((item[0] === "_getpagesoffset") && (parseInt(item[1]) < nResults)) {
                                var nRequests = 0;
                                for (var offsetResults = parseInt(item[1]); offsetResults < nResults; offsetResults += 50) {
                                    var newURL = theURL.replace(/(_getpagesoffset=)(\d+)/, '$1' + offsetResults.toString());
                                    console.log("rewritten to " + newURL);
                                    nRequests++;
                                    $.ajax({
                                        dataType: "json",
                                        url: proxyprefix + newURL,
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
    }
    
    /**
     * The scheme used to create and render the grid
     */
/*    scheme = {
        header : {
            rows : [
                // Annotation
                {
                    label : "STR_12", // Annotation
                    get   : function( entry, model ) {
                        return entry.annotation ? 
                            '<div class="annotation-wrap">' + 
                            GC.Util.ellipsis(entry.annotation.txt, 6, 36, "...") + 
                            '</div>' : 
                            "&#8212;";
                    },
                    rowClass : "annotation",
                    secondCell : '<a href="javascript:GC.App.viewAnnotations();" class="annotations-see-all">See all</a>'
                },
                
                // Length
                {
                    label : "STR_2", // Length
                    units : { metric : "cm", eng : "ft - in" },
                    get   : getLength,
                    rowClass : "length heading",
                    printrow : 1,
                    printColspan : 3
                },
                {
                    label : "STR_9", // Percentile
                    units : { metric : "%", eng : "%" },
                    get   : function( entry, model ) {
                        return getPercentile( entry, "lengthAndStature" );
                    },
                    rowClass : "length percentile",
                    printrow : 2
                },
                {
                    label : "STR_7", // Z Score
                    units : { metric : "Z", eng : "Z" },
                    get   : function( entry, model ) {
                        return getZScore( entry, "lengthAndStature" );
                    },
                    rowClass : "length z-score",
                    printrow : 2
                },
                {
                    label : "STR_10", // Velocity
                    units : { 
                        metric : function() {
                            return getVelocityUnits("cm");
                        }, 
                        eng : function() {
                            return getVelocityUnits("in");
                        }
                    },
                    get   : function( entry, model ) {
                        return getVelocity( entry, "lengthAndStature" );
                    },
                    rowClass : "length velocity",
                    printrow : 2
                },
                
                
                // Weight
                {
                    label : "STR_6", // Weight
                    units : { metric : "kg", eng : "lb - oz" },
                    get   : getWeight,
                    rowClass : "weight heading",
                    printrow : 1,
                    printColspan : 3
                },
                {
                    label : "STR_9", // Percentile
                    units : { metric : "%", eng : "%" },
                    get   : function( entry, model ) {
                        return getPercentile( entry, "weight" );
                    },
                    rowClass : "weight percentile",
                    printrow : 2
                },
                {
                    label : "STR_7", // Z Score
                    units : { metric : "Z", eng : "Z" },
                    get   : function( entry, model ) {
                        return getZScore( entry, "weight" );
                    },
                    rowClass : "weight z-score",
                    printrow : 2
                },
                {
                    label : "STR_10", // Velocity
                    units : {
                        metric : function() {
                            return getVelocityUnits("kg");
                        }, 
                        eng : function() {
                            return getVelocityUnits("lb");
                        }
                    },
                    get   : function( entry, model ) {
                        return getVelocity( entry, "weight" );
                    },
                    rowClass : "weight velocity",
                    printrow : 2
                },
                
                // Head C
                {
                    label : "STR_13", // Head C
                    units : { metric : "cm", eng : "in" },
                    get   : getHeadC,
                    rowClass : "headc heading",
                    printrow : 1
                },
                {
                    label : "STR_9", // Percentile
                    units : { metric : "%", eng : "%" },
                    get   : function( entry, model ) {
                        return getPercentile( entry, "headc" );
                    },
                    rowClass : "headc percentile"
                },
                {
                    label : "STR_7", // Z Score
                    units : { metric : "Z", eng : "Z" },
                    get   : function( entry, model ) {
                        return getZScore( entry, "headc" );
                    },
                    rowClass : "headc z-score"
                },
                {
                    label : "STR_10", // Velocity
                    units : { 
                        metric : function() {
                            return getVelocityUnits("cm");
                        }, 
                        eng : function() {
                            return getVelocityUnits("in");
                        }
                    },
                    get   : function( entry, model ) {
                        return getVelocity( entry, "headc" );
                    },
                    rowClass : "headc velocity"
                },
                
                // BMI
                {
                    label : "STR_14", // BMI
                    units : { metric : "kg/m2", eng : "lb/ft2x703" },
                    get   : getBMI,
                    rowClass : "bmi heading",
                    printrow : 1
                },
                
                {
                    label : "STR_11", // Bone Age
                    units : { metric : "y - m", eng : "y - m" },
                    get   : function( entry, model ) {
                        if (entry.hasOwnProperty("boneAge")) {
                            var time = new GC.TimeInterval();
                            time.setMonths(entry.boneAge);
                            return time.toString({
                                "Years"   : "y", 
                                "Year"    : "y", 
                                "Months"  : "m", 
                                "Month"   : "m", 
                                "Weeks"   : false,
                                "Days"    : false,
                                separator : '<span class="unit-separator"></span>'
                            });
                        }
                        return EMPTY_MARK;
                    },
                    rowClass : "bone-age heading",
                    printrow : 1
                }
            ]
        }
    };
*/    
     
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
