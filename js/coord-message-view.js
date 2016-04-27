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
    
    function isMessageViewVisible() {
        return GC.App.getViewType() == "message";
    }

    function renderMessageView( container ) {
        $(container).empty();

        var themessage = $("<div></div>").addClass("themessage");
        themessage.attr("id", "themessage-div").attr("width", "100%");
        $(container).append(themessage);
        var message_id = (window.sessionStorage.getItem('message_id')) ?
                                window.sessionStorage.getItem('message_id') :
                                GC.chartSettings.defaultMessage;
        
        $.ajax({
            url: GC.chartSettings.serverBase + "/Communication/" + message_id,
            dataType: 'json',
            success: mergeHTML
        });
        function mergeHTML(messageResult) {
            console.log("mergeHTML");
            console.log(messageResult);
            if (!messageResult) return;
            if (messageResult.data) {
                messageResult = messageResult.data;
            }
            var id = (messageResult.id) ? messageResult.id : "";
            var sender = ((messageResult.sender) ?
                            ((messageResult.sender.display) ? messageResult.sender.display + " " : "") +
                            ((messageResult.sender.reference) ? messageResult.sender.reference : "") : "");
            var recipient = ((messageResult.recipient) ?
                              ((messageResult.recipient[0].display) ?
                                  messageResult.recipient[0].display + " " : "") + 
                              ((messageResult.recipient[0].reference) ?
                                  messageResult.recipient[0].reference : "") : "");
            var subject = ((messageResult.subject) ?
                            ((messageResult.subject.display) ? messageResult.subject.display + " " : "") + 
                            ((messageResult.subject.reference) ? messageResult.subject.reference : "") : "");
            var category = (messageResult.category) ?
                            ((messageResult.category.text) ? messageResult.category.text + " " : "") +
                            ((messageResult.category.coding) ?
                                ((messageResult.category.coding.system) ?
                                    messageResult.category.coding.system + " - " : "") +
                                ((messageResult.category.coding.code) ?
                                    messageResult.category.coding.code : "") : "") : "";
            var encounter = (messageResult.encounter) ?
                                ((messageResult.encounter.reference) ?
                                    messageResult.encounter.reference + " " : "") +
                                ((messageResult.encounter.display) ?
                                    messageResult.encounter.display : "") : "";
            var sent_time = (messageResult.sent) ?
                            moment(messageResult.sent).format('ll') : "";
            var rec_time = (messageResult.received) ?
                            moment(messageResult.received).format('ll') : "";
            var content = (messageResult.payload) ? messageResult.payload.content : "";
            var request_detail = (messageResult.requestDetail) ?
                                ((messageResult.requestDetail.reference) ?
                                    messageResult.requestDetail.reference + " " : "") +
                                ((messageResult.requestDetail.display) ?
                                    messageResult.requestDetail.display : "") : "";
            // TODO presentation, style, etcetera
            themessage.append($("<div></div>")
                                .addClass("message-id")
                                .attr("id", "message-id")
                                .html("ID: " + id));
            themessage.append($("<div></div>")
                                .addClass("message-sender")
                                .attr("id", "message-sender")
                                .html("Sender: " + sender));
            themessage.append($("<div></div>")
                                .addClass("message-recipient")
                                .attr("id", "message-recipient")
                                .html("Recipient: " + recipient));
            themessage.append($("<div></div>")
                                .addClass("message-subject")
                                .attr("id", "message-subject")
                                .html("Subject: " + subject));
            themessage.append($("<div></div>")
                                .addClass("message-category")
                                .attr("id", "message-category")
                                .html("Category: " + category));
            themessage.append($("<div></div>")
                                .addClass("message-encounter")
                                .attr("id", "message-encounter")
                                .html("Encounter: " + encounter));
            themessage.append($("<div></div>")
                                .addClass("message-sent-time")
                                .attr("id", "message-sent-time")
                                .html("Sent: " + sent_time));
            themessage.append($("<div></div>")
                                .addClass("message-rec-time")
                                .attr("id", "message-rec-time")
                                .html("Received: " + rec_time));
            themessage.append($("<div></div>")
                                .addClass("message-content")
                                .attr("id", "message-content")
                                .html("Content: " + content));
            themessage.append($("<div></div>")
                                .addClass("message-request-detail")
                                .attr("id", "message-request-detail")
                                .html("Request: " + request_detail));
        }
    }


    NS.MessageView = {
        render : function() {
//            if (PRINT_MODE) {
//                renderTableViewForPrint("#view-table");
//            } else {
                renderMessageView("#view-message");
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
                if (isMessageViewVisible()) {
                    renderMessageView("#view-message");
                }
            });

            GC.Preferences.bind("set:metrics set:nicu set:currentColorPreset", function(e) {
                if (isMessageViewVisible()) {
                    renderMessageView("#view-message");
                }
            });

            GC.Preferences.bind("set", function(e) {
                if (e.data.path == "roundPrecision.velocity.nicu" ||
                    e.data.path == "roundPrecision.velocity.std") {
                    if (isMessageViewVisible()) {
                        renderMessageView("#view-message");
                    }
                }
            });

/*            GC.Preferences.bind("set:fontSize", function(e) {
                setTimeout(updateDataTableLayout, 0);
            });
*/
            GC.Preferences.bind("set:timeFormat", function(e) {
                renderMessageView("#view-message");
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
