from django.forms import ModelForm, Textarea
from django.forms.fields import URLField
from django.forms.widgets import URLInput

from network.models import Post, Comment


class NewPostForm(ModelForm):
    class Meta:
        model = Post
        fields = ['content', 'imageurl', 'videourl']
        labels = {
            'content': 'Your Post',
            'imageurl': 'Post Image URL',
            'videourl': 'Post Video URL'
        }
        widgets = {
            'content': Textarea(),
            'imageurl': URLInput(attrs={'placeholder': 'http://'}),
            'videourl': URLInput(attrs={'placeholder': 'http://'})
        }
        

class NewCommentForm(ModelForm):
    class Meta:
        model = Comment
        fields = ['content',]
        labels = {
            'content': 'Your Comment'
        }
        widgets = {
            'content': Textarea()
        }