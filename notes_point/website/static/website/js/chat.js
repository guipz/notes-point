$(() => {

    let chatsListDOMElement = $("#chats-list");
    let chatViewDOMElement = $("#chat-view");
    let messageContainerTemplateDOMElement = $("#message-id-container");
    let chatItemTemplateDOMElement = $("#chat-id-item");
    let returnButtonDOMElement = $("#chat-view-return-button")
    let returnButton = new ReturnButton(returnButtonDOMElement);
    let chatView = new ChatView(chatViewDOMElement, 
        messageContainerTemplateDOMElement);
    let chatsList = new ChatsList(chatsListDOMElement,
        chatItemTemplateDOMElement);
    setupPageChatFlow(chatsList, chatView, returnButton);
    showNewChatModalIfNecessary(chatsList, chatView);
    chatsList.showOnSmallScreen();
    showChatViewIfNecessary(chatView, chatsList);
});

function setupPageChatFlow(chatsList, chatView, returnButton) {
    chatsList.setOnChatItemClickListener(id => {
        chatView.openChatbyId(id);
        chatView.showOnSmallScreen();
        chatsList.hideOnSmallScreen();
    });
    chatsList.showChats();
    chatView.setOnSuccessSendMessageListener(() => {
        chatsList.showChats();
    });
    returnButton.setOnReturnButtonClickListener(() => {
        chatView.hideOnSmallScreen();
        chatsList.showOnSmallScreen();
    });
};

function showNewChatModalIfNecessary(chatsList, chatView) {
    let paramName = "new_chat_note_id";
    let newChatUrlParameter = getUrlParameterValueByName(paramName);
    if (newChatUrlParameter) {
        let newChatModalDOMElement = $("#new-chat-modal");
        let newChatModal = new NewChatModal(newChatModalDOMElement);
        newChatModal.setNewChatFormNoteId(newChatUrlParameter);
        newChatModal.setOnSuccessNewChatFormListener(id => {
            chatsList.showChats();
            chatView.openChatbyId(id);
            chatView.showOnSmallScreen();
            chatsList.hideOnSmallScreen();
            removeUrlParameter(paramName);
        });
        newChatModal.setOnFailureNewChatFormListener(() => {
            chatView.showFailMessage(
                "Error while creating chat","Try again later");
            removeUrlParameter(paramName);
            chatView.showOnSmallScreen();
            chatsList.hideOnSmallScreen();
        });
        newChatModal.show();
    };
};

function showChatViewIfNecessary(chatView, chatsList) {
    let paramName = "open_chat_id";
    let paramValue = getUrlParameterValueByName(paramName);
    if (paramValue) {
        chatView.openChatbyId(paramValue);
        removeUrlParameter(paramName);
        chatView.showOnSmallScreen();
        chatsList.hideOnSmallScreen();
    }; 
};

function truncateWithEllipsis(text, max_length) {
    // Cut text if bigger than max_length, adding trailing ellipsis.
    return max_length < text.length ? `${
        text.slice(0, max_length)}...` : text;
};

function getUrlParameterValueByName(name) {
    let urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
};

function removeUrlParameter(name) {
    let urlParams = new URLSearchParams(window.location.search);
    urlParams.delete(name);
    // Push new url to the history to prevent creating chat again on page refresh.
    window.history.pushState(null, '', 
    window.location.origin + 
    window.location.pathname + 
    `?${urlParams.toString()}`);
};

function errorMessageDiv(title_text, subtitle_text) {
    let div = $("<div class='m-5'></div>");
    let title = $(`<h2 class='text-center'>${title_text}</h2>`);
    let subtitle = $(`<h5 class='text-center'>${subtitle_text}</h5>`);
    div.append(title);
    div.append(subtitle);
    return div;
};
 

class ChatsList {
    
    constructor(chatsListDOMElement, chatItemTemplateDOMElement) {
        this._$chatsList = chatsListDOMElement;
        this._$chatItemTemplate = chatItemTemplateDOMElement;
    };

    setOnChatItemClickListener(listener) {
        this._onChatItemClickListener =  listener;
    };
    

