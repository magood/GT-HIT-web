(function() {

    var root = $("#preferences-editor");

    var $dialog = root.closest("#dialog").dialog("option", "close", function() {
        $("#header").unmask();
    });

    var message_body = $( "#message-body");
    //message_body.text("your text here");
    renderMessageView(message_body);

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

        var referralreferences = []
        function mergeHTML(messageResult) {
            console.log("mergeHTML from message-detail.js");
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
            var content = (messageResult.payload && messageResult.payload.length && messageResult.payload[0].contentString) ? messageResult.payload[0].contentString : "";
            var request_detail = (messageResult.requestDetail) ?
                                ((messageResult.requestDetail.reference) ?
                                    messageResult.requestDetail.reference + " " : "") +
                                ((messageResult.requestDetail.display) ?
                                    messageResult.requestDetail.display : "") : "";
            //build a template the easy way first:
            var template = $("\
<div class='message-wrap'>\
<div class='message-id'><span class='msg-detail-heading'>ID: </span><span class='message-id-value'></span></div>\
<div class='message-sender'><span class='msg-detail-heading'>From: </span><span class='message-sender-value'></span></div>\
<div class='message-recipient'><span class='msg-detail-heading'>To: </span><span class='message-recipient-value'></span></div>\
<div class='message-category'><span class='msg-detail-heading'>Category: </span><span class='message-category-value'></span></div>\
<div class='btn btn-lg btn-link message-subject'><span class='msg-detail-heading'>Subject: </span><span class='message-subject-value'></span></div>\
<div class='message-content well'><span class='message-content-value'></span></div>\
<div class='message-sent-time'><span class='msg-detail-heading'>Sent: </span><span class='message-sent-time-value'></span></div>\
<div class='message-rec-time'><span class='msg-detail-heading'>Received: </span><span class='message-rec-time-value'></span></div>\
<div class='message-encounter'><span class='msg-detail-heading'>Encounter: </span><span class='message-encounter-value'></span></div>\
<div class='message-moredetail well'><span id='referral-detail'></span></div>\
<div class='message-buttons'>\
    <div class='btn btn-info' id='accept-referral'>Accept Referral</div>\
    <div class='btn btn-info' id='send-questions'>Send Questionnaire</div>\
    <div class='btn btn-info' id='send-referral-notification'>Send Resource Referral Notification</div>\
</div>\
</div>\
");
            //tack on the values. Styles in message-style.css.
            $(".message-id", template).hide();
            $(".message-sender-value", template).text(sender);
            $(".message-recipient-value", template).text(recipient);
            $(".message-category-value", template).text(category);
            $(".message-subject-value", template).text(subject ? subject : "(no subject)");
            $(".message-subject-value", template).click(function() {
                if (!subject) return;
                var patient_id_match = subject.match(/Patient\/(.*)/);
                if (!patient_id_match) return;
                window.sessionStorage.setItem('patient_id', patient_id_match[1]);
                call_load_functions_js();
                GC.get_data();
                GC.App.setViewType("psmessages");
            });

            
            $(".message-sent-time-value", template).text(sent_time);

            if (content && content != "")
                $(".message-content-value", template).text(content);
            else
                $(".message-content", template).hide();
            if (rec_time && rec_time != "")
                $(".message-rec-time-value", template).text(rec_time);
            else
                $(".message-rec-time", template).hide();
            if (encounter && encounter != "")
                $(".message-encounter-value", template).text(encounter);
            else
                $(".message-encounter", template).hide();
            $(".message-moredetail", template).hide();

            themessage.append(template);

            if (!content || content.indexOf("referralRequest for Patient/") != 0) {
                $("#accept-referral").hide();
            } else {
                $("#accept-referral").hide();
                var therefreq = ((messageResult.payload && messageResult.payload[1] &&
                                    messageResult.payload[1].contentReference &&
                                    messageResult.payload[1].contentReference.reference) ?
                                        messageResult.payload[1].contentReference.reference : "");
                if (therefreq != "") {
                    referralreferences[0] = therefreq;
                    $.ajax({
                        url: GC.chartSettings.serverBase + "/" + therefreq,
                        type: "GET",
                        async: false,
                        global: false,
                        dataType: 'json',
                        success: function(data) {
                            console.log(data);
                            $("#referral-detail")
                                .html("<i>Referral Request for</i> <b>" +
                                        ((data.patient && data.patient.display) ?
                                            data.patient.display :
                                            "<i>UNKNOWN</i>") +
                                        "</b> STATUS: <b id='status-content-location'>" +
                                        data.status.toUpperCase() +
                                        "</b><br />" + data.description).show();
                            $(".message-moredetail", template).show();
                            if (data.status == "requested") {
                                $("#accept-referral").show();
                                referralreferences[1] = data;
                            }
                        },
                        contentType: 'application/json'
                    });
                }
                $("#accept-referral")
                    .click(function() {
                        var p_id = content.substring(28).match(/[A-Za-z0-9\-\.]{1,64}/);
                        var p_display = ((messageResult.subject && messageResult.subject.display) ? messageResult.subject.display : "");
                        var recipient_details = messageResult.sender;
                        var req_id = messageResult.payload[1].contentReference.reference.match(/ReferralRequest\/([A-Za-z0-9\-\.]{1,64})/)[1];
                        acceptReferral(p_id, p_display, recipient_details, id, req_id);
                    });
            }
            $("#send-questions")
                .click(function() {
                    alert("click send questions");
                });
            $("#send-referral-notification")
                .click(function() {
                    alert("click send referral notification");
                });
        }

        function acceptReferral(patient_id, patient_name, recipient_details, message_id, request_id) {
            console.log('acceptReferral');
            var thecomm = {
                resourceType: "Communication",
                text:{
                    status: "generated",
                    div: "<div>the childhood obesity patient coordinator has accepted your referralRequest</div>"
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
                        recipient_details,
                        {
                            reference: 'Patient/' + patient_id,
                            display: patient_name
                        }
                ],
                payload: [
                    {
                        contentString: "Your referralRequest for Patient/" + patient_id + " status is now 'accepted'\n" +
                                        "following your message id Communication/" + message_id
                    },
                    {
                        contentReference: {
                            reference: "ReferralRequest/" + request_id
                        }
                    }
                ],
                status: "pending",
                sent: moment().format(),
                subject: {
                    reference: "Patient/" + patient_id,
                    display: patient_name
                }
            };
            console.log(thecomm);
            console.log(JSON.stringify(thecomm));
            $.ajax({
                url: GC.chartSettings.serverBase + "/Communication",
                type: "POST",
                async: false,
                global: false,
                data: JSON.stringify(thecomm),
                dataType: 'json',
                success: function(data) {
                    alert('referral acceptance message sent!');
                    console.log(data);
                    $("#accept-referral").hide();
                },
                contentType: 'application/json'
            });
            referralreferences[1].status = "accepted";
            delete referralreferences[1].meta;
            console.log(referralreferences);
            $.ajax({
                url: GC.chartSettings.serverBase + "/" + referralreferences[0],
                type: "PUT",
                async: false,
                global: false,
                data: JSON.stringify(referralreferences[1]),
                dataType: 'json',
                success: function(data) {
                    console.log(data);
                    $("#status-content-location").text("ACCEPTED");
                },
                contentType: 'application/json'
            });
        }
    }

}());
