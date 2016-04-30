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

    function isQuestionViewVisible() {
        return GC.App.getViewType() == "questions";
    }

    function renderQuestionView(container) {
        var thepatient_id = window.sessionStorage.getItem("patient_id");
        thepatient_id = (thepatient_id ? thepatient_id : GC.chartSettings.defaultPatient);
        $.ajax({
            url: GC.chartSettings.serverBase + "/QuestionnaireResponse/?patient=" + thepatient_id,
            dataType: 'json',
            success: processQuestions
        });

        function buildPanelContainer() {
            return $("<div></div>")
            .addClass("container");
        }

        function buildPanelGroup() {
            return $("<div></div>")
            .addClass("panel-group");
        }

        function processQuestions(questionsResult) {
            $(container).empty();

            var thequestions = $("<div></div>").addClass("thequestions");
            thequestions.attr("id", "thequestions-div").attr("width", "100%");
            $(container).append(thequestions);

            var questionnaireLink;
            var questionnaireAnswerSet;

            if (!questionsResult) return;

            if (questionsResult.data) {
                questionsResult = questionsResult.data;
            }

            //setup the panel containers
            var panelContainer = buildPanelContainer();
            var panelGroup = buildPanelGroup();

            thequestions.append(panelContainer);
            panelContainer.append(panelGroup);

            //build the panelGroups
            if(questionsResult.total < 1) {
                //no questionarie for this account
                //-- use the default
                questionnaireLink = "/Questionnaire/" + GC.chartSettings.defaultQuestionnaire
            } else {
                for(var i = 0; i < questionsResult.total; i++) {
                    //we have questionnaires
                    questionnaireLink = "/" + questionsResult.entry[i].resource.questionnaire.reference;

                    questionnaireAnswerSet = questionsResult.entry[i].resource.group.question;

                    renderQuestions(questionsResult.entry[i].resource.id, panelGroup, questionnaireLink, questionnaireAnswerSet);
                }
            }
            //always render the default panel
            renderQuestions(undefined, panelGroup, questionnaireLink, undefined);
        }
    }

    function renderQuestions(panelNumber, panelGroup, questionnaireLink, questionnaireAnswerSet) {

        $.ajax({
            url: GC.chartSettings.serverBase + questionnaireLink,
            dataType: 'json',
            async: false,
            success: function(questionsResult) {
                buildDom(panelNumber, panelGroup, questionsResult, questionnaireAnswerSet);
            }
        });

        function generateQuestionContainer(questionsResult, questionnaireAnswerSet) {
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
                if (typeof llgroup != 'undefined' && llgroup.group) {
                    llgroup = llgroup.group[0];
                    continue;
                }
                /* else if
                (llgroup.question[0].group) {
                                    llgroup = llgroup.question[0].group;
                                    continue;
                                }*/
                break;
            } // temporary for initial code; TODO replace with loop / more advanced logic
            // TODO presentation, style, etcetera

            var title = questionsResult.text.div.match(/<p> <b>title<\/b>: (.*?)<\/p>/)[1];
            var questionType = questionsResult.text.div.match(/<p> <b>id<\/b>: (.*?)<\/p>/)[1];
            var statusType = questionsResult.text.div.match(/<p> <b>status<\/b>: (.*?)<\/p>/)[1];

            var questionContainer = $("<div></div>")
                .addClass("panel-body");

            //build the title
            questionContainer.append($("<div></div>")
                .attr("id", "questions-title")
                .html("<h3>Title: " + title + "</h3>"))
            questionContainer.append($("<div></div>")
                .addClass("questions-id")
                .attr("id", "questions-id")
                .html("<h4>ID: " + id + "</h4>"))
            questionContainer.append($("<div></div>")
                .attr("id", "questions-type")
                .html("<h4>Type: " + questionType + "</h4>"))
            questionContainer.append($("<div></div>")
                .addClass("questions-status")
                .attr("id", "questions-status")
                .html("<h4>Status: " + statusType + "</h4>"))

            //build the questions

            var questiondom = $("<div></div>")

            for (var qind = 0; qind < llgroup.question.length; qind++) {
                var questiondata = llgroup.question[qind];
                var thequestion = questiondata.text ? questiondata.text : "";
                var theoptions = [];
                for (var ind = 0;
                    (questiondata.option) && (ind < questiondata.option.length); ind++) {
                    theoptions.push([(questiondata.option[ind].code ? questiondata.option[ind].code : ""),
                        (questiondata.option[ind].display ? questiondata.option[ind].display : "")
                    ]);
                }
                var optdom = $("<div></div>")
                    .addClass("btn-group btn-group-justified")
                    .attr("data-toggle", "buttons");
                for (var optind = 0; optind < theoptions.length; optind++) {
                    var label = $("<label></label>")

                    label.addClass("btn btn-default btn-responsive questions-theoptions")
                    .attr("id", "questions-theoptions-" + qind + "-" + optind);

                    var input = $("<input />");
                    input.attr("type", "radio")
                        .attr("id", "qopt-" + qind + "-" + optind)
                        .attr("name", "qopt-" + qind)
                        .attr("value", theoptions[optind][0]);

                    if ((typeof questionnaireAnswerSet != 'undefined') && questionnaireAnswerSet[qind].answer[0].valueInteger == optind+1) {
                        label.addClass("active");
                        input.prop("checked");
                    }

                    label.append(input);
                    label.append(theoptions[optind][1]);

                    optdom.append(label);
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

            questionContainer.append(questiondom);

            return questionContainer;
        }

        function buildPanel(panelNumber, questionsResult, questionnaireAnswerSet) {
            if(typeof questionnaireAnswerSet != 'undefined') {
                return buildQuestionPanel(panelNumber, questionsResult, questionnaireAnswerSet);
            } else {
                //always build the default panel
                return buildDefaultPanel(questionsResult);
            }
        }

        function buildQuestionPanel(panelNumber, questionsResult, questionnaireAnswerSet) {
            return $("<div></div>")
            .addClass("panel")
                .append($("<div></div>")
                .addClass("panel-heading")
                    .append($("<div></div>")
                    .addClass("panel-title")
                        .append($("<a></a>")
                        .attr("data-toggle", "collapse")
                        .attr("href","#collapse" + panelNumber)
                        .text("Questionnaire - " + panelNumber))
                    )
                )
                .append($("<div></div>")
                .addClass("panel-collapse collapse")
                .attr("id", "collapse" + panelNumber)

                    //questions go here
                    .append(generateQuestionContainer(questionsResult, questionnaireAnswerSet))
                );;
        }

        function buildDefaultPanel(questionsResult) {
            return $("<div></div>")
            .addClass("panel panel-default")
                .append($("<div></div>")
                .addClass("panel-heading")
                    .append($("<div></div>")
                    .addClass("panel-title")
                        .append($("<a></a>")
                        .attr("data-toggle", "collapse")
                        .attr("href","#collapse-default")
                        .text("New Questionnaire"))
                    )
                )
                .append($("<div></div>")
                .addClass("panel-collapse collapse")
                .attr("id", "collapse-default")
                    .append($("<div></div>")
                    .addClass("panel-body")

                    //default goes here
                    //questions go here
                        .append(generateQuestionContainer(questionsResult, undefined))
                    )
                );
        }

        function buildDom(panelNumber, panelGroup, questionsResult, questionnaireAnswerSet) {
            if (!questionsResult) return;
            if (questionsResult.data) {
                questionsResult = questionsResult.data;
            }
            console.log(questionsResult);

            //build the question panels
            panelGroup.append(buildPanel(panelNumber, questionsResult, questionnaireAnswerSet));
        }
    }

    NS.QuestionView = {
        render: function() {
                //            if (PRINT_MODE) {
                //                renderTableViewForPrint("#view-table");
                //            } else {
                renderQuestionView("#view-questions");
                //            }
            } //,
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
            */
        }
    });

}(GC, jQuery));
