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
        
        createHeaderPatientsTable(container);
    }
    
    /**
     * The scheme used to create and render the grid
     */
    scheme = {
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
    
     
    NS.PatientsView = {
        render : function() {
//            if (PRINT_MODE) {
//                renderTableViewForPrint("#view-table");
//            } else {
                renderPatientsView("#view-table");
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
                    renderPatientsView("#view-table");
                }
            });
            
            GC.Preferences.bind("set:metrics set:nicu set:currentColorPreset", function(e) {
                if (isPatientsViewVisible()) {
                    renderPatientsView("#view-table");
                }
            });
            
            GC.Preferences.bind("set", function(e) {
                if (e.data.path == "roundPrecision.velocity.nicu" || 
                    e.data.path == "roundPrecision.velocity.std") {
                    if (isPatientsViewVisible()) {
                        renderPatientsView("#view-table");
                    }
                }
            });
            
/*            GC.Preferences.bind("set:fontSize", function(e) {
                setTimeout(updateDataTableLayout, 0);
            });
*/            
            GC.Preferences.bind("set:timeFormat", function(e) {
                renderPatientsView("#view-table");
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
