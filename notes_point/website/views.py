from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from django.views.decorators.http import (require_GET, require_http_methods,
                                          require_POST)

from .decorators import login_required_json
from .forms import (ChatCreationForm, ChatMessageCreationForm,
                    NoteCreationForm, UserSignInForm, UserSignUpForm)
from .json_responses import default_response_template
from .models import Chat, Note, ChatMessage
from .templatetags.website_extras import datetime_to_iso


@require_GET
def homepage(request: HttpRequest) -> HttpResponse:
    return render(request, "website/homepage.html")


@login_required
def map(request: HttpRequest) -> HttpResponse:
    return render(request, "website/map.html")


@require_http_methods(["GET", "POST"])
def sign_up(request: HttpRequest) -> HttpResponse:

    user_sign_up_form = UserSignUpForm()

    # If the user is already logged, redirect to map page. 
    if request.user.is_authenticated:
        return redirect(reverse("map"))
    if request.method == "POST":
        user_sign_up_form = UserSignUpForm(request.POST)

        if user_sign_up_form.is_valid():
            user = user_sign_up_form.save()
            login(request, user)

            return redirect(reverse("map"))

    return render(request, "website/sign_up.html", {
        "form": user_sign_up_form
        })


@require_http_methods(["GET", "POST"])
def sign_in(request: HttpRequest) -> HttpResponse:
    
    user_sign_in_form = UserSignInForm()

    # If the user is already logged, redirect to map page. 
    if request.user.is_authenticated:
        return redirect(reverse("map"))
    
    if request.method == "POST":
        user_sign_in_form = UserSignInForm(request.POST)

        if user_sign_in_form.is_valid():
            # Get user object for this form credentials.
            user = user_sign_in_form.get_user()
            login(request, user)
            
            return redirect(reverse("map"))

    return render(request, "website/sign_in.html", {
        "form": user_sign_in_form
        })


@require_GET
def sign_out(request: HttpRequest) -> HttpResponse:
    logout(request)
    return redirect(reverse("homepage"))


@require_POST
@login_required_json
def create_note(request: HttpRequest) -> JsonResponse:

    note_creation_form = NoteCreationForm(request.POST)

    if note_creation_form.is_valid():
        note = note_creation_form.save(commit=False)
        # Assigning note creator.
        note.creator = request.user
        note.save()

        response = JsonResponse(
            default_response_template(message="note created."))
    else:
        response = JsonResponse(
            default_response_template(
                message="note creation failed."), status=400)

    return response


@require_GET
@login_required_json
def get_active_notes_locations(request: HttpRequest) -> JsonResponse:
    active_notes = Note.objects.actives()
    # Getting only the values necessary to place the markers in the map.
    active_notes_values = active_notes.values("id", "latitude", "longitude")
    active_notes_dict = [note for note in active_notes_values]

    return JsonResponse(
        default_response_template(
            content=active_notes_dict, message="all active notes found."))


@require_GET
@login_required_json
def get_active_note_data(request: HttpRequest, id) -> JsonResponse:
    try:
        note = Note.objects.actives().get(id=id)
    except Note.DoesNotExist:
        return JsonResponse(
            default_response_template(
                message="no active note found for provided id."), status=400)
    
    from_self = request.user == note.creator

    note_data = {
        "message": note.message, 
        "duration": datetime_to_iso(note.duration),
        "note_id": note.id,
        "from_self": from_self,
        }
    
    if not from_self:
        try:
            chat_id = Chat.objects.get(participants=request.user, note__id=id).pk
            note_data["chat_id"] = chat_id
        except Chat.DoesNotExist:
            pass
    
    return JsonResponse(
        default_response_template(content=note_data, message="note found."))



@require_GET
@login_required
def my_notes(request: HttpRequest) -> HttpResponse:
    # Getting actives notes for the user and ordering descending
    user_notes = Note.objects.actives().filter(creator=request.user).order_by("-creation")

    return render(request, "website/my_notes.html", {
        "notes": user_notes
    })


@require_GET
@login_required
def chat(request: HttpRequest) -> HttpResponse:
    return render(request, "website/chat.html")


@require_POST
@login_required_json
def new_chat(request: HttpRequest) -> JsonResponse:
    # Creating forms
    chat_creation_form = ChatCreationForm(request.POST)

    # Ignoring error because this will never be an AnonymousUser type,
    # as we are using the login_required annotation.
    chat_creation_form.set_request_user(request.user) # type: ignore
    if chat_creation_form.is_valid():
        new_chat = chat_creation_form.save()

        new_message_content = chat_creation_form.cleaned_data["content"]
        new_message = ChatMessage(
            content=new_message_content,
            creator=request.user,
            chat=new_chat)
        
        new_message.save()

        content = get_chat_viewable_data(new_chat)

        response = JsonResponse(default_response_template(
            message="chat created.", content=content))
    else:
        response = JsonResponse(default_response_template(
            message="chat creation failed."), status=400)

    return response


@require_GET
@login_required_json
def my_chats(request: HttpRequest) -> JsonResponse:
    chats = Chat.objects.filter(participants=request.user)
    viewable_data = []
    for chat in chats:
        chat_data = get_chat_viewable_data(chat)
        viewable_data.append(chat_data)
    return JsonResponse(
        default_response_template(content=viewable_data, message="all chats found."))


def get_chat_viewable_data(chat):
    last_message = chat.last_message()
    chat_data = {
            "last_activity": datetime_to_iso(last_message.creation),
            "chat_id": chat.pk,
            "last_message_content": last_message.content,
            "note_message": chat.note.message,
            "note_id": chat.note.id
            }
        
    return chat_data



@require_GET
@login_required_json
def get_chat_messages(request: HttpRequest, id) -> JsonResponse:
    try:
        chat = Chat.objects.get(id=id, participants=request.user)
    except Chat.DoesNotExist:
        return JsonResponse(
            default_response_template(
                message="no ingressed chat for provided id."), status=400)
    messages = chat.get_messages().all()
    viewable_data = []
    for message in messages:
        message_data = {
            "creation": datetime_to_iso(message.creation),
            "content": message.content,
            "is_from_self": request.user == message.creator,
            "id": message.id
        }
        viewable_data.append(message_data)
    return JsonResponse(
        default_response_template(
            message="all messages found.", content=viewable_data))


@require_POST
@login_required_json
def new_chat_message(request: HttpRequest) -> JsonResponse:
    chat_message_creation_form = ChatMessageCreationForm(request.POST)

    if chat_message_creation_form.is_valid():
        chat_id = chat_message_creation_form.cleaned_data["chat_id"]
        try:
            # Check if the user is in chat provided by id
            chat = Chat.objects.get(participants=request.user, id=chat_id)
        except Chat.DoesNotExist:
            return JsonResponse(
                default_response_template(
                    message="no ingressed chat for provided id."), status=400) 
        new_message = chat_message_creation_form.save(commit=False)
        new_message.creator = request.user
        new_message.chat = chat
        new_message.save()
        result = JsonResponse(
            default_response_template(message="message created."))
    else:
        result = JsonResponse(
            default_response_template(
                message="message creation failed."), status=400)
        
    return result
        


