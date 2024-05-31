from django.urls import path

from . import views

urlpatterns = [
    path("", views.homepage, name="homepage"),
    path("map/", views.map, name="map"),
    path("sign-up/", views.sign_up, name="sign-up"),
    path("sign-in/", views.sign_in, name="sign-in"),
    path("sign-out/", views.sign_out, name="sign-out"),
    path("my-notes/", views.my_notes, name="my-notes"),
    path("chat/", views.chat, name="chat"),
    path("api/chat/new-chat/", views.new_chat, name="new-chat"),
    path("api/chat/my-chats/", views.my_chats, name="my-chats"),
    path("api/chat/new-message/", views.new_chat_message, name="new-chat-message"),
    path("api/chat/messages/<int:id>/", views.get_chat_messages, name="chat-messages"),
    path("api/note/create/", views.create_note, name="create-note"),
    path("api/note/actives/location/", views.get_active_notes_locations, name="actives-locations"),
    path("api/note/actives/data/<int:id>/", views.get_active_note_data, name="active-data")
]