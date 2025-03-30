from dbm.sqlite3 import error
from importlib.resources import contents

from django.contrib import messages
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect

from core.forms import MyUserCreationForm
from core.models import User


# Create your views here.

def sign_up(request):
    form = MyUserCreationForm()

    if request.user.is_authenticated:
        return redirect('dashboard')

    if request.method == 'POST':
        return register_user(request)

    context = {
        'form': form,
        'page': 'signup'
    }

    return render(request, 'core/signup.html', context)


def sign_in(request):
    if request.user.is_authenticated:
        return redirect('dashboard')

    if request.method == 'POST':
        return login_user(request)

    context = {
        'page': 'signin'
    }

    return render(request, 'core/signup.html', context)


@login_required(login_url='signin')
def dashboard(request):
    return render(request, 'core/dashboard.html')


def index(request):
    return render(request, 'core/index.html')


@login_required(login_url='signin')
def water_logging(request):
    return render(request, 'core/water_logging.html')


@login_required(login_url='signin')
def onboarding_quiz(request):
    login(request, request.user)
    return render(request, 'core/onboarding_quiz.html')


def register_user(request):
    form = MyUserCreationForm(request.POST)
    if form.is_valid():
        user = form.save(commit=False)
        user.email = user.email.lower()
        user.save()
        login(request, user)
        return render(request, 'core/onboarding_quiz.html')
    context = {
        'form': form,
        'page': 'signup'
    }
    return render(request, 'core/signup.html', context)


def login_user(request):
    email = request.POST['email'].lower()
    user = None
    try:
        user = User.objects.get(email=email)
    except [error, User.DoesNotExist]:
        messages.error(request, "User does not exist")

    if user.profile is None:
        login(request, user)
        return render(request, 'core/onboarding_quiz.html')
    else:
        login(request, user)
        return redirect('dashboard')


def signout(request):
    logout(request)
    return redirect('index')


def food_logging(request):
    return render(request, 'core/food_logging.html')