    showChats() {
        this.cleanChatList();
        this.getChatsInfo().done(response => {
            let chats = this.sortChatsByLastActivity(response.content)
            this.cleanChatList();
            this.placeChatsInChatsList(chats);
        }).fail(() => {
            this.cleanChatList();
            this.showFailMessage("Error while getting chats", 
                "Try again later");
        });
    };

    sortChatsByLastActivity(chats) {
        return chats.sort((a,b) => {
            if(a.last_activity > b.last_activity) {
                return -1;
            }
            if (a.last_activity < b.last_activity) {
                return 1;
            }
            return 0;
        });
    };

    showFailMessage(title, subtitle) {
        this._$chatsList.append(errorMessageDiv(title, subtitle));
    };

    showOnSmallScreen() {
        this._$chatsList.removeClass("d-none");
    };

    hideOnSmallScreen() {
        this._$chatsList.addClass("d-none");
    };

    cleanChatList() {
        this._$chatsList.empty();
    };

    getChatsInfo() {
        return $.get({url:"/api/chat/my-chats/", timeout:15000});
    };

    createChatItem(chat) {

        let chatItem = this._$chatItemTemplate.clone();
        let chatNoteText = chatItem.find("#chat-id-note-text");
        let chatLastMessageText = chatItem.find("#chat-id-last-message-text");
        let chatLastMessageDate = chatItem.find("#chat-id-last-message-date");
        chatItem.attr("id", chatItem.attr("id").replace("id", chat.chat_id));
        chatNoteText.attr("id", chatNoteText.attr("id").replace("id", chat.chat_id));
        chatLastMessageDate.attr("id", chatLastMessageDate.attr("id").replace("id", chat.chat_id));
        chatLastMessageText.attr("id", chatLastMessageText.attr("id").replace("id", chat.chat_id));
        let prefixChatNoteText = chatNoteText.data("prefix");
        chatNoteText.text(`${prefixChatNoteText}${truncateWithEllipsis(chat.note_message, 15)}`);
        chatLastMessageDate.text(chat.last_activity);
        let prefixChatLastMessageText = chatLastMessageText.data("prefix"); 
        chatLastMessageText.text(`${prefixChatLastMessageText}
            ${truncateWithEllipsis(chat.last_message_content, 15)}`);

        chatItem.on("click", () => this._onChatItemClickListener(chat.chat_id));

        return chatItem;
    };

    placeChatsInChatsList(chats) {
        for(let chat of chats) {
            let chatItem = this.createChatItem(chat);
            this._$chatsList.append(chatItem);
        };
    };

}

class ChatView {

    constructor(chatViewDOMElement, messageContainerTemplateDOMElement) {
        this._$chatView = chatViewDOMElement;
        this._$chatViewMessagesContainer = this._$chatView.find(
            "#chat-view-messages-container");
        this._$messageContainerTemplate = messageContainerTemplateDOMElement;
        this._$chatViewMessageForm = this._$chatView.find("#chat-view-message-form");
        this._$sendMessageButton = this._$chatView.find("#chat-view-send-button");
        this._$chatViewMessageForm.on("submit", e => {
            this.onSubmitChatViewMessageForm(e);
        })
        this.setDisabledMessageField(true);
    };

    setOnSuccessSendMessageListener(listener) {
        this._onSuccessSendMessageListener = listener;
    };

    onSubmitChatViewMessageForm(e) {
        e.preventDefault();
        let url = this._$chatViewMessageForm.attr("action");
        let data = this._$chatViewMessageForm.serialize();
        this.cleanChatViewMessageForm();
        $.post({url:url, data:data, timeout: 15000}).done(() => {
            this.refreshChatView();
            this._onSuccessSendMessageListener();
        }).fail(() => {
            this.cleanChatViewContainer();
            this.showFailMessage("Error while submiting message", 
                "Try again later");
            this.scrollToBottomChatView();
        });
    };

    cleanChatViewMessageForm() {
        this._$chatViewMessageForm.find(
            "#chat-view-message-form-content").val("");
    };

