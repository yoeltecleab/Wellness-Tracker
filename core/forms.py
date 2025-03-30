from django.contrib.auth.forms import UserCreationForm
from django import forms

from core.models import User


class MyUserCreationForm(UserCreationForm):
    email = forms.EmailField(label='Email Address')
    password1 = forms.CharField(label='Password', widget=forms.PasswordInput)
    password2 = forms.CharField(label='Confirm Password', widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ['email', 'password1', 'password2']