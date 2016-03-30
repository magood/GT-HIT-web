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
    
    function isQuestionViewVisible() {
        return GC.App.getViewType() == "questions";
    }

    function renderQuestionView( container ) {
        $(container).empty();

        var thequestions = $("<div></div>").addClass("thequestions");
        thequestions.attr("id", "thequestions-div").attr("width", "100%");
        $(container).append(thequestions);
        var questions_id = (window.sessionStorage.getItem('questions_id')) ?
                            window.sessionStorage.getItem('questions_id') : "18791835";
        
        $.ajax({
            url: 'http://52.72.172.54:8080/fhir/baseDstu2/Questionnaire/' + questions_id,
            dataType: 'json',
            success: mergeHTML
        });
        function mergeHTML(questionsResult) {
            console.log("mergeHTML");
            console.log(questionsResult);
            if (!questionsResult) return;
            if (questionsResult.data) {
                questionsResult = questionsResult.data;
            }
            console.log(questionsResult);
            var id = (questionsResult.id) ? questionsResult.id : "";
            var narrative = (questionsResult.text) ? questionsResult.text.div : "";
            var version = (questionsResult.version) ? questionsResult.version : "";
            var status = questionsResult.status;
            var qdate = questionsResult.date ? questionsResult.date : "";
            var publisher = questionsResult.publisher ? questionsResult.publisher : "";
            var contact = (questionsResult.telecom ?
                            (questionsResult.telecom[0].system ? 
                                questionsResult.telecom[0].system + " " : "") +
                            (questionsResult.telecom[0].value ?
                                questionsResult.telecom[0].value : "") : "");
            var llgroup = questionsResult.group;
            while (true) {
                if (llgroup.group) {
                    llgroup = llgroup.group[0];
                    continue;
                } else if (llgroup.question[0].group) {
                    llgroup = llgroup.question[0].group;
                    continue;
                }
                break;
            } // temporary for initial code; TODO replace with loop / more advanced logic
            // TODO presentation, style, etcetera
            thequestions.append($("<div></div>")
                                .addClass("questions-id")
                                .attr("id", "questions-id")
                                .html("ID: " + id));
            thequestions.append($("<div></div>")
                                .addClass("questions-version")
                                .attr("id", "questions-version")
                                .html("Version: " + version));
            thequestions.append($("<div></div>")
                                .addClass("questions-status")
                                .attr("id", "questions-status")
                                .html("Status: " + status));
            thequestions.append($("<div></div>")
                                .addClass("questions-qdate")
                                .attr("id", "questions-qdate")
                                .html("Date: " + qdate));
            thequestions.append($("<div></div>")
                                .addClass("questions-publisher")
                                .attr("id", "questions-publisher")
                                .html("Publisher: " + publisher));
            thequestions.append($("<div></div>")
                                .addClass("questions-contact")
                                .attr("id", "questions-contact")
                                .html("Contact: " + contact));
            thequestions.append($("<div></div>")
                                .addClass("questions-narrative")
                                .attr("id", "questions-narrative")
                                .html("<h2>" + narrative + "</h2>"));
            var questiondom = $("<div></div>")
                            .addClass("container")
            for (var qind = 0; qind < llgroup.question.length; qind++) {
                var questiondata = llgroup.question[qind];
                var thequestion = questiondata.text ? questiondata.text : "";
                var theoptions = [];
                for (var ind = 0; (questiondata.option) && (ind < questiondata.option.length); ind++) {
                    theoptions.push([(questiondata.option[ind].code ? questiondata.option[ind].code : ""),
                                     (questiondata.option[ind].display ? questiondata.option[ind].display : "")]);
                }
                var optdom = $("<div></div>")
                                .addClass("btn-group btn-group-justified")
                                .attr("data-toggle", "buttons");
                for (var optind = 0; optind < theoptions.length; optind++) {
                    optdom.append($("<label></label>")
                                        .addClass("btn btn-default btn-responsive questions-theoptions")
                                        .attr("id", "questions-theoptions-" + qind + "-" + optind)
                                        .append($("<input />")
                                            .attr("type", "radio")
                                            .attr("id", "qopt-" + qind + "-" + optind)
                                            .attr("name", "qopt-" + qind)
                                            .attr("value", theoptions[optind][0]))
                                        .append(theoptions[optind][1]));
                    $("#questions-theoptions-" + qind + "-0").addClass("active")
                    $("#qopt-" + qind + "-0").prop("checked", true);
                }
                questiondom.append($("<div></div>")
                                        .addClass("row well")
                                        .append($("<div></div>")
                                            .addClass("questions-thequestion col-sm-3 bb")
                                            .attr("id", "questions-thequestion-" + qind)
                                        .html(thequestion))
                                        .append($("<div></div>")
                                            .addClass("col-sm-9 bb")
                                            .append(optdom)));
            }
            thequestions.append(questiondom);
        }
    }


    NS.QuestionView = {
        render : function() {
//            if (PRINT_MODE) {
//                renderTableViewForPrint("#view-table");
//            } else {
                renderQuestionView("#view-questions");
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
                if (isQuestionViewVisible()) {
                    renderQuestionView("#view-questions");
                }
            });

            GC.Preferences.bind("set:metrics set:nicu set:currentColorPreset", function(e) {
                if (isQuestionViewVisible()) {
                    renderQuestionView("#view-questions");
                }
            });

            GC.Preferences.bind("set", function(e) {
                if (e.data.path == "roundPrecision.velocity.nicu" ||
                    e.data.path == "roundPrecision.velocity.std") {
                    if (isQuestionViewVisible()) {
                        renderQuestionView("#view-questions");
                    }
                }
            });

/*            GC.Preferences.bind("set:fontSize", function(e) {
                setTimeout(updateDataTableLayout, 0);
            });
*/
            GC.Preferences.bind("set:timeFormat", function(e) {
                renderQuestionView("#view-questions");
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
