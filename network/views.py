from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.core.paginator import Paginator
import json

from .models import User, Post, Comment, Like, Follow
from .forms import NewPostForm, NewCommentForm


def index(request):
    posts = Post.objects.all().order_by('datetime').reverse()
    p = Paginator(posts, 2)
    for page in p:
        print(page.number)
        for post in page:
            print(post)

    
    return render(request, "network/index.html", {
        "title": "Welcome to Network",
        "posts": posts
    })


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

@login_required
def newpost(request):
    if request.method == "POST":
        # creates a NewPostForm object form the posted data.
        form = NewPostForm(request.POST)
        
        # checks if the data is valid before extracting the data into individual variables. 
        if form.is_valid():
            content = form.cleaned_data["content"]
            imageurl = form.cleaned_data["imageurl"]
            videourl = form.cleaned_data["videourl"]

            # creates and saves new Post object.
            post = Post(content=content, imageurl=imageurl, videourl=videourl, user=request.user)
            post.save()

            # redirects to myprofile
            return HttpResponseRedirect(reverse("profile", args=(request.user.username,)))
    
    else:
        # creates a blank NewPostForm
        form = NewPostForm()

        # renders the newpost.html template, passing in the blank NewPostForm
        return render(request, "network/newpost.html", {
            "form": form
        })

def profile(request, username):
    profile = User.objects.get(username=username)
    followstatus = Follow.objects.filter(followee=profile, follower=request.user).count() > 0
    return render(request, "network/profile.html", {
        'followstatus': followstatus,
        'profile': profile
    })

@login_required
@csrf_exempt
def following(request):
    if request.method == "POST":
        # extract the json data from the post request
        data = json.loads(request.body)
        
        # extract the follower
        follower = request.user
        # extract the followee
        followeeid = data.get("followee")
        followee = User.objects.get(id=followeeid)

        # get current follow status
        followstatus = Follow.objects.filter(followee=followee, follower=request.user).count() > 0
        
        # if profile is not followed, create a new follow record.  
        if not followstatus:
            newfollow = Follow(follower=follower, followee=followee)
            newfollow.save()
        # if profile is followed, delete the follow record.
        else:
            Follow.objects.filter(follower=follower, followee=followee).delete()

        return HttpResponse(status=204) 
    
    else: 
        # get a list of the follows where this user is the follower. 
        follows = Follow.objects.filter(follower=request.user)

        # extract from that query set the users who are followed.  
        followed = [followee.followee for followee in follows]
        
        # get the posts by those users.  
        followedposts = Post.objects.filter(user__in=followed)

        return render(request, "network/index.html", {
            'title': "Posts from people you follow",
            'posts': followedposts
        })
