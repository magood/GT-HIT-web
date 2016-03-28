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
        themessage.prop("id", "themessage-div").prop("width", "100%");
        $(container).append(themessage);
        var message_id = (window.sessionStorage.getItem('message_id')) ?
                            window.sessionStorage.getItem('message_id') : "Communication-5679";
        
        $.ajax({
            url: 'http://52.72.172.54:8080/fhir/baseDstu2/Communication/' + message_id,
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
            console.log(messageResult);
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
            var theid = $("<div></div>").addClass("message-id").html("ID: " + id);
            theid.prop("message-id");
            themessage.append(theid);
            var thesender = $("<div></div>").addClass("message-sender").html("Sender: " + sender);
            thesender.prop("message-sender")
            themessage.append(thesender);
            var therecipient = $("<div></div>").addClass("message-recipient").html("Recipient: " + recipient);
            therecipient.prop("message-recipient")
            themessage.append(therecipient);
            var thesubject = $("<div></div>").addClass("message-subject").html("Subject: " + subject);
            thesubject.prop("message-subject");
            themessage.append(thesubject);
            var thecategory = $("<div></div>").addClass("message-category").html("Category: " + category);
            thecategory.prop("message-category");
            themessage.append(thecategory);
            var theencounter = $("<div></div>").addClass("message-encounter").html("Encounter: " + encounter);
            theencounter.prop("message-encounter")
            themessage.append(theencounter);
            var thesent_time = $("<div></div>").addClass("message-sent-time").html("Sent: " + sent_time);
            thesent_time.prop("message-sent-time")
            themessage.append(thesent_time);
            var therec_time = $("<div></div>").addClass("message-rec-time").html("Received: " + rec_time);
            therec_time.prop("message-rec-time")
            themessage.append(therec_time);
            var thecontent = $("<div></div>").addClass("message-content").html("Content: " + content);
            thecontent.prop("message-content");
            themessage.append(thecontent);
            var therequest_detail = $("<div></div>").addClass("message-request-detail").html("Request: " + request_detail);
            therequest_detail.prop("message-request-detail")
            themessage.append(therequest_detail);
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
