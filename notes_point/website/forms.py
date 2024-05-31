from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from django.contrib.auth import authenticate
from django.contrib.auth.base_user import AbstractBaseUser
from django.forms import (CharField, Form, IntegerField, ModelForm,
                          ValidationError)
from django.utils.translation import gettext as _

from .models import Note, User, ChatMessage, Chat


class UserSignUpForm(ModelForm):

    # Get user password max_length, so we can use it in confirm_password field.
    user_object_password_max_length = User._meta.get_field(
        "password").max_length

    confirm_password = CharField(max_length=user_object_password_max_length)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def clean(self) -> Dict[str, Any]:
        cleaned_data = super().clean()
        confirm_password_input = cleaned_data.get("confirm_password")
        password_input = cleaned_data.get("password")

        # Raise a ValidationError bound to password field in case password doesn't match.
        if confirm_password_input != password_input:
            self.add_error("password", ValidationError(
                _("Passwords must match."), code="invalid"))

        return cleaned_data

    def save(self, commit: bool = ...) -> Any:
        user = super().save(commit=False)
        password_input = self.cleaned_data["password"]

        # The default ModelForm "save()" method don't use the helper function "create_user()" to create the user.
        # This cause the user to be created without a password, that's why we set the password here.

        user.set_password(password_input)
        if commit:
            user.save()
        return user


class UserSignInForm(Form):

    # Get user model default fields lengths to use in the form.
    user_object_password_max_length = User._meta.get_field(
        "password").max_length
    user_object_username_max_length = User._meta.get_field(
        "username").max_length

    username = CharField(max_length=user_object_password_max_length)
    password = CharField(max_length=user_object_username_max_length)

    def clean(self) -> Dict[str, Any]:
        cleaned_data = super().clean()
        username_input = cleaned_data.get("username")
        password_input = cleaned_data.get("password")

        # Raise a ValidationError if there's no user for the given credentials.
        if authenticate(username=username_input,
                        password=password_input) is None:
            raise ValidationError(
                _("Wrong username or password."), code="invalid")

        return cleaned_data
    
    # Return the user object for the provided form credentials.
    def get_user(self) -> AbstractBaseUser | None:
        username_input = self.cleaned_data.get("username")
        password_input = self.cleaned_data.get("password")
        return authenticate(username=username_input, password=password_input)


class NoteCreationForm(ModelForm):

    duration = IntegerField(max_value=100, min_value=1)

    class Meta:
        model = Note
        fields = ["message", "longitude", "latitude"]

    def save(self, commit: bool = ...) -> Any:
        note = super().save(commit=False)
        duration_input = self.cleaned_data["duration"]

        # Althourgh the note creation would be set automatically when we saved the note,
        # we are setting it manually as we need to calculate the duration datetime based on the creation datetime.
        # But django will override it anyway on save(), because it doesn't permitted setting a DateTimeField that
        # have auto_now_add set to true.

        note.creation = datetime.now(timezone.utc)
        note.duration = note.creation + timedelta(days=duration_input)
    
        if commit:
            note.save()
        return note
    

class ChatMessageCreationForm(ModelForm):

    chat_id = IntegerField()

    class Meta:
        model = ChatMessage
        fields = ["content"]



class ChatCreationForm(Form):

    chat_message_content_max_length = ChatMessage._meta.get_field("content").max_length

    note_id = IntegerField()
    content = CharField(max_length=chat_message_content_max_length)

    def set_request_user(self, user: AbstractBaseUser) -> None:
        # Save reference of request_user for chat creation validation
        self.request_user = user

    def add_chat_creation_data(self, cleaned_data: Dict[str, Any], note: Note) -> Dict[str, Any]:
        cleaned_data["note"] = note
        cleaned_data["participants"] = [note.creator, self.request_user]
        return cleaned_data

    def clean(self) -> Dict[str, Any]:
        cleaned_data =  super().clean()
        note_id = cleaned_data.get("note_id")
        # Check if there's an active note with this id.
        try:
            note = Note.objects.actives().get(id=note_id)
        except Note.DoesNotExist:
            raise ValidationError(
                _("No active note for the provided id."), code="invalid")
        # Check if request user already have a chat about this note
        if Chat.objects.filter(participants=self.request_user, note=note).exists():
            raise ValidationError(
                _("Already on a chat about this note."), code="invalid")
        # Check if request user is note creator
        if self.request_user == note.creator:
            raise ValidationError(
                _("Can't create chat with self."), code="invalid")
        # Adding other necessary data for chat creation.
        cleaned_data = self.add_chat_creation_data(cleaned_data, note=note)
        return cleaned_data
    
    def save(self) -> Any:
        note = self.cleaned_data["note"]
        participants = self.cleaned_data["participants"]

        new_chat = Chat()
        new_chat.note = note
        # To add the participants from the list, we need to save.
        new_chat.save()
        new_chat.add_participants_from_list(participants)

        return new_chat



        
        




    


