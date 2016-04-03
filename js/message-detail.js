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

}());
