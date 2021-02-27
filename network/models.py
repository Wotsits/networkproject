from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.deletion import PROTECT
import datetime


class User(AbstractUser):
    profilepictureurl = models.CharField(max_length=1000, blank=True)
    fromlocation = models.CharField(max_length=255, blank=True)
    currentlocation = models.CharField(max_length=255, blank=True)


class Post(models.Model):
    content = models.CharField(max_length=1000)
    imageurl = models.URLField(blank=True)
    videourl = models.URLField(blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="postsbyuser")
    datetime = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return(f'{self.user} posted post {self.id}')

class Comment(models.Model):
    content = models.CharField(max_length=1000)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="commentsbyuser")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="commentsbypost")

    def __str__(self):
        return(f'{self.user} commented on {self.post}')

class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="likesbyuser")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likesbypost")

    def __str__(self):
        return(f'{self.user} likes {self.post}')

class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following")
    followee = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followedby")

    def serialize(self):
        return {
            "id": self.id,
            "follower": self.follower,
            "followee": self.followee,
        }

    def __str__(self):
        return(f'{self.follower} follows {self.followee}')