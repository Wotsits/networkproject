from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.db.models.query import QuerySet
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator 
from rest_framework.generics import ListAPIView, RetrieveUpdateDestroyAPIView, CreateAPIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers
from network.serializers import LikeSerializer, PostSerializer, CommentSerializer

import json

from .models import User, Post, Comment, Like, Follow
from .forms import NewPostForm, NewCommentForm

def index(request):
    return render(request, "network/index.html")

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 10

#sets the commment pagination size
class CommentResultsSetPagination(PageNumberPagination):
    page_size = 3
    page_size_query_param = 'page_size'
    max_page_size = 3

##############################################################

'''
API classes start here
'''

class apiserveposts(ListAPIView):
    '''
    CBV for serve posts list
    '''

    serializer_class = PostSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        
        source = self.request.GET['source']
        if source == 'index':
            return Post.objects.all().order_by('datetime').reverse()
        elif source =='follow':
            following = Follow.objects.filter(follower=self.request.user)
            # MY FIRST FREAKING LIST COMPREHENSION!!!  YEEEHAAAAWWWW!!!!
            followeelist = [x.followee for x in following]
            return Post.objects.filter(user__in=followeelist)
        else:
            username = self.request.GET['username']
            print(username)
            user = User.objects.get(username=username)
            return Post.objects.filter(user=user).order_by('datetime').reverse()
 
class apiservecommentsbypost(ListAPIView):
    serializer_class = CommentSerializer
    paginations_class = CommentResultsSetPagination
    permission_class = [IsAuthenticated]

    def get_queryset(self):
        postid = self.request.GET['postid']
        post = Post.objects.get(id=postid)
        return Comment.objects.filter(post=post).order_by('datetime').reverse()


class apiservepostdetail(RetrieveUpdateDestroyAPIView):
    queryset            = Post.objects.all()
    serializer_class    = PostSerializer

class apicreatepost(CreateAPIView):
    serializer_class    = PostSerializer

    # this deals with the fact that the form does not submit the user who created the post  .  
    user = serializers.PrimaryKeyRelatedField(
        read_only=True,
    )
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

def createcomment(request):
    if request.method == "POST":
        user    = request.user
        payload = json.loads(request.body)
        postid  = payload["postid"]
        post    = Post.objects.get(id=postid)
        content = payload["content"]
        newcomment = Comment(user=user, post=post, content=content)
        newcomment.save()

        return JsonResponse ({
                "id": newcomment.id,
                "user": {
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "username": user.username
                },
                "content": content
        })


@login_required
def apicreatelike(request):
    if request.method == "POST":
        user    = request.user
        payload = json.loads(request.body)
        postid  = payload["id"]
        post    = Post.objects.get(id=postid)
        like    = Like(user=user, post=post)
        like.save()

        return JsonResponse ({
            "postid": postid,
            "user": user.username
        })
    
    else:
        HttpResponse("This route does not accept a GET request.")

@login_required
def apideletelike(request):
    if request.method == "POST":
        user    = request.user
        payload = json.loads(request.body)
        postid  = payload["id"]
        post    = Post.objects.get(id=postid)
        like    = Like.objects.get(user=user, post=post)
        like.delete()

        return JsonResponse ({
            "postid": postid,
            "user": user.username,
            "status": "deleted"
        })
    
    else:
        HttpResponse("This route does not accept a GET request.")

@login_required
def apilikecountandstatus(request):
    if request.method == "GET":
        user        = request.user
        postid      = request.GET['id']
        post        = Post.objects.get(id=postid)
        likecount   = Like.objects.filter(post=post).count()
        likestatus  = False
        try: 
            Like.objects.get(post=post, user=user)
            likestatus = True
        except:
            likestatus = False
        
        return JsonResponse ({
            "likecount": likecount,
            "likestatus": likestatus
        })

@login_required
def newpost(request):
    if request.method == "POST":

        content = request.POST["content"]
        imageurl = request.POST["imageurl"]
        videourl = request.POST["videourl"]

        # creates and saves new Post object.
        post = Post(content=content, imageurl=imageurl, videourl=videourl, user=request.user)
        post.save()

        # redirects to myprofile
        return JsonResponse ({
            "content": content,
            "imageurl": imageurl,
            "videourl": videourl,
            "user": request.user.username
        })

##############################################################


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
        profilepicurl = request.POST["profilepicurl"]

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


    

def profile(request, username):
    print(username)
    profile = User.objects.get(username=username)
    followstatus = Follow.objects.filter(followee=profile, follower=request.user).count() > 0
    followercount = Follow.objects.filter(followee=profile).count()
    followeecount = Follow.objects.filter(follower=profile).count()
    return render(request, "network/profile.html", {
        'followstatus': followstatus,
        'profile': profile,
        'followcount': followercount,
        'followeecount': followeecount,
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

        return JsonResponse({
            'status': '204' 
        })
            
    else: 

        return render(request, "network/following.html")