    openChatbyId(id) {
        this.getChatMessages(id)
            .done(response => {
                this.cleanChatViewContainer();
                this.placeMessagesInChatViewContainer(response.content);
                this.setChatViewMessageFormChatId(id);
                this.scrollToBottomChatView();
                this.setDisabledMessageField(false);
            }).fail(() => {
                this.cleanChatViewContainer();
                this.showFailMessage("Error while opening chat", 
                    "Try again later");
                this.scrollToBottomChatView();
            });
    };

    showFailMessage(title, subtitle) {
        this._$chatViewMessagesContainer.append(
            errorMessageDiv(title,subtitle));
    };

    setDisabledMessageField(state) {
        let field = this._$chatViewMessageForm.find(
            "#chat-view-message-form-content")
        field.attr("disabled", state);
    };

    cleanChatViewContainer() {
        this._$chatViewMessagesContainer.empty();
    };

    scrollToBottomChatView() {
        this._$chatView.scrollTop(0);
        this._$chatView.scrollTop(9999999);
    };

    showOnSmallScreen() {
        this._$chatView.removeClass("d-none");
    };

    hideOnSmallScreen() {
        this._$chatView.addClass("d-none");
    };

    refreshChatView() {
        let id = this._$chatViewMessageForm.find(
            "#chat-view-message-form-chat-id").val();
        this.openChatbyId(id);
    };

    setChatViewMessageFormChatId(id) {
        this._$chatViewMessageForm.find(
            "#chat-view-message-form-chat-id").val(id);
    };

    getChatMessages(id) {
        return $.get({
            url:`/api/chat/messages/${id}/`,
            timeout: 15000
        });
    };

    placeMessagesInChatViewContainer(messages) {
        for (let message of messages) {
            let messageContainer = this.createMessage(message);
            this._$chatViewMessagesContainer.append(messageContainer);
        };
    };

    createMessage(message) {
       let messageContainer =  this._$messageContainerTemplate.clone();
       let messageText = messageContainer.find("#message-id-text");
       let messageDate = messageContainer.find("#message-id-date");
       messageContainer.attr("id", messageContainer.attr("id").replace("id", message.id));
       messageText.attr("id", messageText.attr("id").replace("id", message.id));
       messageDate.attr("id", messageDate.attr("id").replace("id", message.id));
       messageText.text(message.content);
       messageDate.text(message.creation);
       let from_self_class = messageContainer.data("from-self-class");
       message.is_from_self ? messageContainer.attr("class", from_self_class) : null;
       
       return messageContainer;
    };

};

class NewChatModal {

    constructor($newChatModalDOMElement) {
        this._$newChatModal = $newChatModalDOMElement;
        this._$newChatForm = this._$newChatModal.find("#new-chat-form");
        this._bootstrapWrapper = new bootstrap.Modal(this._$newChatModal);
        this._$newChatForm.on("submit", e => {
            this.onSubmitNewChatForm(e);
        });
    };

    setOnSuccessNewChatFormListener(listener) {
        this._onSuccessNewChatFormListener = listener;
    };

    setOnFailureNewChatFormListener(listener) {
        this._onFailureNewChatFormListener = listener;
    };

    cleanNewChatForm() {
        this._$newChatForm.find(
            "#chat-view-message-form-content").val("");
    };

    onSubmitNewChatForm(e) {
        e.preventDefault();
        let url = this._$newChatForm.attr("action");
        $.post({
            url:url,
            timeout:15000,
            data: this._$newChatForm.serialize()
        }).done(response => {
            this._onSuccessNewChatFormListener(
                response.content.chat_id);
            this.hide();
        }).fail(() => {
            this._onFailureNewChatFormListener();
            this.hide();
        });
        this.cleanNewChatForm();
    };

    setNewChatFormNoteId(id) {
        this._$newChatForm.find("#new-chat-form-chat-id").val(id);
    };

    show() {
        this._bootstrapWrapper.show();
    };

    hide() {
        this._bootstrapWrapper.hide();
    };

};

class ReturnButton {

    constructor(returnButton) {
        this._$returnButton = returnButton;
        this._$returnButton.on("click", () => {
            this._onReturnButtonClickListener();
        });
    };

    setOnReturnButtonClickListener(listener) {
        this._onReturnButtonClickListener = listener;
    };
        
};