
from django.urls import path

from . import views
from network.views import apiserveposts, apiservepostdetail, apicreatepost, apiservecommentsbypost

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("profile/<str:username>", views.profile, name="profile"),
    path("following", views.following, name="following"),
    path("serveposts", apiserveposts.as_view(), name="apiserveposts"),
    path("post/<int:pk>", apiservepostdetail.as_view(), name="apiservepostdetail"),
    path("newpost", apicreatepost.as_view(), name="newpost"),
    path("newlike", views.apicreatelike, name="createlike"),
    path("likecountandstatus", views.apilikecountandstatus, name="likecount"),
    path("dellike", views.apideletelike, name="deletelike"),
    path("servecomments", apiservecommentsbypost.as_view(), name="servecomments"),
    path("newcomment", views.createcomment, name="createcomment")
]
