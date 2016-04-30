/*global Chart, GC, PointSet, Raphael, XDate, console,
 Raphael*/
/*jslint eqeq: true, nomen: true, plusplus: true, newcap: true */


function gc_app_js (NS, $) {

    //"use strict";

    NS.App = (NS.App ? NS.App : {});

    var DEBUG_MODE = NS.chartSettings.appEnvironment === "DEVELOPMENT",
        leftPane = null,
        parentalDarwn = false,
        drawn = false,
        PATIENT = null,
        BIRTH_XDATE = new XDate(),
        MIN_WEEK_DIFF = NS.chartSettings.minTimeInterval / NS.Constants.TIME.WEEK,
        BROADCASTER = $("html"),
        PRIMARY_CHART_TYPE = "CDC",
        CORRECTION_CHART_TYPE = "CDC", // CDC, WHO etc.
        START_WEEK = 0,
        END_WEEK = 26.08928571428572,
        START_AGE_MOS = null,
        END_AGE_MOS = null,
        GENDER = null,
        RENDER_FOR_PRINT = $("html").is(".before-print"),
        PRINT_WINDOW = null,
        ANNOTATIONS_WINDOW = null,
        imagesToPreload = [
            "img/pview/HeadCircumferenceIcon.png",
            "img/pview/LengthIcon.png",
            "img/pview/WeightIcon.png",
            "img/pview/avatar-female.png",
            "img/pview/avatar-male.png",
            //"img/pview/blueBabyHeightImage.png",
            //"img/pview/blueChildHeightImage.png",
            //"img/pview/blueFatherHeightImage.png",
            //"img/pview/blueTeenHeightImage.png",
            //"img/pview/blueToddlerHeightImage.png",
            "img/pview/bmi-icon.png"//,
            //"img/pview/fatherHeightImage.png",
            //"img/pview/fatherHeightImageForeign.png",
            //"img/pview/motherHeightImage.png",
            //"img/pview/motherHeightImageForeign.png",
            //"img/pview/pinkBabyHeightImage.png",
            //"img/pview/pinkChildHeightImage.png",
            //"img/pview/pinkMotherHeightImage.png",
            //"img/pview/pinkTeenHeightImage.png",
            //"img/pview/pinkToddlerHeightImage.png"
        ],

        getStartAgeMos,
        getEndAgeMos;

    window.debugLog = function(a) {
        if (DEBUG_MODE && window.console) {
            console.log(a);
        }
    };

    // gender ------------------------------------------------------------------
    function getGender() {
        if (!GENDER) {
            GENDER = PATIENT.gender;
        }
        return GENDER;
    }

    function setGender(gender) {
        if (gender == "female" || gender == "male") {
            PATIENT.gender = GENDER = gender;
        }
    }

    // percentiles -------------------------------------------------------------
    GC.Preferences._get__percentiles = function() {
        return $.map($.makeArray(this._data.percentiles), function(n) {
            return parseFloat(n);
        });
    };

    GC.Preferences._set__percentiles = function(pct) {
        return $.map($.makeArray(pct), function(n) {
            return parseFloat(n);
        });
    };

    GC.Preferences.bind("set:pctz", function(e) {
        $('[name=pctz]').val(e.data.newValue).trigger("change");
    });

    // START_WEEK --------------------------------------------------------------
    function getStartWeek() {
        return START_WEEK;
    }

    function setStartWeek(n, silent) {
        NS.App._START_WEEK = START_WEEK = Math.min(GC.Util.floatVal(n), END_WEEK - MIN_WEEK_DIFF);
        START_AGE_MOS = null;
        END_AGE_MOS = null;
        getStartAgeMos();
        getEndAgeMos();
        var range = START_WEEK + ":" + END_WEEK;
        $('input:radio[name="time-range"]').each(function() {
            this.checked = this.value == range;
            $(this).closest("label").toggleClass("active", this.checked);
        });

        if (!silent) {
            BROADCASTER.trigger("set:weeks", [START_WEEK, END_WEEK]);
        }
        return true;
    }

    // END_WEEK ----------------------------------------------------------------
    function getEndWeek() {
        return END_WEEK;
    }

    function setEndWeek(n, silent) {
        NS.App._END_WEEK = END_WEEK = Math.max(GC.Util.floatVal(n), START_WEEK + MIN_WEEK_DIFF);
        START_AGE_MOS = null;
        END_AGE_MOS = null;
        getStartAgeMos();
        getEndAgeMos();
        var range = START_WEEK + ":" + END_WEEK;
        $('input:radio[name="time-range"]').each(function() {
            this.checked = this.value == range;
            $(this).closest("label").toggleClass("active", this.checked);
        });

        if (!silent) {
            BROADCASTER.trigger("set:weeks", [START_WEEK, END_WEEK]);
        }

        return true;
    }

    // Weeks -------------------------------------------------------------------
    function getWeeks() {
        return END_WEEK - START_WEEK;
    }

    // startAgeMos -------------------------------------------------------------
    function setStartAgeMos(months) {
        return setStartWeek(months * GC.Constants.TIME.MONTH / GC.Constants.TIME.WEEK);
    }

    getStartAgeMos = function() {
        if (START_AGE_MOS === null) {
            //var tmp = BIRTH_XDATE.clone().addWeeks(START_WEEK);
            //START_AGE_MOS = BIRTH_XDATE.diffMilliseconds(tmp)/GC.Constants.TIME.MONTH;
            //tmp = null;
            START_AGE_MOS = (START_WEEK * GC.Constants.TIME.WEEK) / GC.Constants.TIME.MONTH;
        }
        return START_AGE_MOS;
    };

    // endAgeMos ---------------------------------------------------------------
    function setEndAgeMos(months) {
        return setEndWeek(months * GC.Constants.TIME.MONTH / GC.Constants.TIME.WEEK);
    }

    getEndAgeMos = function() {
        if (END_AGE_MOS === null) {
            //var tmp = BIRTH_XDATE.clone().addWeeks();
            END_AGE_MOS = (END_WEEK * GC.Constants.TIME.WEEK) / GC.Constants.TIME.MONTH;
            //tmp = null;
        }
        return END_AGE_MOS;
    };

    // PRIMARY_CHART_TYPE (Primary DataSet) ------------------------------------
    function getPrimaryChartType() {
        return PRIMARY_CHART_TYPE;
    }

    // CORRECTION_CHART_TYPE (Secondary DataSet) -------------------------------
    function getCorrectionalChartType() {
        return CORRECTION_CHART_TYPE;
    }

    function setStageHeight() {
        var top = 0, marginTop = 0, bottom = 0, header = $("#header:visible"), timelineTop = $("#timeline-top:visible"), timelineBottom = $("#timeline-bottom:visible");

        if (header.length) {
            top += header.outerHeight();
        }

        if (timelineTop.length) {
            marginTop += timelineTop.outerHeight();
        }

        if (timelineBottom.length) {
            bottom += timelineBottom.outerHeight();
        }

        $("#stage").css({
            top : top//,
            //marginTop : marginTop,
            //bottom : bottom
        });

        if (RENDER_FOR_PRINT) {
            $("#stage").css("height", $(window).height() - bottom - top - marginTop);
        }
    }

    function selectRangeForAge(age) {
        var weeks = age / GC.Constants.TIME.WEEK;
        $('input:radio[name="time-range"]').each(function() {
            var values = this.value.split(":"),
                start  = GC.Util.floatVal(values[0]),
                end    = GC.Util.floatVal(values[1]);

            // If the given age is within this time range
            if (start <= weeks && end >= weeks) {
                setStartWeek(start, true);
                setEndWeek(end);
                return false;
            }
            return true;
        });
    }

    function getFitRange() {
        var first = PATIENT.getFirstModelEntry(),
            last = PATIENT.getLastModelEntry(),
            step,
            firstAge,
            lastAge,
            range;

        if (!first || !last) {
            return null;
        }

        lastAge = last.agemos * GC.Constants.TIME.MONTH;
        firstAge = first.agemos * GC.Constants.TIME.MONTH;
        range = lastAge - firstAge;
        step = GC.Constants.TIME.YEAR;

        if (range < GC.Constants.TIME.YEAR * 2) {
            step = GC.Constants.TIME.MONTH;
        }

        if (range < GC.Constants.TIME.MONTH * 2) {
            step = GC.Constants.TIME.WEEK;
        }

        if (range < GC.Constants.TIME.WEEK * 2) {
            step = GC.Constants.TIME.DAY;
        }

        return [Math.max(0, (firstAge - step) / GC.Constants.TIME.WEEK), (lastAge + step) / GC.Constants.TIME.WEEK];
    }

    function fitToData() {//debugger;
        var range = getFitRange();
        if (range) {
            setStartWeek(range[0], true);
            setEndWeek(range[1]);
        }
    }

    function draw(type) {
        if (!drawn) {
            var lastEntry = PATIENT.getLastModelEntry();
            if (lastEntry) {
                GC.App.selectRangeForAge(lastEntry.agemos * GC.Constants.TIME.MONTH);
                GC.App.setSelectedRecord(lastEntry);
            }
        }

        switch (type || GC.App.getViewType()) {
            case "graphs":
                if (!leftPane && !NS.App.Pane) {
                    leftPane = new ChartPane(Raphael($("#stage .stage-1")[0]));
                    leftPane.addChart(new GC.App.Charts["Length/Stature Chart"](), 0);
                    leftPane.addChart(new GC.App.Charts["Weight Chart"](), 0);
                    leftPane.addChart(new GC.App.Charts["Percentile Chart"](), 1);
                    leftPane.addChart(new GC.App.Charts["Chart Stack"]([new GC.App.Charts["Body Mass Index Chart"](), new GC.App.Charts["Head Circumference Chart"]()]), 1);
                    NS.App.Pane = leftPane;
                    NS.App.ChartsView = leftPane;
                }

                NS.App.Pane.draw();
                $("#print-button").html("Print Graphs");
                break;

            case "parent":
                if (!parentalDarwn) {
                    NS.App.ParentalView = new GC.PView();
                    //drawPaper(600, 320, 0, 0, PATIENT);
                    parentalDarwn = true;
                }
                $("#print-button").html("Print Parent");
                break;

            case "table":
                GC.TableView.render();
                $("#print-button").html("Print Table");
                break;
            case "patients":
                GC.PatientsView.render();
                //TODO printing
                break;
            case "allmessages":
                GC.AllMessagesView.render();
                //TODO printing
                break;
            case "message":
                GC.MessageView.render();
                //TODO printing
                break;
            case "map":
                GC.MapView.render();
                //TODO printing
                break;
            case "questions":
                GC.QuestionView.render();
                //TODO printing
                break;
            default:
                break;
        }

        drawn = true;
    }

    function togglePatientEditable(bEditable) {
        $('[name="fader-height"]').stepInput( bEditable ? "enable" : "disable");
        $('[name="mother-height"]').stepInput( bEditable ? "enable" : "disable");
        $('[name="bio-father"]').prop("disabled", !bEditable);
        $('[name="bio-mother"]').prop("disabled", !bEditable);
        $('[name="DOB"]').datepicker( bEditable ? "enable" : "disable");
        $('[name="EDD"]').datepicker( bEditable ? "enable" : "disable");
        //$(".add-entry").toggleClass("ui-state-disabled", !bEditable);
    }

    function togglePatientDataEditable(bEditable) {
        $(".add-entry").toggleClass("ui-state-disabled", !bEditable);
    }

    NS.App.DEBUG_MODE = DEBUG_MODE;

    NS.App.Charts = (NS.App.Charts ? NS.App.Charts : []);
    // TODO possible risk of overloading charts array with multiple type charts
    // for instance length, length/stature, stature it seems should not all be
    // in the array together maybe
    // see charts/length-chart.js:70 getTitle()


    NS.App.getPatient = function getPatient() {
        return PATIENT;
    };
    NS.App.getGender = getGender;
    NS.App.setGender = setGender;
    NS.App.getStartWeek = getStartWeek;
    NS.App.setStartWeek = setStartWeek;
    NS.App.getEndWeek = getEndWeek;
    NS.App.setEndWeek = setEndWeek;
    NS.App.getWeeks = getWeeks;
    NS.App.getStartAgeMos = getStartAgeMos;
    NS.App.getEndAgeMos = getEndAgeMos;
    NS.App.setStartAgeMos = setStartAgeMos;
    NS.App.setEndAgeMos = setEndAgeMos;
    NS.App.selectRangeForAge = selectRangeForAge;
    NS.App.getPrimaryChartType = getPrimaryChartType;
    NS.App.getCorrectionalChartType = getCorrectionalChartType;
    NS.App.fitToData = fitToData;
    NS.App.getFitRange = getFitRange;

    NS.App.getPCTZ = function() {
        return GC.Preferences.prop("pctz");
    };
    NS.App.setPCTZ = function(v) {
        GC.Preferences.prop("pctz", v);
    };
    NS.App.getMetrics = function() {
        return GC.Preferences.prop("metrics");
    };
    NS.App.setMetrics = function(v) {
        GC.Preferences.prop("metrics", v);
    };
    NS.App.getLanguage = function() {
        return $("html").attr("lang") || "en";
    };
    NS.App.setLanguage = function(lang) {
        $("html").attr("lang", lang).trigger("set:language", [lang]);
        return this;
    };


    NS.Util.createProperty(NS.App, {
        name : "correctionAge",
        inputName : "correction-age"
    });

    NS.Util.createProperty(NS.App, {
        name : "viewType",
        getter : function() {
            return $("#view-mode > [data-value].active").attr("data-value");
        },
        model : "Preferences",
        path : "initialView"
    });

    $(function() {
        $("#dialog").dialog({
            autoOpen : false,
            modal : true,
            resizable : false,
            dialogClass : "gc-dialog",
            position : "center"
        });
    });

    NS.App.dialog = function(url, args, options) {

        $("#dialog")
        .empty()
        .html(
            '<div class="content">' +
            '<p style="text-align:center">' +
            '<img src="img/spinner.gif" />' +
            '<br />' +
            '<br />' +
            NS.str("STR_Loading") +
            '</p>' +
            '</div>'
        )
        .data("dialogProxy", {
            "arguments" : $.makeArray(args)
        })
        .dialog("close")
        .dialog("option", $.extend({
            minWidth : 300,
            width : 300,
            title : NS.str("STR_Loading"),
            position : "center"
        }, options)).dialog("open");

        setTimeout(function() {
            $("#dialog").find("> .content").load(url, function() {
                NS.Util.translateHTML(this);
            });
        }, 500);
    };

    NS.App.addEntry = function() {
        if (GC._isPatientDataEditable) {
            GC.App.dialog("add_edit_dataentry.html", null, {
                modal : true,
                "height" : "auto",
                "width" : "auto"
            });
        }
    };

    NS.App.editEntry = function(entry) {
        if (GC._isPatientDataEditable) {
            GC.App.dialog("add_edit_dataentry.html", entry, {
                modal : true,
                "height" : "auto",
                "width" : "auto"
            });
        }
    };

    NS.App.editSettings = function() {
        GC.App.dialog("settings-editor.html", null, {
            "modal" : false,
            "title" : NS.str("STR_3015"),
            "height" : "auto",
            "width" : "auto"
        });
    };

    NS.App.aboutAppDialog = function() {
        GC.App.dialog("about-dialog.html", null, {
            "modal" : false,
            "title" : NS.str("STR_AboutThisApp"),
            "height" : "auto",
            "width" : "auto"
        });
    };

    NS.App.messageDetail = function() {
        GC.App.dialog("message-detail.html", null, {
            "modal" : false,
            "title" : NS.str("STR_3167").substring(0,1) +
                    NS.str("STR_3167").substring(1).toLowerCase() + " " +
                    window.sessionStorage.getItem('message_id'),
            "height" : "auto",
            "width" : "auto"
        });
    };

    /**
     @param data data.resources should be an array of objects
     every resource object should contain
        resourcename,
        resourcetiming,
        resourceaddress
    data needs to contain additionally
        data.patient_name,
        data.patient_id
    */
    NS.App.sendCommunityReferrals = function(data) {
        var thecontent = "Dear " + data.patient_name + "\n\n" +
                    "This is a message from your Community Healthy Weight " +
                    "Care Coordinator\n\n" +
                    "We are writing to suggest that you may care to attend " +
                    "the following local resources\n\n\n";
        data.resources = (data.resources ? data.resources :
            [{
                resourcename: "the park",
                resourcetiming: "dawn to dusk every day",
                resourceaddress: "up the road"
            }]);
        data.resources.forEach(function(element) {
            thecontent += "\t" + element.resourcename + "\n" +
                        "\t" + element.resourcetiming + "\n" +
                        "\t" + element.resourceaddress + "\n\n";
        });
        thecontent += "\nWe hope these resources allow you to manage your " +
                        "weight successfully\n\n" +
                        "In case you need more information, please contact us\n\n" +
                        "telephone (703)555-1234\n" +
                        "Email CDCHealthyWeightAtlanta@gatech.edu\n" +
                        "555 Some Street, Atlanta, GA 30331";
//        http://52.72.172.54:8080/fhir/baseDstu2/ReferralRequest?patient._id=18791941&recipient._id=Organization%2F19178873&status=accepted
        var request_id = GC.chartSettings.defaultReferralRequest;
        var refreq = null;
        $.ajax({
            url: GC.chartSettings.serverBase + "/ReferralRequest?patient._id=" +
                    data.patient_id + "&recipient._id=" +
                    (GC.chartSettings.serverSMART ? "" : "Organization%2F") +
                    GC.chartSettings.defaultSelf + "&status=accepted",
            type: "GET",
            async: false,
            global: false,
            dataType: 'json',
            success: function(ret_data) {
                console.log(ret_data);
                if (ret_data.total < 1) {
                    return;
                }
                refreq = ret_data.entry[0].resource; // TODO possibly handle sorting multiple results
                request_id = refreq.id;
            },
            contentType: 'application/json'
        });
        if (!refreq) {
            alert("Please accept a referral from a referral message first");
            return;
        }
        console.log(thecontent);
        var thecomm = {
            resourceType: "Communication",
            text:{
                status: "generated",
                div: "<div>the childhood healthy weight patient coordinator is referring you to some community resources</div>"
            },
            category: {
                coding: [
                    {
                        system: "http://acme.org/messagetypes",
                        code: "notification"
                    }
                ],
                text: "notification"
            },
            sender: {
                display: "Childhood Healthy Weight Coordinator",
                reference: "Organization/" + GC.chartSettings.defaultSelf
            },
            recipient: [
                    {
                        reference: 'Patient/' + data.patient_id,
                        display: data.patient_name
                    }
            ],
            payload: [
                {
                    contentString: thecontent
                },
                {
                    contentReference: {
                        reference: "ReferralRequest/" + request_id
                    }
                }
            ],
            status: "in-progress",
            sent: moment().format(),
            subject: {
                reference: "Patient/" + data.patient_id,
                display: data.patient_name
            }
        };
        //console.log(JSON.stringify(thecomm));
        $.ajax({
            url: GC.chartSettings.serverBase + "/Communication/",
            type: "POST",
            async: false,
            global: false,
            data: JSON.stringify(thecomm),
            dataType: 'json',
            success: function(ret_data) {
                alert('patient referral to community resources sent!');
                sessionStorage.removeItem("pending_referrals");
                if (refreq) {
                    delete refreq.meta;
                    refreq.status = "completed";
                    $.ajax({
                        url: GC.chartSettings.serverBase + "/ReferralRequest/" + request_id,
                        type: "PUT",
                        async: false,
                        global: false,
                        data: JSON.stringify(refreq),
                        dataType: 'json',
                        success: function(refreq_ret_data) {
                            console.log(refreq_ret_data);
                        },
                        contentType: 'application/json'
                    });
                }
                console.log(ret_data);
            },
            contentType: 'application/json'
        });
    };

    NS.App.setPatientId = function(new_patient_id) {
        if (new_patient_id && (new_patient_id != window.sessionStorage.getItem('patient_id'))) {
            window.sessionStorage.setItem('patient_id', new_patient_id);
            call_load_functions_js();
            GC.get_data();
            window.sessionStorage.removeItem('psmessagestable');
        }
    }

    NS.App.viewAnnotations = function() {
        if (ANNOTATIONS_WINDOW === null || ANNOTATIONS_WINDOW.closed) {
            ANNOTATIONS_WINDOW = window.open("annotations.html", "annotationsWindow", "resizable=yes,scrollbars=yes,centerscreen=yes,status=yes,width=800,height=600,dependent=yes,dialog=yes");
        } else {
            ANNOTATIONS_WINDOW.focus();
            ANNOTATIONS_WINDOW.location.reload();
        }
    };

    NS.App.editParents = function() {
        GC.App.dialog("edit-parents.html", null, {
            modal : true,
            width : "auto",
            title : NS.str("STR_AddEditParentalHeights")
        });
    };

    NS.App.print = function() {
        if (PRINT_WINDOW === null || PRINT_WINDOW.closed) {
            PRINT_WINDOW = window.open("print-charts.html", "printWindow", "resizable=yes,scrollbars=yes,status=yes,top=10,left=10,width=1100,height=800");
        } else {
            PRINT_WINDOW.focus();
            PRINT_WINDOW.location.reload();
        }
    };

    NS.App.getLastDataAge = function() {
        var out = 0;
        if (PATIENT) {
            var lastDate, lastEntry = PATIENT.getLastModelEntry();
            if (lastEntry) {
                lastDate = PATIENT.DOB.clone().addMonths(lastEntry.agemos);
                out = PATIENT.DOB.diffMilliseconds(lastDate);
            }
        }
        return out;
    };

    NS.App.refresh = function() {
        NS.App.getPatient().refresh();
        draw();
    };

    $(window).bind("keydown keyup keypress", function(e) {
        if (e.keyCode == 80 && e.ctrlKey) {
            if (e.type == "keyup") {
                NS.App.print();
            }
            return false;
        }
        return true;
    });

    function Widget(cfg) {
        cfg.view.bind(cfg.changeEvent || "change", function() {
            cfg.model.prop(cfg.path, format(cfg.view.val(), cfg.type));
        }).val(cfg.model.prop(cfg.path)).triggerHandler(cfg.changeEvent || "change");

        cfg.model.bind("set:" + cfg.path, function(e) {
            cfg.view.val(e.data.newValue).trigger(cfg.changeEvent || "change");
        });
    }


    GC.DataType = {
        FLOAT          : 1,
        INT            : 2,
        UNSIGNED_INT   : 4,
        UNSIGNED_FLOAT : 8,
        STRING         : 16,
        BOOLEAN        : 32
    };

    function format(x, dataType, defaultValue) {
        var out = x;
        switch (dataType) {
            case GC.DataType.FLOAT:
                out = GC.Util.floatVal(x, defaultValue);
                break;

            case GC.DataType.INT:
                out = GC.Util.intVal(x, defaultValue);
                break;

            case GC.DataType.BOOLEAN:
                out = /^(true|1|y|yes|on)$/i.test(String(x));
                break;

            case GC.DataType.STRING:
                out = String(x);
                break;

            default:
                throw "Undefined data type";
        }

        if ((dataType === GC.DataType.UNSIGNED_FLOAT) || (dataType === GC.DataType.UNSIGNED_INT)) {
            out = Math.abs(out);
        }

        return out;
    }

    // =========================================================================
    // Start of selection methods
    // =========================================================================
    ( function() {

        GC.SELECTION = {
            hover : {
                age : new GC.Time(-1),
                record : null
            },
            selected : {
                age : new GC.Time(-1),
                record : null
            }
        };

        function set(rec, mos, type) {
            GC.SELECTION[type].age.setMonths(mos);
            GC.SELECTION[type].record = rec;
            //GC.App.selectRangeForAge(GC.SELECTION[type].age.getMilliseconds());
            $("html").trigger("appSelectionChange", [type, GC.SELECTION[type]]);
        }


        GC.App.setSelectedAgemos = function(agemos, type) {

            if (type != "hover") {
                type = "selected";
            }

            if (GC.SELECTION[type].age.getMonths() === agemos) {
                return;
            }

            var rec = PATIENT.getModelEntryAtAgemos(agemos);
            set(rec, agemos, type);
        };

        GC.App.setSelectedRecord = function(record, type) {

            if (type != "hover") {
                type = "selected";
            }

            if (GC.SELECTION[type].record === record) {
                return;
            }

            set(record, record.agemos, type);
        };

        GC.App.unsetSelection = function(type) {
            if (type != "hover") {
                type = "selected";
            }

            if (GC.SELECTION[type].age.getMilliseconds() < 0) {
                return;
            }

            set(null, -1, type);
        };

    }());

    // =========================================================================
    // End of selection methods
    // =========================================================================

    $(function initUI() {

        var stage = $("#stage"),
            QUEUE = new GC.Util.TaskQueue({
                onChange : function(task) {
                    $("#loading-indicator .msg").text(task.description);
                },
                onComplete : function() {
                    $("#loading-indicator").delay(500).fadeOut(400, function() {
                        $(this).hide();
                    });
                }
            });

        function createLanguageSelectors() {
            var len = 0,
                enabledLocales = [],
                cur = GC.App.getLanguage();

            $.each(GC.locales, function(i, locale) {
                if (locale.enabled) {
                    enabledLocales[len++] = locale;
                }
            });

            $(".language-selector").each(function(i, o) {
                $(o).empty();


                // Display the 2 languages as toggle-button
                if (len == 2) {
                    var input = $('<input class="toggle-button" type="hidden" name="language" />').attr({
                        "value" : cur,
                        "data-value1" : enabledLocales[0].langAbbr,
                        "data-value2" : enabledLocales[1].langAbbr,
                        "data-label1" : enabledLocales[0].language,
                        "data-label2" : enabledLocales[1].language
                    }).change(function() {
                        GC.App.setLanguage($(this).val());
                    }).appendTo(o);
                    $.createToggleButton(input);
                }

                // Display the one or more than two languages as select
                else {
                    var html = '<select name="language" class="styled language-select">';
                    $.each(enabledLocales, function(i, locale) {
                        html += '<option value="' + locale.langAbbr + '">' + locale.language + '</option>';
                    });
                    html += '</select>';

                    $(o)
                        .append('<span data-translatecontent="STR_0">' + GC.str("STR_0") + '</span>: ')
                        .append(
                            $(html).val(cur).change(function() {
                                GC.App.setLanguage($(this).val());
                            })
                        );
                }
            });

            $("html").bind("set:language", function(e, lang) {
                $(".language-selector select").val(lang);
                NS.Util.translateHTML();
            });

            $('#switch-pct').prop('checked', NS.App.getPCTZ() == 'z')
            $('#switch-metric').prop('checked', NS.App.getMetrics() != 'eng')
        }

        function renderPatient() {
            var currentAge = PATIENT.getCurrentAge();
            var correctedAge = PATIENT.getCorrectedAge();

            $('.patient-name').text(PATIENT.name);

            // FIXME: Naive algorithm alert. This won't i18nize well.
            (PATIENT.gender.toLowerCase().indexOf('f') != -1) ?
                $('#patient-gender-icon').attr('src', 'img/avatar_f.png') :
                $('#patient-gender-icon').attr('src', 'img/avatar_m.png');

            $('.patient-gender').text(GC.str("STR_SMART_GENDER_" + PATIENT.gender));
            $('.patient-gender').attr("data-translatecontent", "STR_SMART_GENDER_" + PATIENT.gender);
            $("[name=GA]").val(PATIENT.getGestatonCorrection().toString(GC.chartSettings.timeInterval).replace(/^\-\s*/, ""));
            $(".patient-age").text(currentAge.toString(GC.chartSettings.timeInterval));
            $('.patient-birth').text(PATIENT.DOB.toString(GC.chartSettings.dateFormat));
            if (PATIENT.weeker) {
                $(".weeker").show().find(".value").html(PATIENT.weeker);
            } else {
                $(".weeker").hide();
            }

            if (correctedAge > currentAge || correctedAge < currentAge) {
                $("#corrected-age").html(correctedAge.toString(GC.chartSettings.timeInterval)).parent().show();
            } else {
                $("#corrected-age").parent().hide();
            }
        }

        function setInitialState(done) {

            var testEl = $("<div/>"), $body = $("body");

            testEl.css({
                "backgroundColor" : "rgba(0, 0, 0, 0.5)"
            });

            var hasRGBA = (/\brgba\b/i).test(testEl.css("backgroundColor"));
            var hasBorderRadius = $body.css("borderRadius") !== undefined;
            var hasBoxShadow = $body.css("boxShadow") !== undefined;
            var hasTransition = $body.css("transition") !== undefined;
            var hasTransform = $body.css("transform") !== undefined;

            $("html")
                .toggleClass("debug-mode", DEBUG_MODE)
                .toggleClass("dev", GC.chartSettings.appEnvironment == "DEVELOPMENT")
                .toggleClass("prod", GC.chartSettings.appEnvironment == "PRODUCTION")
                .toggleClass("has-rgba", hasRGBA)
                .toggleClass("no-rgba", !hasRGBA)
                .toggleClass("has-box-shadow", !!hasBoxShadow)
                .toggleClass("no-box-shadow", !hasBoxShadow)
                .toggleClass("has-border-radius", !!hasBorderRadius)
                .toggleClass("no-border-radius", !hasBorderRadius)
                .toggleClass("has-transitions", !!hasTransition)
                .toggleClass("no-transitions", !hasTransition)
                .toggleClass("has-transforms", !!hasTransform)
                .toggleClass("no-transforms", !hasTransform)
                .toggleClass("ie", $.browser.msie === true);

            $.helperStyle("#dummy", {});

            if (PATIENT) {
                BIRTH_XDATE = new XDate(PATIENT.birthdate);
                setGender(PATIENT.gender);
                renderPatient();

                var timer = 0, lastWidth = null, lastHeight = null;
                $(window).bind("resize.redrawSVG", function() {
                    if (timer) {
                        clearTimeout(timer);
                    }

                    setStageHeight();

                    timer = setTimeout(function() {
                        var w = $(window).width(), h = $(window).height();
                        if (w !== lastWidth || h !== lastHeight) {
                            lastWidth = w;
                            lastHeight = h;
                            if (leftPane) {
                                leftPane.draw();
                            }
                        }
                    }, 100);
                });

                done();
            }
        }

        function render(done) {
            GC.App.setViewType(GC.chartSettings.initialView);

            if ($.isFunction(done)) {// can be event too
                done();
            }
        }

        function onModelsReady() {
            return $.when(GC.Preferences.sync(), GC.Scratchpad.sync()).then(function() {
                GC.styleGenerator.refresh();
            });
        }

        function loadData(done) {

            var SMART_NS = "http://smarthealthit.org/terms#",
              capabilities = {
                preferences : {
                  read  : false,
                  write : false,
                  unset : false
                },
                scratchpad : {
                  read  : false,
                  write : false,
                  unset : false
                }
              };

            GC.SMART_READY = true;
            $("window").trigger("smartready");

            GC.Preferences.proxy = new GC.LocalStorageProxy("preferences");
            GC.Scratchpad.proxy = new GC.DummyProxy();

            debugLog("Requesting SMART container manifest...");

            // Initialize (sync.) the models and re-created the dynamic
            // parts of the CSS
            onModelsReady();
            // Patient
            GC.get_data().done(
            function(data) {
              GC.currentPatient = PATIENT = new GC.Patient(
                data.demographics,
                data.vitals,
                null, //allergies,
                data.familyHistory,
                null,//	annotations,
                data.boneAge
              );
              GC.translatePreemieDatasets(PATIENT);
              done();
            }).fail(function(response){
              var msg = response.responseText;
              console.log("Failed.");
              $("#loading-indicator h2").html(msg);
              if (response.status === 404) {
                $("#loading-indicator h2").append($("<button>Make me a fake one!</button>"));
                $("#loading-indicator button").click(function(){
                  $.get("/my/ccda/fixture").success(function(){
                    window.location.href = window.location.href;
                  });
                });
              }
            });
        }

        function initUIControls(done) {

            createLanguageSelectors();

            // Choose view type
            // =================================================================

            $("html").bind("set:viewType", function(e, type) {

                if (type == 'allmessages' || type == 'patients') {
                    $('nav').addClass('caremode');
                    $('#patient-info').css('display', 'none');
                    $('.brand-logo').text('Care Coordinator')
                } else {
                    $('nav').removeClass('caremode')
                    $('#patient-info').css('display', 'block');
                    $('.brand-logo').text('Patient Details')
                }

                $("#view-mode > [data-value]").each(function() {
                    $(this).toggleClass("active", this.getAttribute("data-value") == type);
                });

                $("#view-clinical") [type == "graphs"      ? "show" : "hide"]();
                $("#view-parental") [type == "parent"      ? "show" : "hide"]();
                $("#view-table"   ) [type == "table"       ? "show" : "hide"]();
                $("#view-patients") [type == "patients"    ? "show" : "hide"]();
                $("#view-messages") [((type == "allmessages") || (type == "psmessages"))? "show" : "hide"]();
                $("#view-message")  [type == "message"     ? "show" : "hide"]();
                $("#view-map")      [type == "maps"        ? "show" : "hide"]();
                $("#view-questions")[type == "questions"   ? "show" : "hide"]();

                $("#patientlist-tab") [GC.chartSettings.role == "coordinator" ? "show" : "hide"]();

                var hidepatientspecific = (type == "patients" || type == "allmessages");
                var coord_patientspecific = (type == "maps" || type == "message" || type == "questions" || type == "psmessages");

                $("html")
                .toggleClass("has-patient-header", !GC.Preferences.prop("hidePatientHeader") || true)
                // TODO grapple with the preferences setting
                .toggleClass("view-clinical", type == "graphs" || type == "table")
                .toggleClass("view-parental", type == "parent")
                .toggleClass("view-charts", type == "graphs")
                .toggleClass("view-table", type == "table")
                .toggleClass("view-coord", hidepatientspecific)
                .toggleClass("view-coord-ps", coord_patientspecific);

                //hide parent tab
                if ( ! GC.Preferences._data.isParentTabShown) {
                    $("#parent-tab")["hide"]();
                    $("#view-parental")["hide"]();
                }

                //hide gc-specific headers
                $("#time-ranges") [(hidepatientspecific || coord_patientspecific) ? "hide" : "show"]();
                $("#info-bar")    [(hidepatientspecific || coord_patientspecific) ? "hide" : "show"]();
                // we keep the 2 different variables as there's a patient details header
                // (that is currently, somewhat incorrectly, not displaying in the gc app as a
                // result of funky preferences override

                setStageHeight();

                draw(type);
            });

            $("#view-mode > [data-value]").click(function() {
                GC.App.setViewType($(this).attr("data-value"));
            });

            // Time range tabs and Zoom In
            // =================================================================
            (function() {

                function updateTabRadioState() {
                    $(this).closest('label').toggleClass("active", this.checked);
                }

                function onTimeRangeTabChange() {
                    $(this).closest("#time-ranges").find("input").each(updateTabRadioState);
                }

                var selectedTab;

                var fitRange = GC.App.getFitRange();
                if (fitRange) {
                    $("#btn-fit-to-age input").attr("value", fitRange.join(":"));
                }

                $("#time-ranges label").each(function() {
                    var radio = $(this).find("input[type=radio]");
                    if (radio.length) {
                        $(this).bind("click", function() {
                            radio.prop("checked", true).triggerHandler("change");
                            selectedTab = this;
                            return false;
                        });
                    }
                });

                $('input:radio[name="time-range"]').change(function() {
                    var values = this.value.split(":");
                    setStartWeek(values[0], true);
                    setEndWeek(values[1]);
                    $("html").removeClass("zooming").trigger("togglezooming");
                });

                $("html").bind("set:weeks", function() {
                    var selected = $("#time-ranges label.active")[0];
                    if (selected && !selectedTab) {
                        selectedTab = selected;
                    }
                    $("#btn-toggle-zoom label").toggleClass("ui-state-disabled", !!selected);

                    $("#time-ranges label").each(function() {
                        $(this).toggleClass("intermediate", !selected && selectedTab === this);
                    });
                });

                $("#time-ranges input").bind("change.updateUI", onTimeRangeTabChange).each(onTimeRangeTabChange);

                $("#btn-toggle-zoom label").click(function() {
                    if ($(this).is(".ui-state-disabled")) {
                        return false;
                    }
                    if (selectedTab) {
                        $(selectedTab).trigger("click");
                    }
                    return true;
                });

            }());


            // Toggle settings button
            // =================================================================
            $(".settings-toggle").click(function() {
                $("body").toggleClass("settings-expanded");
                setStageHeight();
                draw();
            });

            // Choose primary and secondary datasets and related behaviors
            // =================================================================
            function onDataSetsChange() {
                var isDSPremature = (GC.DATA_SETS[PRIMARY_CHART_TYPE + "_LENGTH"]||{}).isPremature ||
                                    (GC.DATA_SETS[PRIMARY_CHART_TYPE + "_WEIGHT"]||{}).isPremature ||
                                    (GC.DATA_SETS[PRIMARY_CHART_TYPE + "_HEADC" ]||{}).isPremature ||
                                    (GC.DATA_SETS[PRIMARY_CHART_TYPE + "_BMI"   ]||{}).isPremature;

                $("#the-tab").toggleClass(
                    "double",
                    !!PRIMARY_CHART_TYPE && !!CORRECTION_CHART_TYPE
                );

                $("#tab-btn-right").attr(
                    "title",
                    $("#the-tab").is(".double") ?
                        "Leave only the left data source as primary" :
                        "Add secondary data source"
                );

                $("html").toggleClass("premature", !!isDSPremature);
            }

            // Swap dataSets
            $("#tab-btn-switch").click(function() {
                if (!!CORRECTION_CHART_TYPE) {
                    var d1 = PRIMARY_CHART_TYPE;
                    var d2 = CORRECTION_CHART_TYPE;
                    $("#secondary-ds").menuButton("value", d1);
                    $("#primary-ds").menuButton("value", d2);
                }
            });

            $("#tab-btn-left").click(function() {
                if (!!CORRECTION_CHART_TYPE) {
                    $("#primary-ds").menuButton("value", CORRECTION_CHART_TYPE, true);
                    $("#secondary-ds").menuButton("index", -1, true);
                    CORRECTION_CHART_TYPE = "";
                    BROADCASTER.trigger("set:primaryData", [PRIMARY_CHART_TYPE]);
                    BROADCASTER.trigger("set:secondaryData", [CORRECTION_CHART_TYPE]);
                    onDataSetsChange();
                }
            });

            $("#tab-btn-right").click(function() {

                if ($("#the-tab").is(".double")) {
                    // Remove secondary dataset
                    if (!!CORRECTION_CHART_TYPE) {
                        $("#secondary-ds").menuButton("index", -1, true);
                        CORRECTION_CHART_TYPE = "";
                        BROADCASTER.trigger("set:secondaryData", [""]);
                    }
                    $("#the-tab").removeClass("double");
                }
                // (enable to) Add secondary dataset
                else {
                    $("#the-tab").addClass("double");
                }

                this.title = $("#the-tab").is(".double") ? "Leave only the right data source as primary" : "Add secondary data source";
            });

            // Initial DS selection --------------------------------------------
            var ds;
            if (PATIENT.getCurrentAge().getYears() > 2) {
                ds = GC.chartSettings.defaultChart;
            } else {
                if (PATIENT.isPremature()) {
                    ds = GC.chartSettings.defaultPrematureChart;
                } else {
                    ds = GC.chartSettings.defaultBabyChart;
                }
            }
            $("#primary-ds").menuButton("value", ds);

            PRIMARY_CHART_TYPE = $("#primary-ds").bind("menubuttonchange", function(e, data) {
                PRIMARY_CHART_TYPE = data.value;
                onDataSetsChange();
                BROADCASTER.trigger("set:primaryData", [data.value]);
            }).menuButton("value");

            CORRECTION_CHART_TYPE = $("#secondary-ds").bind("menubuttonchange", function(e, data) {
                CORRECTION_CHART_TYPE = data.value;
                onDataSetsChange();
                BROADCASTER.trigger("set:secondaryData", [data.value]);
            }).menuButton("value");

            $("#the-tab").toggleClass("double", !!PRIMARY_CHART_TYPE && !!CORRECTION_CHART_TYPE);

            onDataSetsChange();

            // Automatically disable some dataset options if their data is not available
            // =============================================================
            function hasData(src) {
                var patient  = GC.App.getPatient(),
                    startAge = 0,
                    endAge   = 20,
                    gender;

                if (patient) {
                    startAge = 0;//GC.App.getStartAgeMos();
                    endAge   = 20 * 12; //GC.App.getStartAgeMos();
                    gender   = GC.App.getGender();

                    if (GC.getDataSet(src, "LENGTH", gender, startAge, endAge) ||
                        GC.getDataSet(src, "WEIGHT", gender, startAge, endAge) ||
                        GC.getDataSet(src, "HEADC" , gender, startAge, endAge) ||
                        GC.getDataSet(src, "BMI"   , gender, startAge, endAge)) {
                        return true;
                    }
                }
                return false;
            }

            $("#primary-ds, #secondary-ds").menuButton("forEachOption", function(o) {
                this.setIndexEnabled(o.index, hasData(o.value));
            });
            // =============================================================




            // checkbox-button
            // =================================================================
            $('[name="nicu"]').change(function() {
                GC.Preferences.prop("nicu", this.checked);
            }).prop("checked", GC.Preferences.prop("nicu")).triggerHandler("change");

            // gest-correction-treshold
            $('[name="gest-correction-treshold"]').stepInput({
                min : 25,
                max : 36,
                value : GC.Preferences.prop("gestCorrectionTreshold"),
                format : function(val) {
                    return "< " + val + " Weeker";
                },
                change : function(e, d) {
                    GC.Preferences.prop("gestCorrectionTreshold", d.value);
                },
                parse : function(val) {
                    return GC.Util.floatVal(
                        String(val).replace(/^\s*<\s*/, "")
                    );
                }
            });

            // Uncomment the following if [name="gest-correction-treshold"] should be initialy disabled on FENTON
            //onDataSetsChange();

            // Mid. parental height
            // =================================================================
            // Display Mid. Parental Height
            function renderMidParentalHeight() {
                $('[name="mid-height"]').val(PATIENT.midParentalHeight ? GC.Util.format(PATIENT.midParentalHeight, {
                    type : "height"
                }) : "N/A");
            }

            renderMidParentalHeight();

            $('[name="fader-height"]').stepInput({
                min : 100,
                max : 220,
                value : PATIENT.familyHistory.father.height || "",
                format : function(value) {
                    return GC.Util.format(value, {
                        type : "height",
                        system : "metric"
                    });
                },
                change : function(e, d) {
                    PATIENT.setFamilyHistory({
                        father : {
                            height : d.value
                        }
                    });
                }
            });

            $('[name="mother-height"]').stepInput({
                min : 100,
                max : 220,
                value: PATIENT.familyHistory.mother.height || "",
                format : function(value) {
                    return GC.Util.format(value, {
                        type : "height",
                        system : "metric"
                    });
                },
                change : function(e, d) {
                    PATIENT.setFamilyHistory({
                        mother : {
                            height : d.value
                        }
                    });
                }
            });

            $('[name="bio-father"], [name="bio-mother"]').each(function() {
                $(this).change(function() {
                    var _history = {};
                    if (this.name == "bio-father") {
                        _history.father = {
                            isBio : this.checked
                        };
                    } else {
                        _history.mother = {
                            isBio : this.checked
                        };
                    }
                    PATIENT.setFamilyHistory(_history);
                });
            });

            $("html").bind("change:patient:familyhistory", function() {
                $('[name="mother-height"]').stepInput("value", PATIENT.familyHistory.mother.height || "");
                $('[name="fader-height"]').stepInput("value", PATIENT.familyHistory.father.height || "");
                $('[name="bio-father"]').prop("checked", !!PATIENT.familyHistory.father.isBio);
                $('[name="bio-mother"]').prop("checked", !!PATIENT.familyHistory.mother.isBio);
                renderMidParentalHeight();
                $("#not-bio-parents-info")[!PATIENT.midParentalHeight ? "show" : "hide"]();
            });

            // PATIENT inputs
            // =================================================================

            BROADCASTER.bind("change:patient", renderPatient);

            GC.Preferences.bind("set", function(e) {
                if (e.data.path.indexOf("timeInterval") === 0) {
                    renderPatient();
                }
            });

            // DOB -------------------------------------------------------------
            $('[name="DOB"]').val(PATIENT.DOB ? PATIENT.DOB.toString(GC.chartSettings.dateFormat) : "").datepicker({
                dateFormat : GC.Util.cDateFormatToJqFormat(GC.chartSettings.dateFormat)
            }).change(function() {
                PATIENT.setDOB($(this).datepicker("getDate"));
            });

            // EDD -------------------------------------------------------------
            $('[name="EDD"]').val(PATIENT.EDD ? PATIENT.EDD.toString(GC.chartSettings.dateFormat) : "").datepicker({
                dateFormat : GC.Util.cDateFormatToJqFormat(GC.chartSettings.dateFormat)
            }).change(function() {
                PATIENT.setEDD($(this).datepicker("getDate"));
            });

            // Update the date format on the date pickecrs in case that pref.
            // has been changed
            GC.Preferences.bind("set:dateFormat", function(e) {
                var format = e.data.newValue;
                $('[name="DOB"]').datepicker("option", "dateFormat", GC.Util.cDateFormatToJqFormat(format)).val(PATIENT.DOB.toString(format));

                if (PATIENT.EDD) {
                    $('[name="EDD"]').datepicker("option", "dateFormat", GC.Util.cDateFormatToJqFormat(format)).val(PATIENT.EDD.toString(format));
                }
            });

            // Color corrections
            // =================================================================
            function setChartColors(chartName, color) {
                GC.Preferences.prop(chartName + ".color", color);
                GC.Preferences.prop(chartName + ".fillRegion.fill", color);
                GC.Preferences.prop(chartName + ".lines.stroke", GC.Util.darken(color, 80));
                GC.Preferences.prop(chartName + ".axis.stroke", GC.Util.darken(color, 90));
                GC.Preferences.prop(chartName + ".axisLabels.fill", GC.Util.darken(color, 70));
                GC.Preferences.prop(chartName + ".pointsColor", GC.Util.darken(color, 70));
                GC.Preferences.prop(chartName + ".problemRegion.fillColor", color);
            }

            var colorPresets = GC.chartSettings.colorPrresets, colorOptions = [];
            $.each(colorPresets, function(name) {
                colorOptions.push('<option value="' + name + '">' + name + '</option>');
            });

            $('[name="color-preset"]').html(colorOptions.join("\n")).change(function() {
                var presetName = $(this).val(), presetValue = GC.chartSettings.colorPrresets[presetName];

                setChartColors("lengthChart", presetValue.Length);
                setChartColors("weightChart", presetValue.Weight);
                setChartColors("headChart", presetValue["Head C"]);
                setChartColors("bodyMassChart", presetValue.BMI);
                GC.Preferences.prop("selectionLine.stroke", presetValue["Primary selection"]);
                GC.Preferences.prop("hoverSelectionLine.stroke", presetValue["Secondary selection"]);
                GC.Preferences.prop("currentColorPreset", presetName);
                GC.styleGenerator.refresh();

            }).val(GC.Preferences.prop("currentColorPreset"));

            $(".add-entry").click(function() {
                if (!$(this).is(".ui-state-disabled")) {
                    GC.App.addEntry();
                }
            });

            // =================================================================
            // Ends Datatable temp. code

            // pctz ------------------------------------------------------------
            Widget({
                model : GC.Preferences,
                path : "pctz",
                view : $('[name="pctz"]'),
                type : GC.DataType.STRING
            });

            // metrics ---------------------------------------------------------
            Widget({
                model : GC.Preferences,
                path : "metrics",
                view : $('[name="metrics"]'),
                type : GC.DataType.STRING
            });

            // aspectRatio -----------------------------------------------------
            Widget({
                model : GC.Preferences,
                path : "aspectRatio",
                view : $('[name="aspectRatio"]'),
                type : GC.DataType.FLOAT
            });

            // maxWidth --------------------------------------------------------
            Widget({
                model : GC.Preferences,
                path : "maxWidth",
                view : $('[name="maxWidth"]'),
                type : GC.DataType.INT,
                changeEvent : "blur"
            });

            // gestCorrectionType ----------------------------------------------
            Widget({
                model : GC.Preferences,
                path : "gestCorrectionType",
                view : $('[name="gest-correction-type"]'),
                type : GC.DataType.STRING,
                changeEvent : "change"
            });

            // Std. Velocity ---------------------------------------------------
            Widget({
                model : GC.Preferences,
                path : "roundPrecision.velocity.nicu",
                view : $('[name="roundPrecision.velocity.nicu"]'),
                type : GC.DataType.STRING,
                changeEvent : "change"
            });
            Widget({
                model : GC.Preferences,
                path : "roundPrecision.velocity.std",
                view : $('[name="roundPrecision.velocity.std"]'),
                type : GC.DataType.STRING,
                changeEvent : "change"
            });

            // fontSize --------------------------------------------------------
            $('[name="fontSize"]').stepInput({
                min : 11,
                max : 16,
                step : 1,
                precision : 1,
                value : GC.Preferences.prop("fontSize"),
                format : function(value) {
                    return GC.Util.intVal(value) + "px";
                },
                change : function(e, d) {
                    GC.Preferences.prop("fontSize", d.value);
                }
            });

            $("html").bind("appSelectionChange changepatientdata", showLastRecOrSelection);

            $("#edit-enabled").change(function() {
                togglePatientEditable(this.checked);
            });

            done();
        }

        function showLastRecOrSelection() {

            var lastRec = PATIENT.getLastModelEntry(),
                rec = GC.SELECTION.selected.record || lastRec,
                date,
                age;

            if (!rec) {
                $(".last-recording").hide();
                return;
            }

            date = (new XDate(PATIENT.DOB)).addMonths(rec.agemos);

            age = new GC.TimeInterval(PATIENT.DOB, date);

            $(".last-recording").show().find("> span").html(
                rec === lastRec ?
                GC.str("STR_6047") :
                GC.str("STR_6048")
            );

            // Display the last-recording date
            $(".last-recording .date").text(date.toString(GC.chartSettings.dateFormat));

            // Display the last-recording age
            $(".last-recording .age").text(age.toString(GC.chartSettings.timeInterval));
        }

        function setUIValues(done) {

            // fontFamily
            GC.Preferences.bind("set:fontFamily", function(e) {
                $("body").css("fontFamily", e.data.newValue);
            });
            $("body").css("fontFamily", GC.chartSettings.fontFamily);

            // fontSize
            GC.Preferences.bind("set:fontSize", function(e) {
                $("body").css("fontSize", e.data.newValue);
                setStageHeight();
            });
            $("body").css("fontSize", GC.chartSettings.fontSize);

            // Display app version
            $(".version").text(GC.chartSettings.version.asString());

            GC.Preferences.bind("set:dateFormat", showLastRecOrSelection);

            togglePatientEditable(GC.chartSettings.patientFamilyHistoryEditable);
            togglePatientDataEditable(GC._isPatientDataEditable);

            done();
        }

        function loadDataSets(done) {

            //Chart growth chart curves data ranges are in the local json file gccurvedatajson.txt
            //this jquery ajax call will read that file async, and then parse it into the needed structure
            $.ajax({
                url: "GCCurveDataJSON.txt",
                dataType: "text",
                success: function (data) {
                    try {
                        GC.DATA_SETS = JSON.parse(data);
                    }
                    catch (exc) {
                        console.log("error reading curve data from JSON file." +" \n" + exc);
                    }

                    // =========================================================================
                    // Preprocess the data (sort by age, remove dublicates, etc.)
                    (function() {

                        function sortByAge(a, b) {
                            return a.Agemos - b.Agemos;
                        }

                        function cleanUp( data ) {
                            var len = data.length, i, prev, cur;
                            for ( i = 1; i < len; i++ ) {
                                prev = data[ i - 1 ];
                                cur  = data[ i ];

                                // smooth for data interval under 1 month
                                if ( Math.abs(prev.Agemos - cur.Agemos) < 1 ) {
                                    prev.value = (prev.value + cur.value) / 2;
                                    data.splice( i, 1 );
                                    i--;
                                    len--;
                                }
                            }
                        }

                        var ds, x, genders = { male : 1, female : 1 }, gender, type, key, group;
                        for ( x in GC.DATA_SETS ) {
                            for ( gender in genders ) {
                                ds = GC.DATA_SETS[x].data[gender];
                                type = Object.prototype.toString.call(ds);

                                if ( type == "[object Array]" ) {
                                    ds.sort(sortByAge);
                                }
                                else if ( type == "[object Object]" ) {
                                    for ( key in ds ) {
                                        group = ds[key];

                                        group.sort(sortByAge);

                                        cleanUp( group );
                                        GC.DATA_SETS[x].data[gender][key] = group;
                                    }
                                }
                            }
                        }
                    }());
                    // =========================================================================

                    //continue processing...
                    done();
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.log("error loading curve data from JSON file.\n" + jqXHR.status + " " + textStatus + " " + errorThrown);
                }
            });
        }

        setStageHeight();
        NS.Util.translateHTML();

        QUEUE.add(NS.str("STR_LoadingCurveData"),loadDataSets);

        QUEUE.add(NS.str("STR_LoadingData"), loadData);

        QUEUE.add(NS.str("STR_PreloadImages"), function(done) {
            $.each(imagesToPreload, function(i, src) {
                var img = new Image();
                img.src = src;
            });
            done();
        });

        QUEUE
            .add(NS.str("STR_SetInitialState"), setInitialState)
            .add(NS.str("STR_InitializeUIControls"), initUIControls)
            .add(NS.str("STR_SetUIValues"), setUIValues)
            .add(NS.str("STR_NotifyAppReady"), function(done) {
                BROADCASTER.trigger("appready");
                done();
            })
            .add(NS.str("STR_RenderSVG"), render)
            .add(NS.str("STR_AllDone"), function(done) {
                done();
            });

        QUEUE.start();
    });

    return NS;

}

gc_app_js(GC, jQuery);
