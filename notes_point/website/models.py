from __future__ import annotations

from datetime import datetime, timezone
from typing import List

from django.contrib.auth.models import AbstractUser
from django.db import models

from .validators import future_datetime

# Create your models here.

# Customize user model here.
class User(AbstractUser):
    pass


class NoteManager(models.Manager):

    def actives(self) -> models.QuerySet:
        return self.get_queryset().filter(
            duration__gte=datetime.now(timezone.utc))


class Note(models.Model):

    message = models.CharField(max_length=1000)
    creation = models.DateTimeField(auto_now_add=True)
    creator = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notes")
    duration = models.DateTimeField(validators=[future_datetime])
    longitude = models.FloatField()
    latitude = models.FloatField()

    objects = NoteManager()



class Chat(models.Model):
    
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name="chats")
    participants = models.ManyToManyField(User)

    def add_participants_from_list(self, list: List[User]) -> None:
        for user in list:
            self.participants.add(user)

    def last_message(self):
        return self.get_messages().order_by("-creation").first() 
    
    def get_messages(self):
        # Ignore because it can't identify the related_name as a member 
        return self.messages # type: ignore


class ChatMessage(models.Model):

    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name="messages")
    content = models.CharField(max_length=500)
    creator = models.ForeignKey(User, on_delete=models.CASCADE)
    creation = models.DateTimeField(auto_now_add=True)

