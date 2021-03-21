from rest_framework import serializers
from network.models import User, Post, Comment, Like, Follow

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model   = User
        fields  = ['username', 'first_name', 'last_name', 'profilepictureurl']

class PostSerializer(serializers.ModelSerializer):
    user = UserSerializer(many=False, read_only=True)
    class Meta:
        model   = Post
        fields  = ['id', 'content', 'imageurl', 'videourl', 'user', 'datetime']

class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(many=False, read_only=True)
    post = PostSerializer(many=False, read_only=True)

    class Meta:
        model   = Comment
        fields  = ['id', 'content', 'user', 'post', 'datetime']

class LikeSerializer(serializers.ModelSerializer):
    user = UserSerializer(many=False, read_only=True)
    post = PostSerializer(many=False, read_only=True)
    class Meta: 
        model   = Like
        fields  = ['user', 'post']
